-- CatSmash: rámeček kolem fotky uživatele (klíč odznaku z PongBadges.FRAMES), vidět v komentářích, v tabulce a na profilu
ALTER TABLE users ADD COLUMN IF NOT EXISTS pong_frame VARCHAR(20) NULL;
