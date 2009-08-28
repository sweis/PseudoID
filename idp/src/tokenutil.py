#!/usr/bin/python

"""
A utility class for handling access tokens.

@author: arkajit.dey@gmail.com (Arkajit Dey)
"""

import Cookie
import base64
import hashlib
import logging
import os
import urllib
import urllib2

def GetAllCookies():
  cookies = os.environ.get('HTTP_COOKIE', None)
  if cookies:
    return Cookie.BaseCookie(cookies)
  else:
    return {}

def GetTiresiasCookie():
  cookies = GetAllCookies()
  return urllib.unquote(cookies['tiresias'].value).split(":", 1)

class Token(object):
  """Represents a Tiresias cookie with semantics for nickname/id extraction."""
  
  def __init__(self, msg, sig):
    self._msg = msg
    self._sig = sig
  
  def __str__(self):
    return ':'.join([self._msg, self._sig])
  
  @staticmethod
  def FromString(s):
    try:
      (msg, sig) = s.split(":", 1)
      return Token(msg, sig)
    except ValueError:
      return None
  
  @staticmethod
  def FromCookie():
    try:
      cookies = GetAllCookies()
      return Token.FromString(urllib.unquote(cookies['tiresias'].value))
    except KeyError:
      return None
  
  def Digest(self):
    sha = hashlib.sha256()
    sha.update(str(self))
    hashed = sha.digest()
    return base64.urlsafe_b64encode(hashed).replace("=", "")
  
  def Verify(self):
    """
    Verifies the signature on the token.
    
    TODO(arkajit): maybe we should be verifying the signature on our own without
    invoking the BSS? just get the pubkey beforehand?    
    
    @return: True if signature verifies. False otherwise.
    @rtype: boolean
    """
    data = {'auto': 'true', 'msg': self._msg, 'sig': self._sig}
    post_data = urllib.urlencode(data)
    f = urllib2.urlopen("http://blind-signer.appspot.com/verify", post_data)
    result = bool(int(f.read().strip()))
    logging.debug('Verify Result = %s ' % result)
    return result
  
  def GetNickname(self):
    try:
      return base64.urlsafe_b64decode(self._msg).split(":")[0]
    except TypeError:
      return None
  
  def GetSafeNick(self):
    return urllib.quote(self.GetNickname())