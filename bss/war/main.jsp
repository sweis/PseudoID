<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>

<html>
  <head>
    <title>Tiresias: Blind Signer</title>
    <link type="text/css" rel="stylesheet" href="css/main.css" />
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
  <body>
  <div id="login">
    <%
      UserService userService = UserServiceFactory.getUserService();
      User user = userService.getCurrentUser();
      if (user != null) {
    %>
      <span class="nickname"><%= user.getNickname() %></span> |
      <a href="https://www.google.com/accounts/ManageAccount">My Account</a> |
      <a href="<%= userService.createLogoutURL(request.getRequestURI()) %>">
        Log out</a>
      
      </div>

  <p>
    Welcome to Tiresias, the blind signer. Here you can generate an access token
    for anonymous logging into OpenID-enabled websites. Simply select a nickname
    that you wish to use on these sites and Tiresias will generate a token:
  </p>

    <h1>Generate an Access Token</h1>
    <form>
      Enter a Nickname: <input type="text" value="" id="nick"/>
      <input type="button" value="Create a Token" onclick="setCookie();" />
    </form>
    
    <div id="tokenout"></div>
    <div id="iframeout"></div>
    <%
      } else {
    %>
      <a href="<%= userService.createLoginURL(request.getRequestURI()) %>">
        Log in</a>
      
      </div>
      
      <p> Please 
      <a href="<%= userService.createLoginURL(request.getRequestURI()) %>">
        log in</a> first!</p>
    <%
      }
    %>
    
<!--    <h1>Links</h1>-->
<!--    <a href="services.jsp">Other Services</a>-->
    
  </body>
</html>