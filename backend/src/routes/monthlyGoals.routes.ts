import { Router } from "express";
import {
  findMonthlyGoal,
  listMonthlyGoals,
  upsertMonthlyGoal,
} from "../repositories/monthlyGoalsRepository.js";
import { notifyMonthlyGoalCreated } from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isMonthKey, requireFields } from "../utils/http.js";

export const monthlyGoalsRouter = Router();

monthlyGoalsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json(await listMonthlyGoals());
  }),
);

monthlyGoalsRouter.get(
  "/:monthKey",
  asyncHandler(async (request, response) => {
    const goal = await findMonthlyGoal(String(request.params.monthKey));
    if (!goal) return response.status(404).json({ error: "Meta não encontrada." });
    response.json(goal);
  }),
);

monthlyGoalsRouter.put(
  "/:monthKey",
  asyncHandler(async (request, response) => {
    const monthKey = String(request.params.monthKey);
    if (!isMonthKey(monthKey)) {
      return response.status(400).json({ error: "monthKey deve usar o formato YYYY-MM." });
    }
    if (!requireFields(request.body, ["title", "description"], response)) return;
    const existing = await findMonthlyGoal(monthKey);
    const goal = await upsertMonthlyGoal(
      monthKey,
      request.body.title,
      request.body.description,
    );
    if (!goal) throw new Error("A meta criada não pôde ser consultada.");
    response.json(goal);
    if (!existing) {
      void notifyMonthlyGoalCreated(
        goal.title,
        monthKey,
        request.body.created_by_profile_id
          ? String(request.body.created_by_profile_id)
          : undefined,
      ).catch((error) =>
        console.error("Falha ao notificar nova meta mensal.", error),
      );
    }
  }),
);
