// Copyright 2009 Google Inc. All Rights Reserved.

/**
 * @fileoverview Using blinder to set cookies and verify them.
 * @author arkajit@google.com (Arkajit Dey)
 *
 * Depends on blinder.
 */

var pubKey = PublicKey.fromUrl("/static/pubkey");

function setCookie() {
  var tok = pubKey.generateToken();
  var path = ($('path')) ? $('path').value : '/checkcookie';
  var domain = ($('domain')) ? $('domain').value : 'blind-signer.appspot.com';
  setTokenAsCookie(tok, 'tiresias', 1, path, domain);
  $('tokenout').innerHTML = 'OK. Cookie set for token: ' + tok.value();
}

function getCookie() {
  displayToken(getTokenFromCookie('tiresias'));
}

function deleteCookie(name) {
  setTokenAsCookie(null, name, -1, $('path').value, $('domain').value);
  $('tokenout').innerHTML = 'OK. Cookie deleted.';
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
  //alert("Setting cook = " + cook);
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