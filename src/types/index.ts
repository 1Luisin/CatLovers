import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type Category = "Filme" | "Serie" | "Jogo" | "Role" | "Anime" | "Plano";
export type MemoryCategory = Exclude<Category, "Plano">;
export type IdeaType = MemoryCategory | "Outros";
export type ThemeName =
  | "Romance"
  | "Lavanda"
  | "Floresta"
  | "Noite"
  | "Cinnamoroll"
  | "Chococat";
export type LegacyThemeName = ThemeName | "Light" | "Dark";

export type ThemePalette = {
  accent: string;
  accentSoft: string;
  background: string;
  surface: string;
  border: string;
  title: string;
  muted: string;
  heroColors: readonly [string, string];
  label: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  isDark?: boolean;
  character?: "Cinnamoroll" | "Chococat";
};

export type Profile = {
  id: string;
  code: "luis" | "leticia" | string;
  name: string;
  birthDate: string;
  bio: string;
  photoUri?: string;
  color: string;
  theme: ThemeName;
  notifications: boolean;
  privateProfile: boolean;
  weeklyQuestion: boolean;
};

export type CoupleItem = {
  id: string;
  title: string;
  category: Category;
  ideaType?: IdeaType;
  note: string;
  date: string;
  occurredOn?: string;
  plannedFor?: string;
  completedOn?: string;
  photoUri?: string;
  done: boolean;
  rating?: number;
  color: string;
  createdByProfileId?: string;
};

export type MonthlyGoal = {
  monthKey: string;
  title: string;
  description: string;
};

export type TabName = "inicio" | "colecao" | "planos" | "perfil";
export type CategoryFilter = "Todos" | MemoryCategory;
export type RatingFilter = "Todas" | "Sem avaliacao" | 1 | 2 | 3 | 4 | 5;
export type CollectionFilters = {
  category: CategoryFilter;
  month: string | null;
  rating: RatingFilter;
};
export type AddMode = "memory" | "plan";
export type UploadFile = {
  uri: string;
  name?: string;
  type?: string;
};
