ALTER TABLE songs
  ADD COLUMN spotify_id VARCHAR(32) NULL AFTER apple_music_id,
  ADD UNIQUE KEY uq_songs_spotify_id (spotify_id);
