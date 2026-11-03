-- Rámeček šampiona CatSmash: první tři ze „Šampionů měsíce“ mají kolem fotky zlatý / stříbrný / bronzový rámeček
-- (má přednost před vybraným). Hráč si ho může v Nastavení vypnout; výchozí = ukazovat.
ALTER TABLE users ADD COLUMN pong_champ TINYINT(1) NOT NULL DEFAULT 1;
