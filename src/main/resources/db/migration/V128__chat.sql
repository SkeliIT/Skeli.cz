-- Soukromý chat mezi přáteli: jen text. Admin vidí jen zprávu, kterou někdo nahlásí (kopie v chat_reports).
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_a` INT UNSIGNED NOT NULL,          -- dvojice: menší id
  `user_b` INT UNSIGNED NOT NULL,          -- dvojice: větší id
  `sender_id` INT UNSIGNED NOT NULL,
  `recipient_id` INT UNSIGNED NOT NULL,
  `body` VARCHAR(1000) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chat_pair` (`user_a`, `user_b`, `id`),
  KEY `idx_chat_unread` (`recipient_id`, `sender_id`, `read_at`),
  CONSTRAINT `fk_chat_a` FOREIGN KEY (`user_a`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_b` FOREIGN KEY (`user_b`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- „Smazat konverzaci u mě“: zprávy do tohohle id už se mi neukazují, tomu druhému zůstávají.
CREATE TABLE `chat_hidden` (
  `user_id` INT UNSIGNED NOT NULL,
  `other_id` INT UNSIGNED NOT NULL,
  `up_to` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `other_id`),
  CONSTRAINT `fk_chat_hidden_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_hidden_other` FOREIGN KEY (`other_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_reports` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `message_id` BIGINT UNSIGNED NULL,
  `reporter_id` INT UNSIGNED NOT NULL,
  `sender_id` INT UNSIGNED NOT NULL,
  `reason` ENUM('spam','abuse','other') NOT NULL,
  `note` VARCHAR(300) NULL,
  `body_copy` VARCHAR(1000) NOT NULL,      -- kopie: odesílatel by zprávu po nahlášení mohl smazat
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_report` (`message_id`, `reporter_id`),
  CONSTRAINT `fk_chat_report_msg` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chat_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_report_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kdo nechce zprávy, vypne je v Soukromí. Přátelé mu pak nenapíšou.
ALTER TABLE `users` ADD COLUMN `chat_open` TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE `notifications` MODIFY `type` ENUM('reply','heart','passed','friend_request','friend_accept','message') NOT NULL;
