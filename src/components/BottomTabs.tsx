import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TabName, ThemePalette } from "../types";

const tabs: Array<{
  key: TabName;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}> = [
  { key: "inicio", label: "Início", icon: "home-outline" },
  { key: "colecao", label: "Coleção", icon: "albums-outline" },
  { key: "planos", label: "Planos", icon: "calendar-outline" },
  { key: "perfil", label: "Perfil", icon: "person-outline" },
];

export function BottomTabs({
  activeTab,
  theme,
  onChange,
}: {
  activeTab: TabName;
  theme: ThemePalette;
  onChange: (tab: TabName) => void;
}) {
  return (
    <View style={[styles.tabs, { backgroundColor: theme.surface }]}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab}>
            <Ionicons
              name={tab.icon}
              size={21}
              color={active ? theme.accent : theme.muted}
            />
            <Text style={{ color: active ? theme.accent : theme.muted }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", minHeight: 68 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
});
