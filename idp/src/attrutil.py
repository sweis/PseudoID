#!/usr/bin/python

"""
A utility module for handling AX requests and responses.

@author: arkajit.dey@gmail.com (Arkajit Dey)
"""

from openid.extensions import ax

def GetAttributes():
  """
  Extract attributes from Attribute Token.
  
  @return: dictionary of attributes
  @rtype: dict
  
  """
  return {'http://axschema.org/contact/email': 'harry@potter.com',
          'http://axschema.org/namePerson/friendly': 'harrypotter',
          'http://axschema.org/namePerson/first': 'Harry',
          'http://axschema.org/namePerson/last': 'Potter',
          'http://axschema.org/pref/language': 'en-GB',
          'http://axschema.org/contact/country/home': 'GB',
          'http://axschema.org/pref/timezone': 'Europe/London'}
  
def AddAXResponse(request, response):
  fetch_req = ax.FetchRequest.fromOpenIDRequest(request)
  if not fetch_req:
    fetch_req = ax.FetchRequest()
  
  fetch_resp = ax.FetchResponse(fetch_req)
  attrs = GetAttributes()
  for attr in fetch_req.getRequiredAttrs():
    fetch_resp.addValue(attr, attrs.get(attr))
  response.addExtension(fetch_resp)