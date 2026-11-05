-- Profil: pár slov o sobě, město a písně se srdcem můžou vidět ostatní přihlášení, když si to člověk sám zapne.
-- Výchozí je vypnuto: lidé to doteď vyplňovali s tím, že se to nikomu neukazuje.
ALTER TABLE `users`
  ADD COLUMN `about_public` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `city_public` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `likes_public` TINYINT(1) NOT NULL DEFAULT 0;
