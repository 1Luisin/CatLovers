import type { CoupleItem, MonthlyGoal } from "../types";
import { palette } from "../theme/themes";

export const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7);

export const initialItems: CoupleItem[] = [
  {
    id: "1",
    title: "Maratona de Severance",
    category: "Serie",
    note: "Dois episódios e sobremesa no sofá.",
    date: "12 JUN",
    done: true,
    rating: 5,
    color: palette.lilac,
  },
  {
    id: "2",
    title: "It Takes Two",
    category: "Jogo",
    note: "Terminamos o capítulo do jardim.",
    date: "02 JUN",
    done: true,
    rating: 5,
    color: palette.sage,
  },
];

export const initialMonthlyGoals: Record<string, MonthlyGoal> = {};
