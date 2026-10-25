-- Kevin Pong (pinkání s MC Kevinem do 10 gólů): výhry registrovaných hráčů pro tabulku pořadí.
-- Pořadí = kdo Kevina porazil nejrychleji (čas hry měří server od startu hry), zvlášť pro každou obtížnost
-- (1 lehká, 2 normální, 3 Kevin naštvaný). Ukládají se jen výhry; účet smazán = jeho výsledky taky.
CREATE TABLE IF NOT EXISTS `pong_results` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `difficulty` TINYINT NOT NULL,
  `duration_ms` INT NOT NULL,
  `kevin_goals` TINYINT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pong_results_rank` (`difficulty`, `duration_ms`),
  KEY `pong_results_user` (`user_id`),
  CONSTRAINT `fk_pong_results_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
