// Copyright 2009 Google Inc. All Rights Reserved.

/**
 * @fileoverview Using blinder to set cookies and verify them.
 * @author arkajit.dey@gmail.com (Arkajit Dey)
 *
 * Depends on blinder.
 */

var pubKey = PublicKey.fromUrl("/pubkey");
var TESTING = false;
var HOST = TESTING ? 'http://localhost:9999' : 'http://www.pseudoid.net';

function newToken() {
  var tok = pubKey.generateToken($('nick').value);
  if (!tok.isValid()) {
    tok = pubKey.generateToken($('nick').value);  // Try one more time
  }
  return tok;
}

function setCookie() {
  tok = newToken();
  setCookieWithIframe(tok);
  logTokenCreation(tok);
}

function setLocalCookie() {
  tok = newToken();
  var path = ($('path')) ? $('path').value : '';
  var domain = ($('domain')) ? $('domain').value : '.appspot.com';
  setTokenAsCookie(tok, 'tiresias', 1, path, domain);
  logTokenCreation(tok);
}

function getCookie() {
  displayToken(getTokenFromCookie('tiresias'));
}

function deleteCookie(name) {
  setTokenAsCookie(null, name, -1, $('path').value, $('domain').value);
  $('tokenout').innerHTML = 'OK. Cookie deleted.';
}

function setCookieWithIframe(token) {
  var value = (token == null) ? "" : token.value();  

  var iframe = '<iframe style="display:none" src="{0}/setcookie#{1}"></iframe>';
  $('iframeout').innerHTML = iframe.replace('{0}', HOST)
                                   .replace('{1}', value)
}

function setTokenAsCookie(token, name, exp_hours, path, domain) {
  var value = (token == null) ? "" : token.value();
  
  if (exp_hours) {
    var now = new Date();
    now.setHours(now.getHours()+exp_hours);
    expires = now.toUTCString();
  } else {
    expires = null;
  }
  
  var cook =      name+"="+escape(value) +
                  (expires ? "; expires="+expires : "") +
                  (path ? "; path="+path : "") +
                  (domain ? "; domain="+domain : "");
  document.cookie = cook;
}

function getTokenFromCookie(name) {
  if (document.cookie.length > 0) {
    var start = document.cookie.indexOf(name+"=");
    if (start != -1) {
      start += name.length+1;
      var end = document.cookie.indexOf(";", start);
      end = (end == -1) ? document.cookie.length : end;
      var str = unescape(document.cookie.substring(start, end));
      return Token.fromString(str);
    }
  }
  return null;
}

function logTokenCreation(tok) {
  $('tokenout').innerHTML = TESTING ? 
          'OK. Cookie set for token: ' + tok.value() : 
          'Token generated! <a href="' + HOST +
          '">Return to Identity Provider</a> ' + 
          'to try out new nickname.';
}

function displayToken(token) {
  var info;
  if (token) {
    info = '<p>msg = '+token.msg+'</p>' + 
           '<p>sig = '+token.sig+'</p>' +
           '<p>sig is ' + (token.isValid() ? 'VALID' : 'INVALID') + '!</p>';
  } else {
    info = "No Cookie Found!";
  }
  $('tokenout').innerHTML = info;
}
