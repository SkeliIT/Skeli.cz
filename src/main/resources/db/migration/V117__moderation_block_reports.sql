-- Moderace: admin může účet zablokovat (nepřihlásí se, profil není vidět, data zůstávají) a lidé mohou nahlásit profil.
ALTER TABLE `users`
  ADD COLUMN `blocked_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `blocked_reason` VARCHAR(200) NULL DEFAULT NULL;

CREATE TABLE `user_reports` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `reported_id` INT(10) UNSIGNED NOT NULL,
  `reporter_id` INT(10) UNSIGNED NOT NULL,
  `reason` ENUM('spam','abuse','image','fake','other') NOT NULL,
  `note` VARCHAR(300) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_report_once` (`reported_id`, `reporter_id`),
  KEY `idx_user_reports_open` (`resolved_at`, `created_at`),
  CONSTRAINT `fk_user_reports_reported` FOREIGN KEY (`reported_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
