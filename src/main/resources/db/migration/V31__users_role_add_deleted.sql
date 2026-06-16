-- V31__users_role_add_deleted.sql
-- ProfileDeleteServlet sets role='DELETED' on account deletion, but the enum
-- only allowed ADMIN/USER, causing the delete to fail with a SQL error.
ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','USER','DELETED') NOT NULL DEFAULT 'USER';
