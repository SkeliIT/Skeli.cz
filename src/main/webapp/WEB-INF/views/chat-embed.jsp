<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.github.skeliit.model.ChatConversation, com.github.skeliit.WebUtils" %>
<!DOCTYPE html>
<%@ include file="/includes/version.jspf" %>
<%@ include file="/WEB-INF/i18n/i18n.jspf" %>
<%-- /zpravy?embed=1: chat v malém okně (lišta na počítači, kolečko na telefonu, js/chat-dock.js). Jen chat, bez hlavičky, patičky a Kevina. --%>
<html lang="<%= cur %>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex">
  <title><%= t.getProperty("chat.title") %></title>
  <link rel="stylesheet" href="/vendor/fontawesome/css/all.min.css">
  <link rel="stylesheet" href="/fonts/fonts.css?v=<%= assetVersion %>">
  <link rel="stylesheet" href="/css/base.css?v=<%= assetVersion %>">
  <link rel="stylesheet" href="/css/components.css?v=<%= assetVersion %>">
  <link rel="stylesheet" href="/css/pages.css?v=<%= assetVersion %>">
</head>
<body class="chat-embed-body">
  <script>try { document.body.classList.add(localStorage.getItem('theme') || 'dark'); } catch (e) { document.body.classList.add('dark'); }</script>
  <%@ include file="/includes/chat-body.jspf" %>
  <script src="/js/sounds.js?v=<%= assetVersion %>"></script>
</body>
</html>
