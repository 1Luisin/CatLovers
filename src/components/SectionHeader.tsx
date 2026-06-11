import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemePalette } from "../types";

export function SectionHeader({
  title,
  subtitle,
  theme,
}: {
  title: string;
  subtitle?: string;
  theme: ThemePalette;
}) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.title }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { marginTop: 4, fontSize: 12 },
});
