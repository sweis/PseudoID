#!/usr/bin/python

"""
An OpenIDStore implementation that uses the datastore as its backing store.
Stores associations, nonces, and authentication tokens.

OpenIDStore is an interface from JanRain's OpenID python library:
  http://openidenabled.com/python-openid/

For more, see openid/store/interface.py in that library.

Adapted from appengine sample code to be OpenID 2.0 compliant.

@author: arkajit.dey@gmail.com (Arkajit Dey)
"""

import time

from openid.association import Association
from openid.store.interface import OpenIDStore
from openid.store import nonce
from google.appengine.api import datastore
from google.appengine.ext import db

class Nonce(db.Model):
  server_url = db.StringProperty(required=True)
  timestamp = db.IntegerProperty(required=True)
  salt = db.StringProperty(required=True)

class DatastoreStore(OpenIDStore):
  """An OpenIDStore implementation that uses the datastore. See
  openid/store/interface.py for in-depth descriptions of the methods.

  They follow the OpenID python library's style, not Google's style, since
  they override methods defined in the OpenIDStore class.
  """

  def storeAssociation(self, server_url, association):
    """
    This method puts a C{L{Association <openid.association.Association>}}
    object into storage, retrievable by server URL and handle.
    """
    entity = datastore.Entity('Association')
    entity['url'] = server_url
    entity['handle'] = association.handle
    entity['association'] = association.serialize()
    datastore.Put(entity)

  def getAssociation(self, server_url, handle=None):
    """
    This method returns an C{L{Association <openid.association.Association>}}
    object from storage that matches the server URL and, if specified, handle.
    It returns C{None} if no such association is found or if the matching
    association is expired.

    If no handle is specified, the store may return any association which
    matches the server URL. If multiple associations are valid, the
    recommended return value for this method is the one that will remain valid
    for the longest duration.
    """
    query = datastore.Query('Association', {'url =': server_url})
    if handle:
      query['handle ='] = handle

    results = query.Get(1)
    if results:
      association = Association.deserialize(results[0]['association'])
      if association.getExpiresIn() > 0:
        # hasn't expired yet
        return association

    return None

  def removeAssociation(self, server_url, handle):
    """
    This method removes the matching association if it's found, and returns
    whether the association was removed or not.
    """
    query = datastore.Query('Association',
                            {'url =': server_url, 'handle =': handle})

    results = query.Get(1)
    if results:
      datastore.Delete(results[0].key())
  
  def cleanupAssociations(self):
    query = datastore.Query('Association')
    results = query.Get(100)
    numDeleted = 0
    
    for result in results:
      assoc = Association.deserialize(result['association'])
      if assoc.getExpiresIn() == 0:
        numDeleted += 1
        datastore.Delete(result.key())
    
    return numDeleted
  
  def useNonce(self, server_url, timestamp, salt):
    if abs(timestamp - time.time()) > nonce.SKEW:
      return False
    
    query = db.GqlQuery("""SELECT * FROM Nonce
                           WHERE server_url = :url
                             AND timestamp = :stamp
                             AND salt = :slt""",
                             url=server_url, stamp=timestamp, slt=salt)
    
    if query.count(1):
      return False
    else:
      self.storeNonce(server_url, timestamp, salt)
      return True
    
  def cleanupNonces(self):
    now = int(time.time())
    query = db.GqlQuery("""SELECT * FROM Nonce
                           WHERE timestamp < :lim""",
                           lim=(now-nonce.SKEW))
    numDeleted = query.count()
    for result in query:
      result.delete()
    return numDeleted
  
  def storeNonce(self, server_url, timestamp, salt):
    """
    Stores a nonce. This is used by the consumer to prevent replay attacks.
    """
    nonce = Nonce(server_url=server_url,
                  timestamp=timestamp,
                  salt=salt)
    nonce.put()