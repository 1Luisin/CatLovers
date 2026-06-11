import type { ImageSourcePropType } from "react-native";
import type { LegacyThemeName, ThemeName, ThemePalette } from "../types";

export const palette = {
  ink: "#29242B",
  muted: "#746C73",
  cream: "#FCF8F4",
  paper: "#FFFFFF",
  blush: "#EF9B92",
  rose: "#C65D6C",
  lilac: "#A58AC7",
  sage: "#7C9D8E",
  apricot: "#EBA56E",
  line: "#EDE4DE",
};

export const characterImages: Record<
  NonNullable<ThemePalette["character"]>,
  ImageSourcePropType
> = {
  Cinnamoroll: require("../../assets/themes/cinnamoroll.png"),
  Chococat: require("../../assets/themes/chococat.png"),
};

export const themes: Record<ThemeName, ThemePalette> = {
  Romance: {
    accent: "#C65D6C",
    accentSoft: "#F9E9E8",
    background: "#FCF8F4",
    surface: "#FFFFFF",
    border: "#EDE4DE",
    title: palette.ink,
    muted: palette.muted,
    heroColors: ["#D36A76", "#A77BC0"],
    label: "Romance",
    icon: "heart-outline",
  },
  Lavanda: {
    accent: "#9175BA",
    accentSoft: "#EEE8F7",
    background: "#FAF7FD",
    surface: "#FFFFFF",
    border: "#E4DAEF",
    title: palette.ink,
    muted: "#746B7D",
    heroColors: ["#A58AC7", "#C68BAD"],
    label: "Lavanda",
    icon: "flower-outline",
  },
  Floresta: {
    accent: "#557D6B",
    accentSoft: "#E3EFE9",
    background: "#F6FAF7",
    surface: "#FFFFFF",
    border: "#D6E5DC",
    title: "#26382F",
    muted: "#66756D",
    heroColors: ["#668E79", "#8DA978"],
    label: "Floresta",
    icon: "leaf-outline",
  },
  Noite: {
    accent: "#B89BE8",
    accentSoft: "#352D44",
    background: "#18151D",
    surface: "#25212B",
    border: "#403848",
    title: "#FFF8FC",
    muted: "#BEB3BD",
    heroColors: ["#514463", "#785B80"],
    label: "Noite",
    icon: "moon-outline",
    isDark: true,
  },
  Cinnamoroll: {
    accent: "#4BAFDF",
    accentSoft: "#DFF4FF",
    background: "#F3FBFF",
    surface: "#FFFFFF",
    border: "#CDEAF7",
    title: palette.ink,
    muted: "#667681",
    heroColors: ["#62C5EE", "#8FAEEB"],
    label: "Cinnamoroll",
    character: "Cinnamoroll",
  },
  Chococat: {
    accent: "#80563F",
    accentSoft: "#F1E3D2",
    background: "#FFF8EC",
    surface: "#FFFCF6",
    border: "#E6D1B8",
    title: "#4A3026",
    muted: "#78665B",
    heroColors: ["#6A4636", "#A17B5D"],
    label: "Chococat",
    character: "Chococat",
  },
};

export function normalizeThemeName(theme?: string | null): ThemeName {
  const value = theme as LegacyThemeName | undefined;
  if (value === "Dark") return "Noite";
  if (value === "Light") return "Romance";
  return value && value in themes ? (value as ThemeName) : "Romance";
}
