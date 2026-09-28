-- E-mail verification, one level of comment replies and comment reports.

-- Accounts: e-mail verification. Only a SHA-256 hash of the link token is stored.
ALTER TABLE `users`
  ADD COLUMN `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `verify_token_hash` CHAR(64) NULL DEFAULT NULL,
  ADD COLUMN `verify_expires_at` TIMESTAMP NULL DEFAULT NULL,
  ADD KEY `idx_users_verify_token` (`verify_token_hash`);

-- Accounts that already exist were created before verification existed: treat them as verified
UPDATE `users` SET `email_verified_at` = `created_at` WHERE `email_verified_at` IS NULL;

-- Replies: a reply points at a top-level comment; deleting it deletes its replies
ALTER TABLE `comments`
  ADD COLUMN `parent_id` INT UNSIGNED NULL DEFAULT NULL AFTER `user_id`,
  ADD KEY `idx_comments_parent` (`parent_id`),
  ADD CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

ALTER TABLE `video_comments`
  ADD COLUMN `parent_id` INT NULL DEFAULT NULL AFTER `user_id`,
  ADD KEY `idx_video_comments_parent` (`parent_id`),
  ADD CONSTRAINT `fk_video_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `video_comments` (`id`) ON DELETE CASCADE;

-- Reports of inappropriate comments, one per user and comment.
-- kind says which table comment_id refers to ('lyric' = comments, 'video' = video_comments).
CREATE TABLE `comment_reports` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kind` ENUM('lyric', 'video') NOT NULL,
  `comment_id` INT NOT NULL,
  `reporter_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_report_once` (`kind`, `comment_id`, `reporter_id`),
  KEY `idx_report_comment` (`kind`, `comment_id`),
  CONSTRAINT `fk_report_user` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
