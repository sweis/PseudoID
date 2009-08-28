// Copyright 2009 Google Inc. All Rights Reserved.

/**
 * @fileoverview Prototype Blinding Functions.
 * @author arkajit@google.com (Arkajit Dey)
 *
 * Depends on jsbn: http://www-cs-students.stanford.edu/~tjw/jsbn/
 */

function $(s) {
  return document.getElementById(s); 
}

function PublicKey(n, e) {
  this.n = n;       // modulus
  this.e = e;       // public exponent
  this.r = null;    // random factor used in last blinding operation
  this.keySize = this.n.bitLength();
  this.rnd = new SecureRandom();
}

PublicKey.fromUrl = function(url) {
  var req = new XMLHttpRequest();
  req.open("GET", url, false);
  req.send(null);
  var key = eval('(' + req.responseText + ')');
  return new PublicKey(new BigInteger(key.modulus), 
                       new BigInteger(key.publicExponent));
}

PublicKey.prototype.randomInteger = function() {
  return new BigInteger(this.keySize, this.rnd);
}

PublicKey.prototype.blindingFactor = function() {
  var factor = BigInteger.ZERO;
  do {
    factor = this.randomInteger();
  } while (factor.compareTo(this.n) >= 0 || 
           factor.gcd(this.n).compareTo(BigInteger.ONE));
  return factor;
}

PublicKey.prototype.blind = function(m) {
  this.r = this.blindingFactor();
  return m.multiply(this.r.modPow(this.e, this.n)).mod(this.n);
}

PublicKey.prototype.unblind = function(s) {
  return s.multiply(this.r.modInverse(this.n)).mod(this.n);
}

PublicKey.prototype.hashAndPad = function(msgBytes) {
  var k = this.keySize / 8; // 2048 bit-key, k=256
  var i;
  var arr = new Array(k); // array of bytes/ints
  var sha1Header = [0x30, 0x21, 0x30, 0x09, 0x06, 0x05, 0x2b, 0x0e, 0x03, 0x02,
                    0x1a, 0x05, 0x00, 0x04, 0x14];
  var md = new SHA1();
  md.update(msgBytes);
  var sha1Hash = md.digest(); // 20 byte array
  var headerLen = sha1Header.length; // 15
  var hashLen = sha1Hash.length; // 20
  var t = headerLen + hashLen; // 35
  
  for(i = 0; i < k; i++) {
    arr[i] = 0xff;
  }
  arr[0] = 0x00;
  arr[1] = 0x01;
  // everything in between is left as 0xff
  arr[k-t-1] = 0x00;
  
  // add in header
  for (i = 0; i < headerLen; i++) {
    arr[k-t+i] = sha1Header[i];
  }
  
  // add in hash bytes
  for (i = 0; i < hashLen; i++) {
    arr[k-hashLen+i] = sha1Hash[i];
  }
  
  return new BigInteger(arr);
}

PublicKey.prototype.generateToken = function() {
  var t = this.randomInteger();
  var msg = hex2b64(t.toString(16));
  var m = this.hashAndPad(b64toBA(msg));
  var b = this.blind(m);
  var s = new BigInteger(sign(b.toString(16)), 16);
  var u = this.unblind(s);
  var sig = hex2b64(u.toString(16));
  return new Token(msg, sig);
}

function Token(msg, sig) {
  this.msg = msg;
  this.sig = sig;
}

Token.fromString = function(s) {
  var strs = s.split(":");
  return new Token(strs[0], strs[1]);
}

Token.prototype.isValid = function() {
  return verify(this.msg, this.sig);
}

Token.prototype.value = function() {
  return [this.msg, this.sig].join(":");
}

// Servlet AJAX Requests

function sign(tok) {
  var req = new XMLHttpRequest();
  req.open("POST", "/sign", false);
  req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
  req.send("tok="+tok);
  return req.responseText; //BigInt hex
}

function verify(msg, sig) {
  var req = new XMLHttpRequest();
  req.open("POST", "/verify", false);
  req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
  req.send("msg="+msg+"&sig="+sig);
  return parseInt(req.responseText, 10);
}

// Str Utils

function strToBytes(s) {
  return (s == null) ? [] : [s.charCodeAt(i) for (i in s)];
}

function bytesToStr(arr) {
  chars = [String.fromCharCode(x) for each (x in arr)];
  return chars.join("");
}