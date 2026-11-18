-- Vzhled chatu: zvlášť pro tmavý a pro světlý režim webu (prázdné = Základní). Povolené hodnoty hlídá model/ChatPrefs.
ALTER TABLE `user_chat_prefs`
  ADD COLUMN `look_dark` VARCHAR(8) NOT NULL DEFAULT '' AFTER `size`,
  ADD COLUMN `look_light` VARCHAR(8) NOT NULL DEFAULT '' AFTER `look_dark`;
