-- Sugestões opcionais. Execute manualmente após revisar no ambiente desejado.
-- Nenhum comando abaixo remove ou recria tabelas.

CREATE INDEX IF NOT EXISTS idx_couple_items_category
  ON couple_items(category);

CREATE INDEX IF NOT EXISTS idx_couple_items_created_by_profile_id
  ON couple_items(created_by_profile_id);

CREATE INDEX IF NOT EXISTS idx_item_photos_item_id
  ON item_photos(item_id);
