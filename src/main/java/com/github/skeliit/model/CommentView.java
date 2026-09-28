package com.github.skeliit.model;

import java.sql.Timestamp;

public class CommentView {
    public int id;
    public int userId;
    public Integer parentId; // null = top-level comment
    public java.util.List<CommentView> replies = new java.util.ArrayList<>();
    public String username;
    public String avatarUrl;
    public Timestamp createdAt;
    public Timestamp updatedAt; // null = never edited
    public String content;
    
    // Getters for EL expressions
    public int getId() { return id; }
    public int getUserId() { return userId; }
    public Integer getParentId() { return parentId; }
    public java.util.List<CommentView> getReplies() { return replies; }
    public String getUsername() { return username; }
    public String getAvatarUrl() { return avatarUrl; }
    public Timestamp getCreatedAt() { return createdAt; }
    public Timestamp getUpdatedAt() { return updatedAt; }
    public String getContent() { return content; }
}
