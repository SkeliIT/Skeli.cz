-- Sign-ins now survive a server restart (sessions kept in files, WEB-INF/jetty-web.xml). So that
-- "sign out other devices", a password change or reset and a deleted account still end every old
-- sign-in after a restart, the account remembers since when sign-ins are valid (epoch milliseconds);
-- SessionValidityFilter ends any session signed in before that.
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `sessions_valid_after` BIGINT NULL;
