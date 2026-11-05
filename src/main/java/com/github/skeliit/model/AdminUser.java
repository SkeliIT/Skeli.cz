package com.github.skeliit.model;

import java.sql.Timestamp;

/** A row of the admin's user list (admin_users.jsp). A plain class: the JSP compiler can't read records. */
public class AdminUser {
    public final int id;
    public final String username;
    public final String email;
    public final String role;
    public final Timestamp createdAt;
    public final String avatarUrl;
    public final String coverUrl;

    public AdminUser(int id, String username, String email, String role, Timestamp createdAt, String avatarUrl, String coverUrl) {
        this.avatarUrl = avatarUrl;
        this.coverUrl = coverUrl;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }
}
