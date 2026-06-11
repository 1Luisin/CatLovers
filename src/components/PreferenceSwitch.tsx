import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import type { ThemePalette } from "../types";

export function PreferenceSwitch({
  label,
  value,
  theme,
  onChange,
}: {
  label: string;
  value: boolean;
  theme: ThemePalette;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.title }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.accent, false: theme.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 58, flexDirection: "row", alignItems: "center" },
  label: { flex: 1, fontWeight: "700" },
});
