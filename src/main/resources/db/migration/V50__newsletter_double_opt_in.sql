-- Newsletter double opt-in: an address counts as a subscriber only after the link in the
-- confirmation e-mail was clicked. Only the SHA-256 of the link token is stored.
ALTER TABLE `newsletter_emails`
  ADD COLUMN `confirmed_at` TIMESTAMP NULL AFTER `subscribed_at`,
  ADD COLUMN `confirm_token_hash` CHAR(64) NULL AFTER `confirmed_at`,
  ADD COLUMN `confirm_sent_at` TIMESTAMP NULL AFTER `confirm_token_hash`;

-- Addresses subscribed before this change stay subscribed.
UPDATE `newsletter_emails`
SET `confirmed_at` = `subscribed_at`
WHERE `unsubscribed_at` IS NULL;
