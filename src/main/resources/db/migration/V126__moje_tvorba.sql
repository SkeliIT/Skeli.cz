-- Moje tvorba: uživatel, který dělá hudbu, si na profil přidá své skladby odkazem (nic se nenahrává).
-- Ukládají se jen ověřené části odkazu (service/MusicLinks), adresa se z nich skládá znovu.
CREATE TABLE `user_tracks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `year` SMALLINT NULL,
  `youtube_id` VARCHAR(11) NULL,
  `spotify` VARCHAR(40) NULL,
  `apple` VARCHAR(40) NULL,
  `soundcloud` VARCHAR(250) NULL,
  `rights_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `hidden_at` TIMESTAMP NULL DEFAULT NULL,
  `hidden_reason` VARCHAR(200) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_tracks_user` (`user_id`),
  CONSTRAINT `fk_user_tracks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kdo skladbu přidá, chce ji ukazovat: výchozí je zapnuto, v Soukromí jde vypnout.
ALTER TABLE `users` ADD COLUMN `tracks_public` TINYINT(1) NOT NULL DEFAULT 1;

-- Nahlášení profilu: cizí skladba nebo porušení autorských práv.
ALTER TABLE `user_reports` MODIFY `reason` ENUM('spam','abuse','image','fake','other','music') NOT NULL;
