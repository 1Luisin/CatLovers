import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type {
  Category,
  CollectionFilters,
  IdeaType,
  MemoryCategory,
  TabName,
} from "../types";
import { palette } from "../theme/themes";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const defaultCollectionFilters: CollectionFilters = {
  category: "Todos",
  month: null,
  rating: "Todas",
};

export const categoryMeta: Record<
  Category,
  { icon: IconName; color: string; label: string }
> = {
  Filme: { icon: "film-outline", color: palette.rose, label: "Filme" },
  Serie: { icon: "tv-outline", color: palette.lilac, label: "Série" },
  Jogo: { icon: "game-controller-outline", color: palette.sage, label: "Jogo" },
  Role: { icon: "location-outline", color: "#D48A62", label: "Rolê" },
  Anime: { icon: "sparkles-outline", color: "#7D78B8", label: "Anime" },
  Plano: { icon: "calendar-outline", color: palette.apricot, label: "Plano" },
};

export const ideaTypeMeta: Record<
  IdeaType,
  { icon: IconName; color: string; label: string }
> = {
  Filme: categoryMeta.Filme,
  Serie: categoryMeta.Serie,
  Jogo: categoryMeta.Jogo,
  Role: categoryMeta.Role,
  Anime: categoryMeta.Anime,
  Outros: {
    icon: "ellipsis-horizontal-outline",
    color: "#8B8388",
    label: "Outros",
  },
};

export const memoryCategories: MemoryCategory[] = [
  "Filme",
  "Serie",
  "Jogo",
  "Role",
  "Anime",
];

export const ideaTypes: IdeaType[] = [...memoryCategories, "Outros"];

export const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const monthAbbreviations = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
export const calendarWeekdayLabels = [
  "DOM",
  "SEG",
  "TER",
  "QUA",
  "QUI",
  "SEX",
  "SÁB",
];

export const tabs: Array<{
  key: TabName;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}> = [
  { key: "inicio", label: "Início", icon: "home-outline", activeIcon: "home" },
  {
    key: "colecao",
    label: "Coleção",
    icon: "albums-outline",
    activeIcon: "albums",
  },
  {
    key: "planos",
    label: "Planos",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    key: "roleta",
    label: "Roleta",
    icon: "aperture-outline",
    activeIcon: "aperture",
  },
  {
    key: "perfil",
    label: "Perfil",
    icon: "person-outline",
    activeIcon: "person",
  },
];

export const webTabs: Array<{
  key: TabName;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}> = [
  ...tabs.slice(0, 4),
  {
    key: "downloads",
    label: "Baixar",
    icon: "cloud-download-outline",
    activeIcon: "cloud-download",
  },
  tabs[4],
];
