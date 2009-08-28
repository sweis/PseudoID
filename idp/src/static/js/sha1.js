// (c) Copyright Google Inc. 2005

/**
 * SHA-1 cryptographic hash
 * @constructor
 */
function SHA1() {
  this.chain_ = new Array(5);
  this.buf_ = new Array(64);
  this.W_ = new Array(80);
  this.pad_ = new Array(64);
  this.pad_[0] = 128;
  for (var i = 1; i < 64; ++i) {
    this.pad_[i] = 0;
  }

  this.reset();
}

/**
 * Reset the internal accumulator
 */
SHA1.prototype.reset = function() {
  this.chain_[0] = 0x67452301;
  this.chain_[1] = 0xefcdab89;
  this.chain_[2] = 0x98badcfe;
  this.chain_[3] = 0x10325476;
  this.chain_[4] = 0xc3d2e1f0;

  this.inbuf_ = 0;
  this.total_ = 0;
}

/**
 * Internal helper performing 32 bit left rotate
 * @returns {number} w rotated left by r bits
 * @private
 */
SHA1.prototype.rotl_ = function(w, r) {
  return ((w << r) | (w >>> (32 - r))) & 0xffffffff;
}

/**
 * Internal compress helper function
 * @param {Array} buf containing block to compress
 * @private
 */
SHA1.prototype.compress_ = function(buf) {
  var W = this.W_;

  // get 16 big endian words
  for (var i = 0; i < 64; i += 4) {
    var w = (buf[i] << 24) |
            (buf[i+1] << 16) |
            (buf[i+2] << 8) |
            (buf[i+3]);
    W[i / 4] = w;
  }

  // expand to 80 words
  for (var i = 16; i < 80; ++i) {
    W[i] = this.rotl_(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
  }

  var A = this.chain_[0];
  var B = this.chain_[1];
  var C = this.chain_[2];
  var D = this.chain_[3];
  var E = this.chain_[4];
  var f, k;

  for (var i = 0; i < 80; ++i) {
    if (i < 40) {
      if (i < 20) {
        f = D ^ (B & (C ^ D));
        k = 0x5a827999;
      } else {
        f = B ^ C ^ D;
        k = 0x6ed9eba1;
      }
    } else {
      if (i < 60) {
        f = (B & C) | (D & (B | C));
        k = 0x8f1bbcdc;
      } else {
        f = B ^ C ^ D;
        k = 0xca62c1d6;
      }
    }

    var t = (this.rotl_(A, 5) + f + E + k + W[i]) & 0xffffffff;
    E = D;
    D = C;
    C = this.rotl_(B, 30);
    B = A;
    A = t;
  }

  this.chain_[0] = (this.chain_[0] + A) & 0xffffffff;
  this.chain_[1] = (this.chain_[1] + B) & 0xffffffff;
  this.chain_[2] = (this.chain_[2] + C) & 0xffffffff;
  this.chain_[3] = (this.chain_[3] + D) & 0xffffffff;
  this.chain_[4] = (this.chain_[4] + E) & 0xffffffff;
}

/**
 * Add byte array to internal accumulator
 * @param {Array} bytes to add to digest
 * @param {number} opt_length is # of bytes to compress
 */
SHA1.prototype.update = function(bytes, opt_length) {
  if (!opt_length) {
    opt_length = bytes.length;
  }

  var n = 0;

  // optimize for 64 byte chunks at 64 byte boundaries..
  if (this.inbuf_ == 0) {
    while (n + 64 < opt_length) {
      this.compress_(bytes.slice(n, n + 64));
      n += 64;
      this.total_ += 64;
    }
  }

  while (n < opt_length) {
    this.buf_[this.inbuf_++] = bytes[n++];
    ++this.total_;

    if (this.inbuf_ == 64) {
      this.inbuf_ = 0;
      this.compress_(this.buf_);

      // pick up 64 byte chunks..
      while (n + 64 < opt_length) {
        this.compress_(bytes.slice(n, n + 64));
        n += 64;
        this.total_ += 64;
      }
    }
  }
}

/**
 * @returns {Array} byte[20] containing finalized hash
 */
SHA1.prototype.digest = function() {
  var digest = new Array(20);
  var totalBits = this.total_ * 8;

  // add pad 0x80 0x00*
  if (this.inbuf_ < 56) {
    this.update(this.pad_, 56 - this.inbuf_);
  } else {
    this.update(this.pad_, 64 - (this.inbuf_ - 56));
  }

  // add # bits
  for (var i = 63; i >= 56; --i) {
    this.buf_[i] = totalBits & 255;
    totalBits >>>= 8;
    }

  this.compress_(this.buf_);

  var n = 0;
  for (var i = 0; i < 5; ++i) {
    for (var j = 24; j >= 0; j -= 8) {
      digest[n++] = (this.chain_[i] >> j) & 255;
    }
  }

  return digest;
}