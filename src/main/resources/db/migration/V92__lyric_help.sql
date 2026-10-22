-- „Pomoz nám dopsat text“: admin u písně označí, že v textu chybí kus (v jakém jazyce a od které vteřiny klipu).
-- Na stránce písně se pak návštěvníků, kteří tomu jazyku rozumí, zeptáme, ať to napíšou (upozorní na to MC Kevin).
-- Co pošlou, čeká v adminu – na web nic nejde samo. Žádná IP adresa ani e-mail: jen text a u přihlášeného
-- návštěvníka jeho účet.
ALTER TABLE `songs`
  ADD COLUMN `help_wanted_at` DATETIME NULL,
  ADD COLUMN `help_lang` VARCHAR(8) NULL,
  ADD COLUMN `help_from_sec` INT NULL;

CREATE TABLE IF NOT EXISTS `lyric_help` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `song_id` INT UNSIGNED NOT NULL,
  `message` TEXT NOT NULL,
  `user_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lyric_help_song` (`song_id`),
  KEY `lyric_help_user` (`user_id`),
  CONSTRAINT `fk_lyric_help_song` FOREIGN KEY (`song_id`) REFERENCES `songs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lyric_help_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marihuanaalamadama: část Toxe Team je španělsky, v klipu od 2:15
UPDATE `songs` SET `help_wanted_at` = NOW(), `help_lang` = 'es', `help_from_sec` = 135
WHERE `name` LIKE '%Marihuana%';
