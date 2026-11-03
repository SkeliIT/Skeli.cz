-- Veřejný profil hráče (/hrac/jméno): vidí ho jen přihlášení. Hráč si ho může v Nastavení skrýt – pak má v tabulkách
-- jméno bez odkazu a stránka hlásí, že profil není veřejný. Výchozí = ukazovat (přihlášeným).
ALTER TABLE users ADD COLUMN profile_public TINYINT(1) NOT NULL DEFAULT 1;
