-- Small key/value store for values the app changes itself at runtime,
-- e.g. the Instagram access token after it has been refreshed.
CREATE TABLE IF NOT EXISTS `app_settings` (
  `k` VARCHAR(64) NOT NULL,
  `v` TEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Instagram posts are shown in every language: lang NULL = all languages
ALTER TABLE `social_posts` MODIFY `lang` VARCHAR(5) NULL DEFAULT 'cs';
