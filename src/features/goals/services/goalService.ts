import { upsertMonthlyGoal } from "../../../services/apiClient";
import type { MonthlyGoal } from "../../../types";

export const persistMonthlyGoal = (
  goal: MonthlyGoal,
  createdByProfileId?: string,
) => upsertMonthlyGoal(goal.monthKey, goal, createdByProfileId);
