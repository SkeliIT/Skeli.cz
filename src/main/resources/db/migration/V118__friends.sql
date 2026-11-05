-- Přátelé: žádost, přijetí, odebrání a blokování. Dvojice má jeden řádek (user_a < user_b), requested_by říká, kdo žádost poslal.
CREATE TABLE `friendships` (
  `user_a` INT(10) UNSIGNED NOT NULL,
  `user_b` INT(10) UNSIGNED NOT NULL,
  `requested_by` INT(10) UNSIGNED NOT NULL,
  `status` ENUM('pending','accepted') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`user_a`, `user_b`),
  KEY `idx_friendships_b` (`user_b`),
  CONSTRAINT `fk_friendships_a` FOREIGN KEY (`user_a`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_friendships_b` FOREIGN KEY (`user_b`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blokování je silnější než odebrání: zablokovaný neposílá žádosti a můj profil neuvidí.
CREATE TABLE `user_blocks` (
  `blocker_id` INT(10) UNSIGNED NOT NULL,
  `blocked_id` INT(10) UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`blocker_id`, `blocked_id`),
  KEY `idx_user_blocks_blocked` (`blocked_id`),
  CONSTRAINT `fk_user_blocks_blocker` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_blocks_blocked` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dobrovolné: kdo nechce, žádosti o přátelství v Nastavení vypne.
ALTER TABLE `users` ADD COLUMN `friend_requests` TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE `notifications` MODIFY `type` ENUM('reply','heart','passed','friend_request','friend_accept') NOT NULL;
