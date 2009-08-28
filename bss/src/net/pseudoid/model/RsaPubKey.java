package net.pseudoid.model;

import com.google.gson.annotations.Expose;

import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;

public class RsaPubKey {
  
  // public RSA parameters
  @Expose private String modulus;
  @Expose private String publicExponent;
  
  private BigInteger n;
  private BigInteger e;
  
  @SuppressWarnings("unused")
  private RsaPubKey() {    
    // for GSON
  }
  
  public RsaPubKey(String modulus, String publicExponent) {
    this.modulus = modulus;
    this.publicExponent = publicExponent;
    init();
  }
  
  public RsaPubKey(BigInteger n, BigInteger e) {
    this.n = n;
    this.e = e;
    
    this.modulus = n.toString();
    this.publicExponent = e.toString();
  }
  
  public static RsaPubKey read(String input) {
    RsaPubKey key = Util.gson().fromJson(input, RsaPubKey.class);
    key.init();
    return key;
  }
  
  private void init() {
    this.n = new BigInteger(this.modulus);
    this.e = new BigInteger(this.publicExponent);
  }
  
  @Override
  public String toString() {
    return Util.gson().toJson(this);
  }
  
  public String modulus() {
    return modulus;
  }
  
  public String publicExponent() {
    return publicExponent;
  }
  
  public BigInteger n() {
    return n;
  }
  
  public BigInteger e() {
    return e;
  }
  
  public RSAPublicKey asRSAPublicKey() {
    try {
      if (n == null || e == null) {
        System.out.println("ERROR: n and/or e are null.");
      }
      KeyFactory factory = KeyFactory.getInstance("RSA");
      RSAPublicKeySpec spec = new RSAPublicKeySpec(n, e);
      return (RSAPublicKey) factory.generatePublic(spec);
    } catch (GeneralSecurityException e) {
      e.printStackTrace();
      return null;
    }
  }
  
  public boolean verify(byte[] data, byte[] signature) {
    try {
      RSAPublicKey pubKey = this.asRSAPublicKey();
      Signature verifier = Signature.getInstance("SHA1withRSA");
      verifier.initVerify(pubKey);
      verifier.update(data);
      return verifier.verify(signature);
    } catch (GeneralSecurityException e) {
      e.printStackTrace();
      return false;
    }
  }
}