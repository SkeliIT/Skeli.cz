<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.util.List, com.github.skeliit.WebUtils, com.github.skeliit.model.DirectoryPerson" %>
<%@ include file="/includes/header.jsp" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<%-- /lide (web/site/PeopleServlet): kdo si zapnul „ukázat mě v Komunitě“. Soukromý profil tu odkaz nemá, žádost o přátelství jít může. --%>
<%
  @SuppressWarnings("unchecked")
  List<DirectoryPerson> people = (List<DirectoryPerson>) request.getAttribute("people");
  boolean peopleMore = Boolean.TRUE.equals(request.getAttribute("peopleMore"));
  boolean peopleJoined = Boolean.TRUE.equals(request.getAttribute("peopleJoined"));
  int peoplePage = (Integer) request.getAttribute("peoplePage");
  String peopleQuery = (String) request.getAttribute("peopleQuery");
  String peopleBack = "/lide" + (peopleQuery.isEmpty() ? "" : "?q=" + java.net.URLEncoder.encode(peopleQuery, "UTF-8"));
  String frMsg = request.getParameter("friend");
%>
<main class="people-page">
  <sk:pageHero kicker='<%= t.getProperty("menu.community") %>' title='<%= t.getProperty("menu.people") %>' lead='<%= t.getProperty("people.lead") %>'></sk:pageHero>

  <%-- nejdřív to, co se týká mě: jsem v seznamu, nebo nejsem, a jedním klikem se to změní --%>
  <form class="people-me<%= peopleJoined ? " on" : "" %>" method="post" action="/lide">
    <input type="hidden" name="csrf" value="${csrf}">
    <input type="hidden" name="action" value="<%= peopleJoined ? "off" : "on" %>">
    <p><i class="fa-solid <%= peopleJoined ? "fa-eye" : "fa-eye-slash" %>" aria-hidden="true"></i> <%= t.getProperty(peopleJoined ? "people.me.in" : "people.me.out") %></p>
    <button type="submit" class="<%= peopleJoined ? "btn-outline" : "btn-primary" %> friend-btn"><%= t.getProperty(peopleJoined ? "people.me.leave" : "people.me.join") %></button>
  </form>

  <form class="people-search" method="get" action="/lide" role="search">
    <label class="sr-only" for="peopleQ"><%= t.getProperty("friends.search") %></label>
    <input id="peopleQ" name="q" type="search" maxlength="60" value="<%= WebUtils.escapeHtml(peopleQuery) %>" placeholder="<%= WebUtils.escapeHtml(t.getProperty("friends.search")) %>">
    <button type="submit" class="btn-primary" aria-label="<%= t.getProperty("friends.search") %>"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>
  </form>

  <% if (frMsg != null && java.util.Set.of("fail", "verify", "limit", "closed").contains(frMsg)) { %><p class="form-alert" role="alert"><%= t.getProperty("friends.msg." + frMsg) %></p><% } %>

  <% if (people.isEmpty()) { %>
  <p class="acct-empty"><%= t.getProperty(peopleQuery.isEmpty() ? "people.none" : "friends.notFound") %></p>
  <% } %>
  <ul class="people-grid">
    <% for (DirectoryPerson p : people) { String urlName = java.net.URLEncoder.encode(p.username, "UTF-8").replace("+", "%20"); %>
    <li class="people-card">
      <span class="people-av">
        <img src="<%= WebUtils.escapeHtml(p.avatarUrl) %>" alt="" width="64" height="64" loading="lazy" referrerpolicy="no-referrer">
        <% if (p.online) { %><span class="chat-state-dot s-online" title="<%= t.getProperty("chat.status.online") %>"></span><% } %>
      </span>
      <% if (p.pub) { %><a class="people-name" href="/hrac/<%= urlName %>"><%= WebUtils.escapeHtml(p.username) %></a><% } else { %><span class="people-name"><%= WebUtils.escapeHtml(p.username) %></span><% } %>
      <% if ("friends".equals(p.rel)) { %>
        <a class="btn-outline friend-btn" href="/zpravy?s=<%= urlName %>"><i class="fa-solid fa-comments" aria-hidden="true"></i> <%= t.getProperty("people.write") %></a>
      <% } else { String act = "sent".equals(p.rel) ? "cancel" : "received".equals(p.rel) ? "accept" : "request"; %>
        <form method="post" action="/profile/friends">
          <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(p.username) %>">
          <input type="hidden" name="action" value="<%= act %>"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(peopleBack) %>">
          <button type="submit" class="<%= "sent".equals(p.rel) ? "btn-outline" : "btn-primary" %> friend-btn"><%= t.getProperty("sent".equals(p.rel) ? "friends.cancel" : "received".equals(p.rel) ? "friends.accept" : "friends.add") %></button>
        </form>
      <% } %>
    </li>
    <% } %>
  </ul>
  <% if (peoplePage > 0 || peopleMore) { %>
  <nav class="people-pager">
    <% String qs = peopleQuery.isEmpty() ? "" : "&q=" + java.net.URLEncoder.encode(peopleQuery, "UTF-8"); %>
    <% if (peoplePage > 0) { %><a class="btn-outline" href="/lide?page=<%= peoplePage - 1 %><%= WebUtils.escapeHtml(qs) %>"><%= t.getProperty("people.prev") %></a><% } %>
    <% if (peopleMore) { %><a class="btn-outline" href="/lide?page=<%= peoplePage + 1 %><%= WebUtils.escapeHtml(qs) %>"><%= t.getProperty("people.next") %></a><% } %>
  </nav>
  <% } %>
</main>
<%@ include file="/includes/footer.jsp" %>
