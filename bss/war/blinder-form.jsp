<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>

<html>
  <head>
    <title>Blinder</title>
    <script type="text/javascript" src="js/jsbn/jsbn.js"></script>
    <script type="text/javascript" src="js/jsbn/jsbn2.js"></script>
    <script type="text/javascript" src="js/jsbn/prng4.js"></script>
    <script type="text/javascript" src="js/jsbn/rng.js"></script>
    <script type="text/javascript" src="js/jsbn/base64.js"></script>
    <script type="text/javascript" src="js/sha1.js"></script>
    <script type="text/javascript" src="js/base64-wtk.js"></script>
    <script type="text/javascript" src="js/blinder/blinder.js"></script>
    <script type="text/javascript" src="js/blinder/blinder-form.js"></script>
  </head>
  <body>
    <a href="main.jsp">Home</a>

<%
    UserService userService = UserServiceFactory.getUserService();
    User user = userService.getCurrentUser();
    if (user != null) {
%>
<p>Hello, <%= user.getNickname() %>! (You can
<a href="<%= userService.createLogoutURL(request.getRequestURI()) %>">sign out</a>.)</p>
<%
    } else {
%>
<p>Hello!
<a href="<%= userService.createLoginURL(request.getRequestURI()) %>">Sign in</a>
to be able to sign messages.</p>
<%
    }
%>
  <h2>Blind Signatures</h2>
  <form>
      <table>
        <tr>
          <td><input type="button" value="Generate Message" onclick="generateMessage();"/> to sign:</td>
          <td><input type="text" id="msg" name="msg"/></td>
          <td><input type="button" value="Blind Message" onclick="blindMessage();"/></td>
        </tr>
        <tr>
          <td>Blinded Result:</td>
          <td><input type="text" id="blinded" name="blinded" disabled="true"/></td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>Random Factor:</td>
          <td<input type="text" id="factor" name="factor" disabled="true"/></td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>Blinded Signature:</td>
          <td><input type="text" id="sig" name="sig"/></td>
          <% if (user != null) { %>
          <td><input type="button" value="Blind Sign" onclick="signMessage();" /></td>
          <% } %>
        </tr>
        <tr>
          <td>Unblinded Signature:</td>
          <td><input type="text" id="unblinded" name="unblinded"/></td>
          <td><input type="button" value="Unblind Signature" onclick="unblindSignature();"/></td>
        </tr>
        <tr>
          <td><input type="reset"/></td>
          <td>&nbsp;</td>
          <td><input type="button" value="Verify Signature" onclick="verifySignature();" /></td>
        </tr>
      </table>
    </form>
  </body>
</html>