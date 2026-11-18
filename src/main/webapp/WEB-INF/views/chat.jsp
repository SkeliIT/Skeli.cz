<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ page import="com.github.skeliit.model.ChatConversation, com.github.skeliit.WebUtils" %>
<%-- /zpravy (web/profile/ChatPageServlet): seznam konverzací a otevřený chat. Zprávy kreslí js/chat.js přes /api/chat, jen jako text.
     Telefon: buď seznam, nebo chat. Počítač: vedle sebe. --%>
<%@ include file="/includes/chat-body.jspf" %>
<%@ include file="/includes/footer.jsp" %>
