-- Vzhledy profilu 2026-11: starých 8 vzhledů nahradilo 12 nových (model/Rewards, css/profile-looks.css).
-- Kdo měl starý vzhled vybraný, dostane nový na stejném místě; kdo si starý odemkl, má odemčený i nový
-- (se stejným datem získání). Nikdo o nic nepřijde. „levandule“ byla jen na testu krátce před Y2K chromem.
--   Obálka → Komiks, Galerie → Zápisník, Polární záře → Půlnoční třpyt, Kokpit → Noční jízda,
--   Monolit → Mixtape, Radar → Metro, Zeď → Sakura, Hologram → Carbon, (Levandule → Y2K chrom)

START TRANSACTION;

-- odemčené odměny: nový klíč se stejným datem, starý pryč
INSERT IGNORE INTO user_rewards (user_id, reward, got_at)
SELECT user_id,
       CASE reward
         WHEN 'profile:cover'     THEN 'profile:komiks'
         WHEN 'profile:gal'       THEN 'profile:zapisnik'
         WHEN 'profile:aurora'    THEN 'profile:trpyt'
         WHEN 'profile:cock'      THEN 'profile:jizda'
         WHEN 'profile:mono'      THEN 'profile:mixtape'
         WHEN 'profile:radar'     THEN 'profile:metro'
         WHEN 'profile:wall'      THEN 'profile:sakura'
         WHEN 'profile:holo'      THEN 'profile:carbon'
         WHEN 'profile:levandule' THEN 'profile:y2k'
       END,
       got_at
FROM user_rewards
WHERE reward IN ('profile:cover', 'profile:gal', 'profile:aurora', 'profile:cock', 'profile:mono',
                 'profile:radar', 'profile:wall', 'profile:holo', 'profile:levandule');

DELETE FROM user_rewards
WHERE reward IN ('profile:cover', 'profile:gal', 'profile:aurora', 'profile:cock', 'profile:mono',
                 'profile:radar', 'profile:wall', 'profile:holo', 'profile:levandule');

-- vybraný vzhled profilu
UPDATE user_looks
SET value = CASE value
              WHEN 'cover'     THEN 'komiks'
              WHEN 'gal'       THEN 'zapisnik'
              WHEN 'aurora'    THEN 'trpyt'
              WHEN 'cock'      THEN 'jizda'
              WHEN 'mono'      THEN 'mixtape'
              WHEN 'radar'     THEN 'metro'
              WHEN 'wall'      THEN 'sakura'
              WHEN 'holo'      THEN 'carbon'
              WHEN 'levandule' THEN 'y2k'
            END
WHERE slot = 'profile'
  AND value IN ('cover', 'gal', 'aurora', 'cock', 'mono', 'radar', 'wall', 'holo', 'levandule');

COMMIT;
