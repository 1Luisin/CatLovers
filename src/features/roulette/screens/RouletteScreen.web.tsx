import React from "react";
import { AppHeader } from "../../../components/common/AppComponents.web";
import styles from "../../../platforms/web/styles";
import type { ThemePalette as AppTheme } from "../../../types";
import { RouletteScreenBase } from "../components/RouletteScreenBase";

export function RouletteScreen({ theme }: { theme: AppTheme }) {
  return (
    <RouletteScreenBase theme={theme} styles={styles} Header={AppHeader} />
  );
}
