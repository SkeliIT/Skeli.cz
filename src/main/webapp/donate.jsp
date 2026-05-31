<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<style>
  .donate-section { background: rgba(0,0,0,0.65); border:1px solid var(--panel-border); border-radius:12px; padding:20px; margin:16px auto; max-width:520px; box-shadow: 0 6px 18px rgba(0,0,0,0.25); }
  .donate-section h3 { margin-top:0; color: var(--accent); }
  .donate-section ul { list-style: none; padding:0; margin:10px 0; }
  .donate-section li { margin: 12px 0; padding: 10px; background: rgba(255,255,255,0.04); border-radius:8px; border:1px solid rgba(255,255,255,0.1); }
  .donate-section a { color: var(--accent); font-weight: 600; text-decoration: none; transition: all 0.2s ease; }
  .donate-section a:hover { text-shadow: 0 0 8px var(--accent); text-decoration: underline; }
  body.light .donate-section { background: rgba(255,255,255,0.85); border-color: rgba(0,0,0,0.15); }
  body.light .donate-section li { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.1); }
</style>

<main>
  <h2 style="text-align:center;">Podpoř můj projekt</h2>
  <p style="text-align:center; max-width:600px; margin: 0 auto 20px;">Dobrovolný příspěvek pomůže s výrobou hudby, videí a provozem webu. Dík!</p>

  <section class="donate-section">
    <h3>💰 Možnosti</h3>
    <ul>
      <li>💳 Revolut: <a href="https://revolut.me/skelimc" target="_blank" rel="noopener">revolut.me/skelimc</a></li>
    </ul>
  </section>

  <section class="donate-section">
    <h3>📧 Fakturace / kontakt</h3>
    <p>E-mail: <a href="mailto:skelimc@seznam.cz">skelimc@seznam.cz</a></p>
  </section>
</main>

<%@ include file="includes/footer.jsp" %>
