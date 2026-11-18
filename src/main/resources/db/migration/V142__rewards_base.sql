-- Vzhled a odměny, krok 1 (2026-11-16): základ na serveru. Plán: Skeli.cz-podklady/plany/vzhled-odmeny-plan.md

-- Dny, kdy byl přihlášený člověk na webu (1 řádek za den, zapisuje /api/presence). Počet dní celkem odemyká odměny;
-- vynechaný den nic nesmaže. Statistiky návštěv pracují s denními otisky a přes dny člověka neznají, proto vlastní tabulka.
CREATE TABLE `user_days` (
  `user_id` INT UNSIGNED NOT NULL,
  `day` DATE NOT NULL,
  PRIMARY KEY (`user_id`, `day`),
  CONSTRAINT `fk_user_days_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Odemčené odměny (model/Rewards). Co jednou získá, tomu zůstane, i když se pravidla později změní.
CREATE TABLE `user_rewards` (
  `user_id` INT UNSIGNED NOT NULL,
  `reward` VARCHAR(40) NOT NULL,
  `got_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `reward`),
  CONSTRAINT `fk_user_rewards_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Zvolené vzhledy: slot profile (vzhled profilu), kfont / kanim / kstyle (karaoke písmo, animace, styl kina).
-- Rámeček fotky (users.pong_frame) a vzhled chatu (user_chat_prefs) zůstávají, kde jsou.
CREATE TABLE `user_looks` (
  `user_id` INT UNSIGNED NOT NULL,
  `slot` VARCHAR(16) NOT NULL,
  `value` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`user_id`, `slot`),
  CONSTRAINT `fk_user_looks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
