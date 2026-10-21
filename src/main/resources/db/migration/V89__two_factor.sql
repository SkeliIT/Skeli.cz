-- Two-factor sign-in (TOTP, an authenticator app): optional for everyone, required for admins (AdminFilter).
-- totp_secret = the shared key (Base32); totp_last_step = the last 30-second step used, so a code works once.
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `totp_secret` VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS `totp_enabled_at` TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS `totp_last_step` BIGINT NULL;

-- backup codes for a lost phone: only a SHA-256 of each, each works once
CREATE TABLE IF NOT EXISTS `user_recovery_codes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `code_hash` CHAR(64) NOT NULL,
  `used_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `recovery_user` (`user_id`),
  CONSTRAINT `fk_recovery_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=ascii;
