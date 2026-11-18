-- Ukázat mě v Komunitě: jméno a fotka v seznamu Lidé. Dobrovolné, výchozí vypnuto.
ALTER TABLE `users` ADD COLUMN `community_public` TINYINT(1) NOT NULL DEFAULT 0;
CREATE INDEX `idx_users_community` ON `users` (`community_public`);
