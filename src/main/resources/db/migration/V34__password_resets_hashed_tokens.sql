-- Reset tokens are now stored as SHA-256 hex digests; drop old plaintext tokens.
DELETE FROM `password_resets`;
