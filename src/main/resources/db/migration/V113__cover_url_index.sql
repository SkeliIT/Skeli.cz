-- Server u každého záhlaví hledá podle adresy, komu patří a jestli ho smí ukázat (web/files/ProfileImageServlet).
ALTER TABLE users ADD INDEX idx_users_cover_url (cover_url);
