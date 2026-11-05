-- Chat: odpověď na zprávu, úprava zprávy, reakce, ztlumení člověka a vypínač „Viděno“.
ALTER TABLE `chat_messages`
  ADD COLUMN `reply_to` BIGINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `edited_at` TIMESTAMP NULL DEFAULT NULL;

-- Jeden člověk má u zprávy jednu reakci.
CREATE TABLE `chat_reactions` (
  `message_id` BIGINT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `emoji` VARCHAR(16) NOT NULL,
  PRIMARY KEY (`message_id`, `user_id`),
  CONSTRAINT `fk_chat_reaction_msg` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_reaction_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ztlumení: zprávy chodí, ale bez upozornění ve zvonečku a bez zvuku.
CREATE TABLE `chat_muted` (
  `user_id` INT UNSIGNED NOT NULL,
  `other_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `other_id`),
  CONSTRAINT `fk_chat_muted_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_muted_other` FOREIGN KEY (`other_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- „Viděno“: kdo si to vypne, nevidí to ani u ostatních.
ALTER TABLE `user_chat_prefs` ADD COLUMN `receipts` TINYINT(1) NOT NULL DEFAULT 1;
