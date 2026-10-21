-- Problems visitors report to MC Kevin ("Nahlásit problém": a missing video, a wrong line, a broken page – issue #28).
-- No IP address and no e-mail: the message, the page it was sent from and, for a signed-in visitor, the account.
-- The admin deletes a report once it is sorted out (Hodnocení webu → Nahlášené problémy).
CREATE TABLE IF NOT EXISTS `site_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `page` VARCHAR(255) NOT NULL,
  `message` VARCHAR(1000) NOT NULL,
  `user_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `site_reports_user` (`user_id`),
  CONSTRAINT `fk_site_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
