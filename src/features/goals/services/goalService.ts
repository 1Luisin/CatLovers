import { upsertMonthlyGoal } from "../../../services/apiClient";
import type { MonthlyGoal } from "../../../types";

export const persistMonthlyGoal = (goal: MonthlyGoal) =>
  upsertMonthlyGoal(goal.monthKey, goal);
