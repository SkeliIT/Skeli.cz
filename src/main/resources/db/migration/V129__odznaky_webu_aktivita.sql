-- Odznaky mimo hry (model/SiteBadges): kdo je jednou získá, tomu zůstanou. Datum slouží i pro aktivitu na profilu.
CREATE TABLE `site_badges` (
  `user_id` INT UNSIGNED NOT NULL,
  `badge` VARCHAR(20) NOT NULL,
  `earned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `badge`),
  CONSTRAINT `fk_site_badges_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aktivitu na profilu ostatní uvidí, jen když si to člověk zapne.
ALTER TABLE `users` ADD COLUMN `activity_public` TINYINT(1) NOT NULL DEFAULT 0;
