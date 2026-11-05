<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ page import="com.github.skeliit.model.ChatConversation, com.github.skeliit.WebUtils" %>
<%-- /zpravy (web/profile/ChatPageServlet): seznam konverzací a otevřený chat. Zprávy kreslí js/chat.js přes /api/chat, jen jako text.
     Telefon: buď seznam, nebo chat. Počítač: vedle sebe. --%>
<%
  @SuppressWarnings("unchecked")
  java.util.List<ChatConversation> chatList = (java.util.List<ChatConversation>) request.getAttribute("chatList");
  if (chatList == null) chatList = java.util.List.of();
  String chatWith = (String) request.getAttribute("chatWith");
%>
<main class="chat-page<%= chatWith != null ? " in-room" : "" %>">
  <section class="chat-list" aria-label="<%= t.getProperty("chat.title") %>">
    <h1 class="chat-title"><i class="fa-solid fa-comments" aria-hidden="true"></i> <%= t.getProperty("chat.title") %></h1>
    <% if (chatList.isEmpty()) { %>
    <p class="acct-empty"><%= t.getProperty("chat.none") %></p>
    <a class="btn btn-primary" href="/uzivatel.jsp#pratele"><%= t.getProperty("chat.findFriends") %></a>
    <% } %>
    <ul class="chat-people">
      <% for (ChatConversation v : chatList) { %>
      <li><a class="chat-person<%= v.username.equals(chatWith) ? " active" : "" %>" href="/zpravy?s=<%= java.net.URLEncoder.encode(v.username, "UTF-8") %>">
        <img src="<%= WebUtils.escapeHtml(v.avatarUrl) %>" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer">
        <span class="chat-person-text">
          <b><%= WebUtils.escapeHtml(v.username) %></b>
          <small><%= v.lastBody == null ? t.getProperty("chat.write") : v.lastDeleted ? t.getProperty("chat.deleted") : (v.lastMine ? t.getProperty("chat.you") + " " : "") + WebUtils.escapeHtml(v.lastBody) %></small>
        </span>
        <% if (v.unread > 0) { %><span class="acct-count" aria-label="<%= t.getProperty("chat.unread") %>"><%= v.unread %></span><% } %>
      </a></li>
      <% } %>
    </ul>
    <p class="chat-privacy"><i class="fa-solid fa-lock" aria-hidden="true"></i> <%= t.getProperty("chat.privacy") %></p>
  </section>

  <% if (chatWith != null) { %>
  <section class="chat-room" data-with="<%= WebUtils.escapeHtml(chatWith) %>" data-csrf="<%= com.github.skeliit.filter.CsrfFilter.token(session) %>"
           data-t-delete-confirm="<%= WebUtils.escapeHtml(t.getProperty("chat.deleteConfirm")) %>" data-t-deleted="<%= WebUtils.escapeHtml(t.getProperty("chat.deleted")) %>"
           data-t-delete="<%= WebUtils.escapeHtml(t.getProperty("chat.delete")) %>" data-t-report="<%= WebUtils.escapeHtml(t.getProperty("chat.report")) %>"
           data-t-reported="<%= WebUtils.escapeHtml(t.getProperty("chat.reported")) %>" data-t-limit="<%= WebUtils.escapeHtml(t.getProperty("chat.limit")) %>"
           data-t-fail="<%= WebUtils.escapeHtml(t.getProperty("chat.fail")) %>" data-t-hide-confirm="<%= WebUtils.escapeHtml(t.getProperty("chat.hideConfirm")) %>"
           data-t-play="<%= WebUtils.escapeHtml(t.getProperty("chat.embed.play")) %>" data-t-open="<%= WebUtils.escapeHtml(t.getProperty("chat.embed.open")) %>"
           aria-label="<%= WebUtils.escapeHtml(chatWith) %>">
    <header class="chat-head">
      <a class="chat-back" href="/zpravy" aria-label="<%= t.getProperty("chat.back") %>"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></a>
      <a class="chat-who" href="/hrac/<%= java.net.URLEncoder.encode(chatWith, "UTF-8").replace("+", "%20") %>"><%= WebUtils.escapeHtml(chatWith) %></a>
      <button type="button" class="chat-hide" title="<%= t.getProperty("chat.hide") %>" aria-label="<%= t.getProperty("chat.hide") %>"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
    </header>
    <button type="button" class="chat-older" hidden><%= t.getProperty("chat.older") %></button>
    <ol class="chat-msgs" aria-live="polite"></ol>
    <p class="chat-closed" hidden><%= t.getProperty("chat.closed") %></p>
    <p class="chat-error form-alert" role="alert" hidden></p>
    <form class="chat-form">
      <button type="button" class="chat-emoji-btn" aria-expanded="false" title="<%= t.getProperty("cmt.emoji") %>" aria-label="<%= t.getProperty("cmt.emoji") %>"><i class="fa-regular fa-face-smile" aria-hidden="true"></i></button>
      <div class="chat-emoji" hidden></div>
      <textarea name="body" rows="1" maxlength="1000" required aria-label="<%= t.getProperty("chat.placeholder") %>" placeholder="<%= t.getProperty("chat.placeholder") %>"></textarea>
      <button type="submit" class="btn-primary" aria-label="<%= t.getProperty("chat.send") %>" title="<%= t.getProperty("chat.send") %>"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i></button>
    </form>
    <template class="chat-report-tpl">
      <form class="chat-report-form">
        <label><%= t.getProperty("chat.report.why") %>
          <select name="reason">
            <option value="abuse"><%= t.getProperty("chat.report.abuse") %></option>
            <option value="spam"><%= t.getProperty("chat.report.spam") %></option>
            <option value="other"><%= t.getProperty("chat.report.other") %></option>
          </select>
        </label>
        <input name="note" maxlength="300" placeholder="<%= t.getProperty("player.report.note") %>" aria-label="<%= t.getProperty("player.report.note") %>">
        <button type="submit" class="btn-outline friend-btn"><%= t.getProperty("player.report.send") %></button>
      </form>
    </template>
  </section>
  <% } else { %>
  <section class="chat-pick"><p><i class="fa-solid fa-comments" aria-hidden="true"></i> <%= t.getProperty("chat.pick") %></p></section>
  <% } %>
  <script src="/js/chat.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="/includes/footer.jsp" %>
