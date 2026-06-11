import React, { type PropsWithChildren } from "react";
import { ScrollView, StyleSheet } from "react-native";
import type { ThemePalette } from "../types";

export function ScreenContainer({
  theme,
  children,
}: PropsWithChildren<{ theme: ThemePalette }>) {
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 100 } });
