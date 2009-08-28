package net.pseudoid.servlets;

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

import net.pseudoid.model.RsaPubKey;
import net.pseudoid.model.Util;

import org.keyczar.exceptions.Base64DecodingException;
import org.keyczar.util.Base64Coder;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CookieCheckerServlet extends HttpServlet {
  
  private static final Logger log = 
    Logger.getLogger(CookieCheckerServlet.class.getName());
  
  private static final RsaPubKey key = RsaPubKey.read(Util.readFile("pubkey"));
  
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
    if (user == null) {
      resp.sendRedirect(userService.createLoginURL(req.getRequestURI()));
    }
    
    Cookie[] cookies = req.getCookies();
    String out = "0";  // No Cookie Found
    
    for (Cookie c : cookies) {
      if (c.getName().equalsIgnoreCase("tiresias")) {
        String value = c.getValue();
        String[] tokens = value.split(":");
        String message = tokens[0];
        String signature = tokens[1];
        
        byte[] data, sig;
        try {
          data = Base64Coder.decode(message);
          sig = Base64Coder.decode(signature);
          out = key.verify(data, sig) ? "1" : "0";
        } catch (Base64DecodingException e) {
          log.warning("Base64 decoding error.");
          log.warning("Message = " + message);
          log.warning("Signature = " + signature);
          out = "0";
        }
        break;
      }
    }
    
    resp.setContentType("text/plain");
    resp.getWriter().println(out);
  }
}