// Copyright 2009 Google Inc. All Rights Reserved.

/**
 * @fileoverview Blinding Form Experiment Functions
 * @author arkajit@google.com (Arkajit Dey)
 *
 * Depends on blinder.
 */

var pubKey = PublicKey.fromUrl("/pubkey");

function generateMessage() {
  var t = pubKey.randomInteger();
  var msg = hex2b64(t.toString(16));
  $('msg').value = msg;
}

function blindMessage() {
  var msg = $('msg').value; // Str
  var m = pubKey.hashAndPad(b64toBA(msg)); // BigInt
  var blinded = pubKey.blind(m);
  $('blinded').value = blinded.toString(16);
  $('factor').value = pubKey.r.toString(16);
}

function signMessage() {
  var tok = $('blinded').value;
  $('sig').value = sign(tok);
}

function verifySignature() {
  var msg = $('msg').value; // B64 Str
  var sig = $('unblinded').value; // B64 Str
  var valid = verify(msg, sig);
  alert("Signature is " + (valid ? "VALID" : "INVALID") + "!");
}

function unblindSignature() {
  var sig = $('sig').value;
  var s = new BigInteger(sig, 16);
  $('unblinded').value = hex2b64(pubKey.unblind(s).toString(16));
}