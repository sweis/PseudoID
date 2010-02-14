#!/usr/bin/python

"""
A private OpenID provider implementation.

@author arkajit.dey@gmail.com (Arkajit Dey)
"""

import logging
import os
import pprint
import sys
import traceback
import urlparse

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app

from openid.message import Message
from openid.message import IDENTIFIER_SELECT
from openid.server import server as OpenIDServer

import attrutil
import store
import tokenutil

_DEBUG = True # Set to True if stack traces should be shown in the browser, etc.

# the global openid server instance
oidserver = None

_TESTING = False # Set to true during testing, to use localhost
HOST = 'http://www.pseudoid.net'
if _TESTING:
  HOST = 'http://localhost:9999'

def InitializeOpenId():
  global oidserver
  oidserver = OpenIDServer.Server(store.DatastoreStore(), HOST+'/anon')

class Handler(webapp.RequestHandler):
  """A base handler class with a couple OpenID-specific utilities."""

  def ArgsToDict(self):
    """Converts the URL and POST parameters to a singly-valued dictionary.

    Returns:
      dict with the URL and POST body parameters
    """
    req = self.request
    return dict([(arg, req.get(arg)) for arg in req.arguments()])

  def GetOpenIdRequest(self):
    """Creates and OpenIDRequest for this request, if appropriate.

    If this request is not an OpenID request, returns None. If an error occurs
    while parsing the arguments, returns False and shows the error page.

    Return:
      An OpenIDRequest, if this user request is an OpenID request. Otherwise
      False.
    """
    try:
      oidrequest = oidserver.decodeRequest(self.ArgsToDict())
      logging.debug('OpenID request: %s' % oidrequest)
      return oidrequest
    except:
      trace = ''.join(traceback.format_exception(*sys.exc_info()))
      self.ReportError('Error parsing OpenID request:\n%s' % trace)
      return False

  def Respond(self, oidresponse):
    """Send an OpenID response.

    Args:
      oidresponse: OpenIDResponse
      The response to send, usually created by OpenIDRequest.answer().
    """
    logging.warning('Respond: oidresponse.request.mode ' + oidresponse.request.mode)

    if oidresponse.request.mode in ['checkid_immediate', 'checkid_setup']:
      attrutil.AddAXResponse(oidresponse.request, oidresponse)

    logging.debug('Using response: %s' % oidresponse)
    encoded_response = oidserver.encodeResponse(oidresponse)

    # update() would be nice, but wsgiref.headers.Headers doesn't implement it
    for header, value in encoded_response.headers.items():
      self.response.headers[header] = str(value)

    if encoded_response.code in (301, 302):
      self.redirect(self.response.headers['location'])
    else:
      self.response.set_status(encoded_response.code)

    if encoded_response.body:
      logging.debug('Sending response body: %s' % encoded_response.body)
      self.response.out.write(encoded_response.body)
    else:
      self.response.out.write('')

  def Render(self, template_name, extra_values={}, content=None):
    """Render the given template, including the extra (optional) values.

    Args:
      template_name: string
      The template to render.

      extra_values: dict
      Template values to provide to the template.
    """
    parsed = urlparse.urlparse(self.request.uri)
    request_url_without_path = parsed[0] + '://' + parsed[1]
    request_url_without_params = request_url_without_path + parsed[2]
    logging.debug('Request URL = %s' % request_url_without_path)

    values = {
      'request': self.request,
      'request_url_without_path': request_url_without_path,
      'request_url_without_params': request_url_without_params,
      'user': users.get_current_user(),
      'login_url': users.create_login_url(self.request.uri),
      'logout_url': users.create_logout_url('/'),
      'debug': self.request.get('deb'),
    }
    values.update(extra_values)
    cwd = os.path.dirname(__file__)
    path = os.path.join(cwd, 'templates', template_name)
    logging.debug(path)
    if content:
      self.response.headers['content-type'] = content
    self.response.out.write(template.render(path, values, debug=_DEBUG))

  def ReportError(self, message):
    """Shows an error HTML page.

    Args:
      message: string
      A detailed error message.
    """
    args = pprint.pformat(self.ArgsToDict())
    cookies = tokenutil.GetAllCookies()
    self.Render('error.html', vars())
    logging.error(message)

  def CheckUser(self):
    """Checks that the OpenID identity being asserted is owned by this user.
    Specifically, checks that the appropriate cookie is set.

    Returns:
      True if a valid cookie is set. False otherwise.
    """
    tok = tokenutil.Token.FromCookie()
    if tok:
      logging.debug('Cookie tiresias found.')
      return tok.Verify()
    else:
      logging.debug('Cookie tiresias not found.')
      return False

  def ShowFrontPage(self):
    """Do an internal (non-302) redirect to the front page.

    Preserves the user agent's requested URL.
    """
    front_page = FrontPage()
    front_page.request = self.request
    front_page.response = self.response
    front_page.get()

class Login(Handler):
  """Handles OpenID requests: associate, checkid_setup, checkid_immediate."""

  def get(self):
    """Handles GET requests."""
    logging.debug("Login received request %s " % self.ArgsToDict())
    login_url = users.create_login_url(self.request.uri)
    oidrequest = self.GetOpenIdRequest()
    
    if oidrequest is False:
      return  # there was an error, and GetOpenIdRequest displayed it. bail out.
    elif oidrequest is None:
      self.ShowFrontPage()  # this is a request from a browser
    elif oidrequest.mode in ['checkid_immediate', 'checkid_setup']:
      if oidrequest.immediate:
        self.Respond(oidrequest.answer(False, server_url=login_url))
      elif oidrequest.identity == IDENTIFIER_SELECT:
        logging.debug("Identifier Select Flow")
        tok = tokenutil.Token.FromCookie()
        if tok and tok.Verify():
          id = '%s/id?nick=%s&id=%s' % (self.request.host_url,
                                        tok.GetSafeNick(), tok.Digest())
          self.Respond(oidrequest.answer(True, identity=id))
        else:
          self.Respond(oidrequest.answer(False, server_url=login_url))
      else:
        logging.debug("Claimed Identifier Flow")
        if self.CheckUser():
          self.Render('prompt.html', vars())
        else:
          self.Respond(oidrequest.answer(False, server_url=login_url))
    elif oidrequest.mode in ['associate', 'check_authentication']:
      self.Respond(oidserver.handleRequest(oidrequest))
    else:
      self.ReportError('Unknown mode: %s' % oidrequest.mode)

  post = get

class FinishLogin(Handler):
  """Handle a POST response to the OpenID login prompt form."""
  def post(self):
    logging.debug("FinishLogin post received request %s " % self.request)
    args = self.ArgsToDict()

    try:
      oidrequest = OpenIDServer.CheckIDRequest.fromMessage(
                          Message.fromPostArgs(args), oidserver.op_endpoint)
    except:
      trace = ''.join(traceback.format_exception(*sys.exc_info()))
      self.ReportError('Error decoding login request:\n%s' % trace)
      return
    
    if self.CheckUser():
      logging.debug('Confirming identity to %s' % oidrequest.trust_root)
      self.Respond(oidrequest.answer(True))
    else:
      logging.debug('Login denied, sending cancel to %s' %
                    oidrequest.trust_root)
      self.Respond(oidrequest.answer(False))
      
class FrontPage(Handler):
  """Show the default OpenID page."""
  def get(self):
    logging.debug("FrontPage get received request %s " % self.ArgsToDict())
    logging.debug("App Host is %s" % self.request.host_url)
    self.Render('main.html', vars())
      
class Endpoint(Handler):
  def get(self):
    logging.debug("Endpoint received request %s from host %s" % 
                  (self.request, self.request.host_url))
    self.Render('server', vars(), 'application/xrds+xml')
  
  post = get

class SignOn(Handler):
  def get(self):
    logging.debug("SignOn received request %s from host %s" % 
                  (self.request, self.request.host_url))
    self.Render('id', vars(), 'application/xrds+xml')
  
  post = get

class SetCookie(Handler):
  def get(self):
    logging.debug("SetCookie received request %s from host %s" % 
                  (self.request, self.request.host_url))
    self.Render('setcookie.html', vars())
  
  post = get

_URLS = [ # Map URLs to our RequestHandler classes above
  ('/', FrontPage),
  ('/server', Endpoint),
  ('/login', FinishLogin),
  ('/anon', Login),
  ('/id', SignOn),
  ('/setcookie', SetCookie)
]

def main(argv):
  application = webapp.WSGIApplication(_URLS, debug=_DEBUG)
  InitializeOpenId()
  run_wsgi_app(application)
  
if __name__ == '__main__':
  main(sys.argv)
