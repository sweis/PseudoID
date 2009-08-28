package net.pseudoid.model;

import com.google.gson.annotations.Expose;

import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.RSAPrivateCrtKeySpec;

public class RsaPrivKey {
  
  @Expose private RsaPubKey pubKey;
  
  // private RSA parameters
  @Expose private String privateExponent;
  @Expose private String primeP;
  @Expose private String primeQ;
  @Expose private String primeExponentP;
  @Expose private String primeExponentQ;
  @Expose private String crtCoefficient;
  
  private BigInteger d;
  private BigInteger p;
  private BigInteger q;
  private BigInteger dP;
  private BigInteger dQ;
  private BigInteger qInv;
  
  public RsaPrivKey() {
    // for GSON
  }
  
  public RsaPrivKey(String modulus, String publicExponent, 
                   String privateExponent, String primeP, String primeQ, 
                   String primeExponentP, String primeExponentQ, 
                   String crtCoefficient) {
    super();
    this.pubKey = new RsaPubKey(modulus, publicExponent);
    this.privateExponent = privateExponent;
    this.primeP = primeP;
    this.primeQ = primeQ;
    this.primeExponentP = primeExponentP;
    this.primeExponentQ = primeExponentQ;
    this.crtCoefficient = crtCoefficient;
    init();
  }

  private void init() {
    this.d = new BigInteger(this.privateExponent);
    this.p = new BigInteger(this.primeP);
    this.q = new BigInteger(this.primeQ);
    this.dP = new BigInteger(this.primeExponentP);
    this.dQ = new BigInteger(this.primeExponentQ);
    this.qInv = new BigInteger(this.crtCoefficient);
  }
  
  public RsaPrivKey(BigInteger n, BigInteger e, BigInteger d, BigInteger p, 
                   BigInteger q, BigInteger dp, BigInteger dq, BigInteger crt) {
    super();
    this.d = d;
    this.p = p;
    this.q = q;
    dP = dp;
    dQ = dq;
    qInv = crt;
    
    this.pubKey = new RsaPubKey(n, e);
    this.privateExponent = d.toString();
    this.primeP = p.toString();
    this.primeQ = q.toString();
    this.primeExponentP = dp.toString();
    this.primeExponentQ = dq.toString();
    this.crtCoefficient = crt.toString();
  }

  public static RsaPrivKey read(String input) {
    RsaPrivKey key = Util.gson().fromJson(input, RsaPrivKey.class);
    key.init();
    return key;
  }
  
  public static RsaPrivKey generate() throws GeneralSecurityException {
    KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
    kpg.initialize(2048); // 2048-bit RSA
    KeyPair pair = kpg.generateKeyPair();
    RSAPrivateCrtKey rpk = (RSAPrivateCrtKey) pair.getPrivate();
    return wrap(rpk);
  }
  
  public static RsaPrivKey wrap(RSAPrivateCrtKey rpk) {
    return new RsaPrivKey(rpk.getModulus(), rpk.getPublicExponent(),
                         rpk.getPrivateExponent(), rpk.getPrimeP(), 
                         rpk.getPrimeQ(), rpk.getPrimeExponentP(), 
                         rpk.getPrimeExponentQ(), rpk.getCrtCoefficient());
  }
  
  public static RSAPrivateCrtKey unwrap(RsaPrivKey key) {
    try {
      KeyFactory factory = KeyFactory.getInstance("RSA");
      RSAPrivateCrtKeySpec spec = new RSAPrivateCrtKeySpec(key.pubKey.n(), 
          key.pubKey.e(), key.d, key.p, key.q, key.dP, key.dQ, key.qInv);
      return (RSAPrivateCrtKey) factory.generatePrivate(spec);
    } catch (GeneralSecurityException e) {
      e.printStackTrace();
      return null;
    }
  }
  
  public String exportPublicKey() {
    return pubKey.toString();
  }
  
  public RsaPubKey publicKey() {
    return pubKey;
  }
  
  /**
   * Implements the faster CRT method for RSA signatures.
   * @param c
   * @return c^d mod n
   */
  public BigInteger sign(BigInteger c) {
    BigInteger m1 = c.modPow(dP, p);
    BigInteger m2 = c.modPow(dQ, q);
    BigInteger h = qInv.multiply(m1.subtract(m2)).mod(p);
    return m2.add(h.multiply(q));
  }
  
  @Override
  public String toString() {
    return Util.gson().toJson(this);
  }
}