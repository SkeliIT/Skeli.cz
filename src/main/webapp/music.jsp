<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>


<%
    String sql = "SELECT v.youtube_id, COALESCE(v.title, s.name, v.youtube_id) AS title, s.year " +
                 "FROM videos v LEFT JOIN songs s ON s.id = v.song_id " +
                 "ORDER BY COALESCE(v.title, s.name, v.youtube_id) ASC";

    java.util.List<String> ids = new java.util.ArrayList<>();
    java.util.List<String> names = new java.util.ArrayList<>();
    java.util.List<String> years = new java.util.ArrayList<>();

    try (Connection conn = Db.get()) {
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getString(1));
                    names.add(rs.getString(2));
                    years.add(rs.getString(3));
                }
            }
    } catch (SQLException e) {
        // fallback empty, handled below
    }
    if (ids.isEmpty()) {
        // show an info banner if DB unavailable; grid stays empty
        request.setAttribute("videoInfo", "Nelze načíst videa z DB. Zkuste to prosím později.");
    }
%>

<main>
  <h2 class="bruno-ace-sc-regular" style="text-align:center;"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.music","Music") %></h2>

  <div class="media-columns">
  <section class="section youtube">
    <h3 class="section-title"><span class="ico"><i class="fab fa-youtube" style="color:#FF0000"></i></span> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("section.youtube","YouTube") %></h3>
    <jsp:include page="/elliptic" flush="true" />
  </section>
  </div>

</main>

<%@ include file="includes/footer.jsp" %>
