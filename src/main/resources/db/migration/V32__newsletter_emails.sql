-- V28__newsletter_emails.sql
CREATE TABLE IF NOT EXISTS newsletter_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribe_token VARCHAR(64) NOT NULL,
    unsubscribed_at TIMESTAMP NULL
);
