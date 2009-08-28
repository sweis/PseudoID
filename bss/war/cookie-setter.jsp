<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>

<html>
  <head>
    <title>Cookie Setter</title>
    <script type="text/javascript" src="js/jsbn/jsbn.js"></script>
    <script type="text/javascript" src="js/jsbn/jsbn2.js"></script>
    <script type="text/javascript" src="js/jsbn/prng4.js"></script>
    <script type="text/javascript" src="js/jsbn/rng.js"></script>
    <script type="text/javascript" src="js/jsbn/base64.js"></script>
    <script type="text/javascript" src="js/sha1.js"></script>
    <script type="text/javascript" src="js/base64-wtk.js"></script>
    <script type="text/javascript" src="js/blinder/blinder.js"></script>
    <script type="text/javascript" src="js/blinder/blinder-cookie.js"></script>
  </head>
  <body onload="setLocalCookie();">
    <a href="main.jsp">Home</a>
<%
    UserService userService = UserServiceFactory.getUserService();
    User user = userService.getCurrentUser();
    if (user != null) {
%>
<p>Hello, <%= user.getNickname() %>! (You can
<a href="<%= userService.createLogoutURL(request.getRequestURI()) %>">sign out</a>.)</p>
<div id="tokenout"></div>
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