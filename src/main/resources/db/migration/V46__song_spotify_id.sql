-- Spotify ID per song. IF NOT EXISTS: the test DB already got this as Vítězslav's V39.
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(32) NULL AFTER apple_music_id,
  ADD UNIQUE KEY IF NOT EXISTS uq_songs_spotify_id (spotify_id);
