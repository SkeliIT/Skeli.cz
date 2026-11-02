-- CatSmash: legendární znak u jména (odznaky za nejtěžší obtížnost: koruna, blesk, lebka, terč, fénix).
-- Dobrovolný: NULL = neukazovat (výchozí), hráč si ho zapne v Nastavení → Profil.
ALTER TABLE users ADD COLUMN IF NOT EXISTS pong_mark VARCHAR(20) NULL;
