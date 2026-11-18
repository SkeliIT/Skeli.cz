-- Žádosti o přátelství: všem, kdo jsou registrovaní do teď, se vypnou (přání Skeliho 2026-11-09).
-- Přátelé jsou na webu nová věc a nikdo o ně zatím nežádal, tak ať je nikdo nedostává, dokud si je sám
-- nezapne v Nastavení → Soukromí. Noví lidé dál začínají se zapnutým (výchozí hodnota sloupce zůstává 1).
UPDATE `users` SET `friend_requests` = 0;
