package net.pseudoid.servlets;

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

import net.pseudoid.model.RsaPrivKey;
import net.pseudoid.model.Util;


import java.io.IOException;
import java.math.BigInteger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class SignServlet extends HttpServlet {
  
  private static final RsaPrivKey key = 
    RsaPrivKey.read(Util.readFile("WEB-INF/privkey"));
  
  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse resp) 
      throws IOException {
    doPost(req, resp);
  }
  
  @Override
  public void doPost(HttpServletRequest req, HttpServletResponse resp) 
     throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    User user = userService.getCurrentUser();

    if (user != null && key != null) {
      String token = req.getParameter("tok"); // expect token to be hex str
      token = (token == null) ? "0" : token;
      BigInteger m = new BigInteger(token, 16);
      BigInteger s = key.sign(m); // do a raw sign, raise to d power mod n
      resp.setContentType("text/plain");
      resp.getWriter().println(s.toString(16)); // output in hex
    } else {
      resp.sendRedirect(userService.createLoginURL(req.getRequestURI()));
    }    
  }
}