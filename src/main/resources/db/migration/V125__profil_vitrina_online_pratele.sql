-- Profil: vitrína až 3 vybraných odznaků a dva nové vypínače v „Co o mně vidí ostatní“ (výchozí vypnuto).
ALTER TABLE `users`
  ADD COLUMN `friends_public` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `online_public` TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE `user_profiles`
  ADD COLUMN `showcase_badges` VARCHAR(120) NULL;
