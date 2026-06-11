import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const profiles = [
  {
    code: "leticia",
    name: "Letícia",
    birthDate: "2003-09-18",
    bio: "Apaixonada por histórias, café e pelos nossos domingos sem pressa.",
    color: "#E9A29D",
    theme: "Cinnamoroll",
    weeklyQuestion: true,
  },
  {
    code: "luis",
    name: "Luis",
    birthDate: "2001-05-03",
    bio: "Jogos cooperativos, filmes longos e qualquer plano que seja a dois.",
    color: "#9B8BC1",
    theme: "Dark",
    weeklyQuestion: false,
  },
];

try {
  for (const profile of profiles) {
    await pool.query(
      `INSERT INTO profiles (
        id, user_id, code, name, birth_date, bio, color, theme,
        notifications, weekly_question
      ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, TRUE, $8)
      ON CONFLICT (code) DO NOTHING`,
      [
        randomUUID(),
        profile.code,
        profile.name,
        profile.birthDate,
        profile.bio,
        profile.color,
        profile.theme,
        profile.weeklyQuestion,
      ],
    );
  }
  console.log("Seed concluído sem duplicar perfis.");
} finally {
  await pool.end();
}
