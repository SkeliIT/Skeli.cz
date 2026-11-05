-- Nastavení chatu: stav (vidí jen přátelé), barvy, písmo a velikost. Na účtu, ať platí na všech zařízeních. Řádek vzniká až při první změně.
CREATE TABLE `user_chat_prefs` (
  `user_id` INT UNSIGNED NOT NULL,
  `status` ENUM('online','busy','dnd','invisible') NOT NULL DEFAULT 'online',
  `theme` VARCHAR(12) NOT NULL DEFAULT 'gold',
  `font` VARCHAR(10) NOT NULL DEFAULT 'text',
  `size` CHAR(1) NOT NULL DEFAULT 'm',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_chat_prefs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
