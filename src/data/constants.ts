import type { CoupleItem, MonthlyGoal } from "../types";
import { palette } from "../theme/themes";

export const PLANS_MONTH_KEY = "2026-06";
export const PLANS_MONTH_LABEL = "Junho 2026";
export const RELATIONSHIP_START_DATE = "2026-06-12";

export const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7);

export const getDaysTogether = (currentDate = new Date()) => {
  const [year, month, day] = RELATIONSHIP_START_DATE.split("-").map(Number);
  const startDate = Date.UTC(year, month - 1, day);
  const today = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );

  return Math.max(0, Math.floor((today - startDate) / 86_400_000) + 1);
};

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
  {
    id: "3",
    title: "Past Lives",
    category: "Filme",
    note: "Bonito, delicado e rendeu uma conversa enorme.",
    date: "28 MAI",
    done: true,
    rating: 4,
    color: palette.rose,
  },
  {
    id: "4",
    title: "Café novo no centro",
    category: "Plano",
    ideaType: "Role",
    note: "Ir de manhã e caminhar pela livraria depois.",
    date: "21 JUN",
    plannedFor: "2026-06-21",
    done: false,
    color: palette.apricot,
  },
  {
    id: "5",
    title: "Tempo sem celular",
    category: "Plano",
    ideaType: "Role",
    note: "Jantar feito juntos e cartas na mesa.",
    date: "27 JUN",
    plannedFor: "2026-06-27",
    done: false,
    color: palette.blush,
  },
];

export const initialMonthlyGoals: Record<string, MonthlyGoal> = {
  [PLANS_MONTH_KEY]: {
    monthKey: PLANS_MONTH_KEY,
    title: "Mais tempo para nós",
    description: "Sem pressa. O importante é fazer caber na vida real.",
  },
};
