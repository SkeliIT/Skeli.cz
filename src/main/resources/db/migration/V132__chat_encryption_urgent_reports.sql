-- Zprávy se v databázi ukládají zašifrované, a to je delší text: 1000 znaků už se do VARCHAR(1000) nevejde.
ALTER TABLE `chat_messages` MODIFY `body` TEXT NOT NULL;
ALTER TABLE `chat_reports` MODIFY `body_copy` TEXT NOT NULL;

-- Naléhavá nahlášení: jdou v adminu nahoru a přijde na ně e-mail.
ALTER TABLE `chat_reports` MODIFY `reason` ENUM('spam','abuse','other','illegal','child') NOT NULL;
ALTER TABLE `user_reports` MODIFY `reason` ENUM('spam','abuse','image','fake','other','music','illegal','child') NOT NULL;
