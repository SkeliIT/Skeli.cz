-- Tables nothing on the site writes to or reads: features that were never built (favourites,
-- playlists, notifications, linked accounts) and the old UI translations, which have been read
-- from WEB-INF/i18n/messages_*.properties since September 2026.
DROP TABLE IF EXISTS `playlist_items`;
DROP TABLE IF EXISTS `playlists`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `linked_accounts`;
DROP TABLE IF EXISTS `translations`;
