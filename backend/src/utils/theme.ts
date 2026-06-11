export type ThemeName = "Light" | "Dark" | "Cinnamoroll" | "Chococat";

export function normalizeThemeName(theme: unknown): ThemeName {
  if (theme === "Dark" || theme === "Noite") return "Dark";
  if (theme === "Cinnamoroll" || theme === "Chococat") return theme;
  if (
    theme === "Light" ||
    theme === "Romance" ||
    theme === "Lavanda" ||
    theme === "Floresta"
  ) {
    return "Light";
  }
  return "Light";
}
