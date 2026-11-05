-- Záhlaví profilu: široký obrázek nahoře na Mém profilu a na /hrac/jméno. Nahrává si ho každý sám (NULL = neutrální pozadí).
-- cover_public = ukazovat ho ostatním (Nastavení → Soukromí → Co o mně vidí ostatní); vypnuté = ostatní vidí neutrální pozadí.
ALTER TABLE users
  ADD COLUMN cover_url VARCHAR(255) NULL,
  ADD COLUMN cover_public TINYINT(1) NOT NULL DEFAULT 1;
