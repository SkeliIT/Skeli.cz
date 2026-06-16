-- V30__social_posts_add_lang.sql
-- Add language column to social_posts for i18n filtering
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS lang VARCHAR(5) DEFAULT 'cs' AFTER source;
ALTER TABLE social_posts ADD INDEX IF NOT EXISTS idx_lang (lang);

-- Update existing posts to have proper language codes based on post_id
UPDATE social_posts SET lang = 'cs' WHERE post_id LIKE '%launch-cs-%';
UPDATE social_posts SET lang = 'en' WHERE post_id LIKE '%launch-en-%';
UPDATE social_posts SET lang = 'de' WHERE post_id LIKE '%launch-de-%';
UPDATE social_posts SET lang = 'uk' WHERE post_id LIKE '%launch-uk-%';
