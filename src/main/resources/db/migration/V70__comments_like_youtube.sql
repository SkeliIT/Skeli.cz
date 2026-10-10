-- Comments like on YouTube, the same for lyrics (comments) and clips (video_comments):
-- thumbs up/down on lyric comments too, a pinned comment, a heart from the artist,
-- and an artist flag on the account (a badge next to the name; separate from the ADMIN role).

CREATE TABLE IF NOT EXISTS `lyric_comment_votes` (
  `comment_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `vote` TINYINT NOT NULL,
  PRIMARY KEY (`comment_id`, `user_id`),
  KEY `idx_lcv_user` (`user_id`),
  CONSTRAINT `fk_lcv_comment` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lcv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- pinned_at: the one comment shown first (NULL = not pinned); hearted_at: the artist liked it
ALTER TABLE `comments`
  ADD COLUMN IF NOT EXISTS `pinned_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `hearted_at` TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE `video_comments`
  ADD COLUMN IF NOT EXISTS `pinned_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `hearted_at` TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `is_artist` TINYINT(1) NOT NULL DEFAULT 0;

-- Skeli's own account
UPDATE `users` SET `is_artist` = 1 WHERE `username` = 'skelimc';
