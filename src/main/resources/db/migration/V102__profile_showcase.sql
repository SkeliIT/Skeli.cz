-- Profil: výstavka – oblíbený song (uuid písně) a moto / oblíbený úryvek textu. Obojí nepovinné.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS fav_song_uuid VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS motto VARCHAR(160) NULL;
