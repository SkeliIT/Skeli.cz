-- CatSmash: jméno a fotka v tabulkách (Skóre, Čas, šampioni) a v upozornění „X tě předběhl“ jen se souhlasem.
-- Výchozí 0 = anonymně, i pro všechny stávající účty: kdo chce být v tabulce vidět, zapne si to v Nastavení → Soukromí.
ALTER TABLE users ADD COLUMN IF NOT EXISTS pong_public TINYINT(1) NOT NULL DEFAULT 0;
