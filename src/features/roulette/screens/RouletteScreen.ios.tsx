import React from "react";
import { AppHeader } from "../../../components/common/AppComponents.ios";
import styles from "../../../platforms/ios/styles";
import type { ThemePalette as AppTheme } from "../../../types";
import { RouletteScreenBase } from "../components/RouletteScreenBase";

export function RouletteScreen({ theme }: { theme: AppTheme }) {
  return (
    <RouletteScreenBase theme={theme} styles={styles} Header={AppHeader} />
  );
}
