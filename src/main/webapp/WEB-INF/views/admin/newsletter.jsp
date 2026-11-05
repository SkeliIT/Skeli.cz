<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<%@ page import="java.util.List" %>
<%@ include file="/includes/header.jsp" %>

<main class="admin-page">
    <%@ include file="/includes/admin-nav.jspf" %>
    <h2 class="admin-page-title">Novinky e-mailem</h2>
    <%
      // (no switch expressions or records here: the JSP compiler is older Java)
      String nlMsg = request.getParameter("msg"), nlText = null;
      if ("tested".equals(nlMsg)) nlText = "Zkušební e-mail odešel na tvůj e-mail. Mrkni i do spamu.";
      else if ("sending".equals(nlMsg)) nlText = "Rozesílá se " + com.github.skeliit.WebUtils.escapeHtml(request.getParameter("n")) + " odběratelům – stav uvidíš níž (obnov stránku).";
      else if ("missing".equals(nlMsg)) nlText = "Vyplň předmět i text.";
      else if ("nosmtp".equals(nlMsg)) nlText = "Na tomhle serveru není nastavené odesílání e-mailů (SMTP).";
      else if ("noemail".equals(nlMsg)) nlText = "Tvůj účet nemá e-mail, zkušební kopie nemá kam odejít.";
      else if ("failed".equals(nlMsg)) nlText = "Odeslání se nepovedlo (chyba SMTP). Zkus to znovu později.";
      boolean nlOk = "tested".equals(nlMsg) || "sending".equals(nlMsg);
      boolean nlSmtp = Boolean.TRUE.equals(request.getAttribute("smtp"));
      Integer nlCount = (Integer) request.getAttribute("recipients");
      if (nlCount == null) nlCount = 0;
      @SuppressWarnings("unchecked") java.util.List<com.github.skeliit.dao.HomeDao.HomeVideo> nlClips = (java.util.List<com.github.skeliit.dao.HomeDao.HomeVideo>) request.getAttribute("clips");
      @SuppressWarnings("unchecked") java.util.List<com.github.skeliit.service.Newsletter.Issue> nlIssues = (java.util.List<com.github.skeliit.service.Newsletter.Issue>) request.getAttribute("issues");
    %>
    <% if (nlText != null) { %><p class="<%= nlOk ? "admin-flash" : "admin-error" %>"><%= nlText %></p><% } %>

    <section class="admin-card" id="compose">
      <h3>Napsat novinku</h3>
      <p class="text-dim">Pošle se všem, kdo odběr potvrdili a neodhlásili se: <b><%= nlCount %></b>. Každý e-mail má odkaz na odhlášení. Nejdřív si pošli zkušební kopii na svůj e-mail.<% if (!nlSmtp) { %> <b>Odesílání e-mailů tu není nastavené.</b><% } %></p>
      <form method="post" action="/admin/newsletter" class="admin-form nl-form">
        <input type="hidden" name="csrf" value="${csrf}">
        <label>Video v e-mailu (nepovinné – předvyplní předmět i text)
          <select name="youtube_id" id="nlClip">
            <option value="">— bez videa —</option>
            <% if (nlClips != null) for (com.github.skeliit.dao.HomeDao.HomeVideo v : nlClips) { %><option value="<%= com.github.skeliit.WebUtils.escapeHtml(v.youtubeId()) %>"><%= com.github.skeliit.WebUtils.escapeHtml(v.title() == null ? v.youtubeId() : v.title()) %></option><% } %>
          </select>
        </label>
        <label>Předmět <input name="subject" id="nlSubject" maxlength="200" required></label>
        <label>Text (prázdný řádek = nový odstavec)
          <textarea name="body" id="nlBody" rows="8" required></textarea></label>
        <div class="nl-actions">
          <button type="submit" name="action" value="test"><i class="fa-solid fa-flask" aria-hidden="true"></i> Poslat zkušebně mně</button>
          <button type="submit" name="action" value="send" class="btn-primary" onclick="return confirm('Opravdu rozeslat všem odběratelům (<%= nlCount %>)? Vzít zpátky to nejde.')"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Rozeslat všem</button>
        </div>
      </form>
      <script>
        // a clip picked: a ready subject and text (only into empty fields or ones it filled itself)
        (function () {
          var sel = document.getElementById('nlClip'), sub = document.getElementById('nlSubject'), body = document.getElementById('nlBody');
          if (!sel || sel.dataset.on) return; sel.dataset.on = '1';
          sel.addEventListener('change', function () {
            var title = sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].text : '';
            if (!title) return;
            if (!sub.value || sub.dataset.auto) { sub.value = 'Nové video: ' + title; sub.dataset.auto = '1'; }
            if (!body.value || body.dataset.auto) { body.value = 'Ahoj,\n\nje venku nové video „' + title + '“. Pusť si ho a napiš mi, jak se ti líbí.\n\nSkeli'; body.dataset.auto = '1'; }
          });
          [sub, body].forEach(function (f) { f.addEventListener('input', function () { delete f.dataset.auto; }); });
        })();
      </script>
    </section>

    <% if (nlIssues != null && !nlIssues.isEmpty()) { %>
    <section class="admin-card" id="issues">
      <h3>Rozeslané novinky</h3>
      <table class="admin-table">
        <thead><tr><th>Předmět</th><th>Kdy</th><th>Odesláno</th><th>Stav</th></tr></thead>
        <tbody>
        <% for (com.github.skeliit.service.Newsletter.Issue nlIs : nlIssues) { %>
          <tr><td><%= com.github.skeliit.WebUtils.escapeHtml(nlIs.subject) %></td>
            <td><%= com.github.skeliit.WebUtils.formatDateTime(nlIs.created, cur) %></td>
            <td><%= nlIs.sent %> / <%= nlIs.total %><% if (nlIs.failed > 0) { %> (<%= nlIs.failed %> chyb)<% } %></td>
            <td><%= nlIs.finished != null ? "hotovo" : "rozesílá se…" %></td></tr>
        <% } %>
        </tbody>
      </table>
    </section>
    <% } %>

    <h3>Odběratelé</h3>

    <div class="admin-card">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>E-mail</th>
                    <th>Přihlášeno</th>
                    <th>Potvrzeno</th>
                    <th>Odhlášeno</th>
                    <th>Akce</th>
                </tr>
            </thead>
            <tbody>
                <% List<String[]> emails = (List<String[]>)request.getAttribute("emails");
                   if (emails != null) for (String[] row : emails) { %>
                    <tr>
                        <td><%= com.github.skeliit.WebUtils.escapeHtml(row[0]) %></td>
                        <td><%= com.github.skeliit.WebUtils.escapeHtml(row[1]) %></td>
                        <%-- double opt-in: only confirmed addresses are real subscribers --%>
                        <td><%= row[3] != null && !"null".equals(row[3]) ? com.github.skeliit.WebUtils.escapeHtml(row[3]) : "<span class=\"text-dim\">čeká na potvrzení</span>" %></td>
                        <td><%= row[2] != null && !"null".equals(row[2]) ? com.github.skeliit.WebUtils.escapeHtml(row[2]) : "" %></td>
                        <td>
                            <form method="post" action="/admin/newsletter" class="inline-form">
                                <input type="hidden" name="csrf" value="${csrf}">
                                <input type="hidden" name="id" value="<%= com.github.skeliit.WebUtils.escapeHtml(row[4]) %>">
                                <button type="submit" class="btn-delete" onclick="return confirm('Opravdu smazat?')">Smazat</button>
                            </form>
                        </td>
                    </tr>
                <% } %>
            </tbody>
        </table>
    </div>

</main>

<%@ include file="/includes/footer.jsp" %>
