-- Odznaky CatSmash všem vynulované (přeskládání odměn podle vzácnosti, 2. 11. 2026): odznaky ze zápasů se smažou
-- a zvolené tituly, rámečky a znaky u jména se vrátí na žádné. Výhry, časy a tabulky zůstávají; odznaky z výher
-- počítá server jen z výher od 3. 11. 2026 (PongDao.BADGES_FROM).
DELETE FROM pong_badges;
UPDATE users SET pong_title = NULL, pong_frame = NULL, pong_mark = NULL
 WHERE pong_title IS NOT NULL OR pong_frame IS NOT NULL OR pong_mark IS NOT NULL;
