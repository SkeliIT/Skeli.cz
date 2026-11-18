-- Veřejný profil pro lidi s tvorbou: když si ho člověk zapne, uvidí jméno, fotku, představení a skladby i nepřihlášený. Výchozí je vypnuto.
ALTER TABLE `users` ADD COLUMN `web_public` TINYINT(1) NOT NULL DEFAULT 0;
