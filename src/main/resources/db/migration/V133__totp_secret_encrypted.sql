-- Klíč k dvoufázovému přihlášení se v databázi ukládá zašifrovaný, a to je delší text.
ALTER TABLE `users` MODIFY `totp_secret` VARCHAR(255) NULL;
