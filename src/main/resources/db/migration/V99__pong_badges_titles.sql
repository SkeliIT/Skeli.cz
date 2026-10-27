-- CatSmash: odznaky, které se dějí uvnitř zápasu (odstřely, šroubky, přehřátá kola…) a hlásí je prohlížeč,
-- a titul u jména = jeden získaný odznak, který si hráč vybral (ukazuje se v komentářích a v tabulce pořadí).
-- Odznaky z výher (první výhra, 10:0, 50 výher…) dál počítá server z pong_results.
CREATE TABLE IF NOT EXISTS `pong_badges` (
  `user_id` INT UNSIGNED NOT NULL,
  `badge` VARCHAR(20) NOT NULL,
  `earned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `badge`),
  CONSTRAINT `fk_pong_badges_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `pong_title` VARCHAR(20) NULL;
