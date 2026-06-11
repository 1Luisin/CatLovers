import { randomUUID } from "node:crypto";
import { query } from "../db.js";

export type ProfileRow = {
  id: string;
  user_id: string | null;
  code: string;
  name: string;
  birth_date: string | null;
  bio: string | null;
  photo_url: string | null;
  color: string | null;
  theme: string;
  notifications: boolean;
  private_profile: boolean;
  weekly_question: boolean;
  created_at: string;
  updated_at: string;
};

const columns = `
  id, user_id, code, name, birth_date, bio, photo_url, color, theme,
  notifications, private_profile, weekly_question, created_at, updated_at
`;

export async function listProfiles() {
  return (await query<ProfileRow>(`SELECT ${columns} FROM profiles ORDER BY name`)).rows;
}

export async function findProfile(id: string) {
  return (
    await query<ProfileRow>(
      `SELECT ${columns} FROM profiles WHERE id = $1 OR code = $1`,
      [id],
    )
  ).rows[0];
}

export async function createProfile(body: Record<string, unknown>) {
  return (
    await query<ProfileRow>(
      `INSERT INTO profiles (
        id, user_id, code, name, birth_date, bio, photo_url, color, theme,
        notifications, private_profile, weekly_question
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING ${columns}`,
      [
        randomUUID(),
        body.user_id ?? null,
        body.code,
        body.name,
        body.birth_date ?? null,
        body.bio ?? null,
        body.photo_url ?? null,
        body.color ?? null,
        body.theme ?? "Romance",
        body.notifications ?? true,
        body.private_profile ?? true,
        body.weekly_question ?? false,
      ],
    )
  ).rows[0];
}

export async function updateProfile(
  id: string,
  body: Record<string, unknown>,
  settingsOnly = false,
) {
  const allowed = settingsOnly
    ? ["theme", "notifications", "private_profile", "weekly_question"]
    : [
        "name",
        "birth_date",
        "bio",
        "color",
        "theme",
        "notifications",
        "private_profile",
        "weekly_question",
      ];
  const entries = allowed.filter((field) => body[field] !== undefined);
  if (!entries.length) return findProfile(id);
  const assignments = entries.map((field, index) => `${field} = $${index + 1}`);
  const values = entries.map((field) => body[field]);
  values.push(id);
  return (
    await query<ProfileRow>(
      `UPDATE profiles SET ${assignments.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length} OR code = $${values.length}
       RETURNING ${columns}`,
      values,
    )
  ).rows[0];
}

export async function updateProfilePhoto(id: string, photoUrl: string) {
  return (
    await query<ProfileRow>(
      `UPDATE profiles SET photo_url = $1, updated_at = NOW()
       WHERE id = $2 OR code = $2 RETURNING ${columns}`,
      [photoUrl, id],
    )
  ).rows[0];
}
