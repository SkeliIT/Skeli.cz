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
  <%-- lehký režim pro slabé telefony stejně jako includes/header.jsp: vzhledy chatu pak neanimují a nerozmazávají --%>
  <script>try { (function () { var n = navigator, c = n.connection, m = n.deviceMemory, s = localStorage.getItem('fxLow');
    if (s !== '0' && (s === '1' || sessionStorage.getItem('fxLowNow') === '1' || (c && c.saveData) || (m && m <= 4 && matchMedia('(pointer: coarse)').matches))) document.documentElement.classList.add('low-fx');
  })(); } catch (e) { /* bez úložiště normálně */ }</script>
  <title><%= t.getProperty("chat.title") %></title>
  <link rel="stylesheet" href="/vendor/fontawesome/css/all.min.css">
  <link rel="stylesheet" href="/fonts/fonts.css?v=<%= assetVersion %>">
  <link rel="stylesheet" href="/css/base.css?v=<%= assetVersion %>">
  <link rel="stylesheet" href="/css/components.css?v=<%= assetVersion %>">
  <link rel="stylesheet" href="/css/pages.css?v=<%= assetVersion %>">
</head>
<body class="chat-embed-body">
  <script>
    // Režim a tučné písmo jako web. Okno se načte jen jednou: když člověk na stránce přepne světlý/tmavý režim
    // nebo tučné písmo, přijde sem událost storage (stejný původ) a okno se přebarví hned, ne až po obnovení.
    (function () {
      function apply() {
        var theme = 'dark', bold = false;
        try { theme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark'; bold = /^(600|700)$/.test(localStorage.getItem('fontWeight') || ''); } catch (e) { /* soukromý režim */ }
        document.body.classList.toggle('light', theme === 'light');
        document.body.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('bold-text', bold);
      }
      apply();
      window.addEventListener('storage', function (e) { if (e.key === 'theme' || e.key === 'fontWeight' || e.key === null) apply(); });
    })();
  </script>
  <%@ include file="/includes/chat-body.jspf" %>
  <script src="/js/sounds.js?v=<%= assetVersion %>"></script>
</body>
</html>
