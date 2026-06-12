import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  calendarWeekdayLabels,
  categoryMeta,
  defaultCollectionFilters,
  ideaTypeMeta,
  ideaTypes,
  memoryCategories,
  monthNames,
  weekdayLabels,
} from "../../../data/uiConstants";
import {
  formatCardDate,
  formatFullDate,
  fromIsoDate,
  toIsoDate,
} from "../../../utils/date";
import {
  getItemDate,
  getMonthGroup,
  getPlanCalendarDate,
} from "../../../features/memories/utils/items";
import { characterImages, palette, themes } from "../../../theme/themes";
import type {
  AddMode,
  Category,
  CategoryFilter,
  CollectionFilters,
  CoupleItem,
  IdeaType,
  MemoryCategory,
  MonthlyGoal,
  Profile,
  RatingFilter,
  ThemeName,
  ThemePalette as AppTheme,
} from "../../../types";
import { AppHeader, MemoryCard, ProfileAvatar } from "../../../components/common/AppComponents.ios";
import styles from "../../../platforms/ios/styles";

export function MonthlyGoalModal({
  visible,
  monthKey,
  monthLabel,
  goal,
  theme,
  onClose,
  onSave,
}: {
  visible: boolean;
  monthKey: string;
  monthLabel: string;
  goal?: MonthlyGoal;
  theme: AppTheme;
  onClose: () => void;
  onSave: (goal: MonthlyGoal) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const isEditing = Boolean(goal);

  useEffect(() => {
    if (!visible) return;
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
  }, [goal, visible]);

  const save = () => {
    if (!title.trim()) {
      Alert.alert("Falta um título", "Dê um título para a meta mensal.");
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        "Falta uma descrição",
        "Conte como vocês pretendem viver essa meta.",
      );
      return;
    }
    onSave({
      monthKey,
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalDismiss} onPress={onClose} />
        <View
          style={[styles.goalModalSheet, { backgroundColor: theme.background }]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: theme.accent }]}>
                {monthLabel.toUpperCase()}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.title }]}>
                {isEditing ? "Editar meta mensal" : "Criar meta mensal"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar meta mensal"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="close" size={22} color={theme.title} />
            </Pressable>
          </View>

          <Text style={[styles.goalModalIntro, { color: theme.muted }]}>
            Cada mês pode ter uma única meta compartilhada.
          </Text>

          <Text style={[styles.inputLabel, { color: theme.title }]}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex.: Mais tempo para nós"
            placeholderTextColor="#AFA4AA"
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.title,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.title }]}>
            Descrição
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Como vocês querem colocar essa meta em prática?"
            placeholderTextColor="#AFA4AA"
            style={[
              styles.input,
              styles.goalDescriptionInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.title,
              },
            ]}
            multiline
            maxLength={220}
          />
          <Text style={styles.characterCount}>{description.length}/220</Text>

          <Pressable onPress={save} style={styles.saveButton}>
            <LinearGradient
              colors={theme.heroColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? "Salvar meta mensal" : "Criar meta mensal"}
              </Text>
              <Ionicons name="flag" size={17} color={palette.paper} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
