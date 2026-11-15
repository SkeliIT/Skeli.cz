-- Medaile šampiona CatSmash už nemá přednost před vybraným rámečkem: je to jedna z voleb v Nastavení
-- (users.pong_frame = 'champ'), ukáže se jen dokud je člověk v první trojce. Kdo zatím žádný rámeček nevybral a medaili
-- nevypnul (pong_champ = 1), dostane volbu medaile – nikomu se tak nic nezmění, dokud si sám nevybere jinak.
-- Sloupec pong_champ zůstává (nasazené migrace se nemění), web se podle něj už neřídí.
UPDATE users SET pong_frame = 'champ' WHERE pong_champ = 1 AND (pong_frame IS NULL OR pong_frame = '');
