-- Záznam změn v adminu a koš na 30 dní (admin → Záznam změn a koš).

-- Kdo co v adminu udělal: každý úkon (uložení, smazání, změna role…) jeden řádek. Maže se po roce.
CREATE TABLE IF NOT EXISTS `admin_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` INT UNSIGNED NULL,
  `username` VARCHAR(100) NOT NULL,
  `action` VARCHAR(120) NOT NULL,
  `target` VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `admin_log_at` (`at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Koš: kopie všeho, co se smazáním písně, klipu, textu nebo komentáře zmizelo (i navázané řádky, třeba
-- komentáře a hlasy), aby šel omyl vrátit. Po 30 dnech se smaže natrvalo.
CREATE TABLE IF NOT EXISTS `admin_trash` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deleted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `username` VARCHAR(100) NOT NULL,
  `kind` VARCHAR(16) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `restored_at` TIMESTAMP NULL,
  `restored_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  KEY `admin_trash_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
