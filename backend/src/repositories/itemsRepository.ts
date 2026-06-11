import { randomUUID } from "node:crypto";
import { query } from "../db.js";

export type ItemRow = {
  id: string;
  title: string;
  category: string;
  idea_type: string | null;
  note: string | null;
  display_date: string | null;
  occurred_on: string | null;
  planned_for: string | null;
  completed_on: string | null;
  done: boolean;
  rating: number | null;
  color: string | null;
  created_by_profile_id: string | null;
  created_at: string;
  updated_at: string;
  photo_url: string | null;
};

const selectItem = `
  SELECT i.*,
    (SELECT public_url FROM item_photos p WHERE p.item_id = i.id
     ORDER BY p.created_at DESC LIMIT 1) AS photo_url
  FROM couple_items i
`;

export async function listItems(profileId?: string) {
  const where = profileId ? "WHERE i.created_by_profile_id = $1" : "";
  return (
    await query<ItemRow>(
      `${selectItem} ${where} ORDER BY i.created_at DESC`,
      profileId ? [profileId] : [],
    )
  ).rows;
}

export async function findItem(id: string) {
  return (await query<ItemRow>(`${selectItem} WHERE i.id = $1`, [id])).rows[0];
}

export async function createItem(body: Record<string, unknown>) {
  const isPlan = body.category === "Plano";
  const id = randomUUID();
  await query(
    `INSERT INTO couple_items (
      id, title, category, idea_type, note, display_date, occurred_on,
      planned_for, completed_on, done, rating, color, created_by_profile_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      id,
      body.title,
      body.category,
      isPlan ? body.idea_type ?? null : null,
      body.note ?? null,
      body.display_date ?? null,
      isPlan ? null : body.occurred_on ?? null,
      isPlan ? body.planned_for ?? null : null,
      null,
      isPlan ? false : true,
      isPlan ? null : body.rating ?? null,
      body.color ?? null,
      body.created_by_profile_id ?? null,
    ],
  );
  return findItem(id);
}

export async function updateItem(id: string, body: Record<string, unknown>) {
  const current = await findItem(id);
  if (!current) return undefined;
  const category = String(body.category ?? current.category);
  const isPlan = category === "Plano";
  await query(
    `UPDATE couple_items SET
      title = $1, category = $2, idea_type = $3, note = $4, display_date = $5,
      occurred_on = $6, planned_for = $7, rating = $8, color = $9,
      created_by_profile_id = $10, done = $11, completed_on = $12,
      updated_at = NOW()
     WHERE id = $13`,
    [
      body.title ?? current.title,
      category,
      isPlan ? body.idea_type ?? current.idea_type : null,
      body.note ?? current.note,
      body.display_date ?? current.display_date,
      isPlan ? null : body.occurred_on ?? current.occurred_on,
      isPlan ? body.planned_for ?? current.planned_for : null,
      isPlan ? null : body.rating ?? current.rating,
      body.color ?? current.color,
      body.created_by_profile_id ?? current.created_by_profile_id,
      isPlan ? current.done : true,
      isPlan ? current.completed_on : null,
      id,
    ],
  );
  return findItem(id);
}

export async function toggleItem(id: string) {
  await query(
    `UPDATE couple_items SET
      done = NOT done,
      completed_on = CASE WHEN done = FALSE THEN CURRENT_DATE ELSE NULL END,
      updated_at = NOW()
     WHERE id = $1 AND category = 'Plano'`,
    [id],
  );
  return findItem(id);
}

export async function listPhotoPaths(id: string) {
  return (
    await query<{ file_path: string }>(
      "SELECT file_path FROM item_photos WHERE item_id = $1",
      [id],
    )
  ).rows.map((row) => row.file_path);
}

export const deleteItem = (id: string) =>
  query("DELETE FROM couple_items WHERE id = $1 RETURNING id", [id]);

export async function replaceItemPhoto(
  id: string,
  file: Express.Multer.File,
  publicUrl: string,
) {
  const previous = await listPhotoPaths(id);
  await query("DELETE FROM item_photos WHERE item_id = $1", [id]);
  await query(
    `INSERT INTO item_photos (
      id, item_id, original_name, file_name, file_path, public_url, mime_type, size_bytes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      randomUUID(),
      id,
      file.originalname,
      file.filename,
      file.path,
      publicUrl,
      file.mimetype,
      file.size,
    ],
  );
  return previous;
}
