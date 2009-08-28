<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>

<html>
  <head>
    <title>PseudoID: Blind Signer</title>
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
<h2>Services</h2>
<ul>
  <li>
    <a href="cookie-setter.jsp">Set a Cookie</a>: 
    Set it for a different path...
  </li>
  <li>
    <a href="cookie-checker.jsp">Read a Cookie</a>: 
    ...and then retrieve the cookie from that path.
  </li>
  <li>
    <a href="checkcookie">Check a Cookie</a>: Or just get a boolean for whether
    the cookie has been set properly.
  <li>
    <a href="cookie-generator.jsp">Cookie Generator Form</a>:
    Use this to experiment with setting, getting, and deleting cookies 
    for different domains and paths.
  </li>
  <li>
    <a href="blinder-form.jsp">Blinder Form</a>:
     Use this for step-by-step experiments.
  </li>
</ul>
<%
    } else {
%>
<p>Hello!
<a href="<%= userService.createLoginURL(request.getRequestURI()) %>">Sign in</a>
to be able to sign messages.</p>
<%
    }
%>
  </body>
</html>