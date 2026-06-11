import { query } from "../db.js";

export type MonthlyGoalRow = {
  month_key: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export async function listMonthlyGoals() {
  return (
    await query<MonthlyGoalRow>(
      "SELECT * FROM monthly_goals ORDER BY month_key DESC",
    )
  ).rows;
}

export async function findMonthlyGoal(monthKey: string) {
  return (
    await query<MonthlyGoalRow>(
      "SELECT * FROM monthly_goals WHERE month_key = $1",
      [monthKey],
    )
  ).rows[0];
}

export async function upsertMonthlyGoal(
  monthKey: string,
  title: string,
  description: string,
) {
  return (
    await query<MonthlyGoalRow>(
      `INSERT INTO monthly_goals (month_key, title, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (month_key) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         updated_at = NOW()
       RETURNING *`,
      [monthKey, title, description],
    )
  ).rows[0];
}
