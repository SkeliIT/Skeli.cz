-- Song UUID is the stable public identifier (share links, /song/{uuid}).
-- Internal FKs keep using songs.id; fill any missing UUIDs and require them going forward.

UPDATE `songs`
SET `uuid` = UUID()
WHERE `uuid` IS NULL OR `uuid` = '';

ALTER TABLE `songs`
  MODIFY COLUMN `uuid` varchar(36) NOT NULL;
