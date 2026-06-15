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
} from "../../data/uiConstants";
import {
  formatCardDate,
  formatFullDate,
  fromIsoDate,
  toIsoDate,
} from "../../utils/date";
import {
  getItemDate,
  getMonthGroup,
  getPlanCalendarDate,
} from "../../features/memories/utils/items";
import { characterImages, palette, themes } from "../../theme/themes";
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
} from "../../types";
import { AppHeader, MemoryCard, ProfileAvatar } from "../../components/common/AppComponents.web";
import styles from "../../platforms/web/styles";

export function DateCalendar({
  selectedDate,
  visibleMonth,
  range,
  theme,
  onChangeMonth,
  onSelect,
}: {
  selectedDate?: string;
  visibleMonth: Date;
  range: "past" | "future";
  theme: AppTheme;
  onChangeMonth: (month: Date) => void;
  onSelect: (date: string) => void;
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayIso = toIsoDate(today);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrevious = range === "past" || visibleMonth > currentMonth;
  const canGoNext = range === "future" || visibleMonth < currentMonth;
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <View
      style={[
        styles.calendarCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.calendarHeader}>
        <Pressable
          disabled={!canGoPrevious}
          onPress={() => onChangeMonth(new Date(year, month - 1, 1))}
          style={[
            styles.calendarNavButton,
            !canGoPrevious && styles.calendarNavDisabled,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={canGoPrevious ? theme.accent : "#CFC5BF"}
          />
        </Pressable>
        <Text style={[styles.calendarMonth, { color: theme.title }]}>
          {monthNames[month]} {year}
        </Text>
        <Pressable
          disabled={!canGoNext}
          onPress={() => onChangeMonth(new Date(year, month + 1, 1))}
          style={[styles.calendarNavButton, !canGoNext && styles.calendarNavDisabled]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNext ? theme.accent : "#CFC5BF"}
          />
        </Pressable>
      </View>

      <View style={styles.calendarGrid}>
        {weekdayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.calendarWeekday}>
            {label}
          </Text>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
          }
          const isoDate = toIsoDate(new Date(year, month, day));
          const selected = isoDate === selectedDate;
          const disabled =
            isoDate !== selectedDate &&
            (range === "past" ? isoDate > todayIso : isoDate < todayIso);
          return (
            <Pressable
              key={isoDate}
              disabled={disabled}
              onPress={() => onSelect(isoDate)}
              style={styles.calendarDayCell}
            >
              <View
                style={[
                  styles.calendarDay,
                  selected && { backgroundColor: theme.accent },
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    selected && styles.calendarDayTextSelected,
                    disabled && styles.calendarDayTextDisabled,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CategorySelector({
  label,
  category,
  options,
  theme,
  onChange,
}: {
  label: string;
  category: IdeaType;
  options: IdeaType[];
  theme: AppTheme;
  onChange: (category: IdeaType) => void;
}) {
  return (
    <>
      <Text style={[styles.inputLabel, { color: theme.title }]}>{label}</Text>
      <View style={styles.categoryGrid}>
        {options.map((item) => {
          const meta = ideaTypeMeta[item];
          const active = category === item;
          return (
            <Pressable
              key={item}
              onPress={() => onChange(item)}
              style={[
                styles.categoryOption,
                active && {
                  borderColor: meta.color,
                  backgroundColor: `${meta.color}12`,
                },
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={20}
                color={active ? meta.color : palette.muted}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  active && { color: meta.color },
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export function AddModal({
  visible,
  mode,
  editingItem,
  theme,
  onClose,
  onSave,
}: {
  visible: boolean;
  mode: AddMode;
  editingItem?: CoupleItem;
  theme: AppTheme;
  onClose: () => void;
  onSave: (item: CoupleItem) => void;
}) {
  const [category, setCategory] = useState<MemoryCategory>("Filme");
  const [ideaType, setIdeaType] = useState<IdeaType>("Role");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [plannedDate, setPlannedDate] = useState<string>();
  const [photoUri, setPhotoUri] = useState<string>();
  const [rating, setRating] = useState(0);
  const isPlan = mode === "plan";
  const isEditingMemory =
    mode === "memory" &&
    Boolean(editingItem) &&
    editingItem?.category !== "Plano";

  useEffect(() => {
    if (!visible) return;
    const today = new Date();
    const editingDate = editingItem
      ? editingItem.occurredOn ?? toIsoDate(getItemDate(editingItem))
      : null;
    const initialDate = editingDate ?? toIsoDate(today);
    const initialDateValue = fromIsoDate(initialDate);

    setTitle(editingItem?.title ?? "");
    setNote(editingItem?.note ?? "");
    setCategory(
      editingItem && editingItem.category !== "Plano"
        ? editingItem.category
        : "Filme",
    );
    setIdeaType(editingItem?.ideaType ?? "Role");
    setSelectedDate(initialDate);
    setVisibleMonth(
      new Date(initialDateValue.getFullYear(), initialDateValue.getMonth(), 1),
    );
    setCalendarVisible(false);
    setPlannedDate(undefined);
    setPhotoUri(editingItem?.photoUri);
    setRating(editingItem?.rating ?? 0);
  }, [editingItem, mode, visible]);

  const chooseMemoryPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso às fotos para escolher uma imagem da lembrança.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    if (!title.trim()) {
      Alert.alert(
        "Falta um título",
        isPlan ? "Dê um nome para esse plano." : "Dê um nome para essa lembrança.",
      );
      return;
    }
    const savedCategory: Category = isPlan ? "Plano" : category;
    onSave({
      ...editingItem,
      id: editingItem?.id ?? Date.now().toString(),
      title: title.trim(),
      note:
        note.trim() ||
        (isPlan
          ? "Um novo momento para viver juntos."
          : "Uma lembrança especial guardada juntos."),
      category: savedCategory,
      ideaType: isPlan ? ideaType : undefined,
      date: isPlan
        ? plannedDate
          ? formatCardDate(plannedDate)
          : "EM BREVE"
        : formatCardDate(selectedDate),
      occurredOn: isPlan ? undefined : selectedDate,
      plannedFor: isPlan ? plannedDate : undefined,
      photoUri: isPlan ? undefined : photoUri,
      done: editingItem?.done ?? !isPlan,
      rating: isPlan || rating === 0 ? undefined : rating,
      color: isPlan
        ? ideaTypeMeta[ideaType].color
        : categoryMeta[savedCategory].color,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalDismiss} onPress={onClose} />
        <View
          style={[styles.modalSheet, { backgroundColor: theme.background }]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: theme.accent }]}>
                {isPlan
                  ? "PLANEJAR JUNTOS"
                  : isEditingMemory
                    ? "ATUALIZAR LEMBRANÇA"
                    : "GUARDAR JUNTOS"}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.title }]}>
                {isPlan
                  ? "Novo plano"
                  : isEditingMemory
                    ? "Editar lembrança"
                    : "Nova lembrança"}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="close" size={22} color={theme.title} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {isPlan ? (
            <>
              <CategorySelector
                label="Tipo de ideia"
                category={ideaType}
                options={ideaTypes}
                theme={theme}
                onChange={setIdeaType}
              />

              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Data prevista (opcional)
              </Text>
              <Pressable
                onPress={() => setCalendarVisible((current) => !current)}
                style={[
                  styles.datePickerButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.datePickerIcon,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Ionicons
                    name={
                      plannedDate
                        ? "calendar-outline"
                        : "calendar-clear-outline"
                    }
                    size={19}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.datePickerText}>
                  <Text style={[styles.datePickerValue, { color: theme.title }]}>
                    {plannedDate
                      ? formatFullDate(plannedDate)
                      : "Sem data prevista"}
                  </Text>
                  <Text style={styles.datePickerHint}>
                    {plannedDate
                      ? "Toque para escolher outra data"
                      : "Toque para escolher uma data"}
                  </Text>
                </View>
                <Ionicons
                  name={calendarVisible ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.accent}
                />
              </Pressable>
              {calendarVisible && (
                <DateCalendar
                  selectedDate={plannedDate}
                  visibleMonth={visibleMonth}
                  range="future"
                  theme={theme}
                  onChangeMonth={setVisibleMonth}
                  onSelect={(date) => {
                    setPlannedDate(date);
                    setCalendarVisible(false);
                  }}
                />
              )}
              {plannedDate && (
                <Pressable
                  onPress={() => {
                    setPlannedDate(undefined);
                    setCalendarVisible(false);
                  }}
                  style={styles.clearPlannedDateButton}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color={theme.accent}
                  />
                  <Text
                    style={[
                      styles.clearPlannedDateText,
                      { color: theme.accent },
                    ]}
                  >
                    Remover data prevista
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <CategorySelector
                label="Que lembrança vamos guardar?"
                category={category}
                options={memoryCategories}
                theme={theme}
                onChange={(selectedCategory) =>
                  selectedCategory !== "Outros" && setCategory(selectedCategory)
                }
              />

              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Quando aconteceu?
              </Text>
              <Pressable
                onPress={() => setCalendarVisible((current) => !current)}
                style={[
                  styles.datePickerButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.datePickerIcon,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.datePickerText}>
                  <Text style={[styles.datePickerValue, { color: theme.title }]}>
                    {formatFullDate(selectedDate)}
                  </Text>
                  <Text style={styles.datePickerHint}>
                    Toque para escolher outra data
                  </Text>
                </View>
                <Ionicons
                  name={calendarVisible ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.accent}
                />
              </Pressable>
              {calendarVisible && (
                <DateCalendar
                  selectedDate={selectedDate}
                  visibleMonth={visibleMonth}
                  range="past"
                  theme={theme}
                  onChangeMonth={setVisibleMonth}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarVisible(false);
                  }}
                />
              )}
            </>
          )}

          <Text style={[styles.inputLabel, { color: theme.title }]}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={isPlan ? "Ex.: Conhecer um café novo" : "Ex.: Cinema na sexta"}
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
            {isPlan ? "Detalhes do plano" : "Um detalhe para lembrar"}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={
              isPlan
                ? "O que vocês querem fazer?"
                : "O que tornou esse momento nosso?"
            }
            placeholderTextColor="#AFA4AA"
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.title,
              },
            ]}
            multiline
          />

          {!isPlan && (
            <>
              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Quantas estrelas essa lembrança merece?
              </Text>
              <View
                style={[
                  styles.ratingPicker,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.ratingPickerStars}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    const selected = value <= rating;
                    return (
                      <Pressable
                        key={value}
                        accessibilityLabel={`${value} ${
                          value === 1 ? "estrela" : "estrelas"
                        }`}
                        onPress={() => setRating(value)}
                        style={({ pressed }) => [
                          styles.ratingStarButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name={selected ? "star" : "star-outline"}
                          size={29}
                          color={selected ? palette.apricot : "#CFC4BE"}
                        />
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.ratingPickerFooter}>
                  <Text style={styles.ratingPickerText}>
                    {rating === 0
                      ? "Sem avaliação"
                      : `${rating} ${rating === 1 ? "estrela" : "estrelas"}`}
                  </Text>
                  {rating > 0 && (
                    <Pressable onPress={() => setRating(0)}>
                      <Text style={[styles.ratingClearText, { color: theme.accent }]}>
                        Limpar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.title }]}>
                Foto da lembrança
              </Text>
              {photoUri ? (
                <View
                  style={[
                    styles.photoPreviewCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Image
                    source={{ uri: photoUri }}
                    resizeMode="cover"
                    style={styles.photoPreview}
                  />
                  <View style={styles.photoPreviewActions}>
                    <Pressable
                      onPress={chooseMemoryPhoto}
                      style={[
                        styles.photoActionButton,
                        { backgroundColor: theme.accentSoft },
                      ]}
                    >
                      <Ionicons
                        name="images-outline"
                        size={17}
                        color={theme.accent}
                      />
                      <Text style={[styles.photoActionText, { color: theme.accent }]}>
                        Trocar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPhotoUri(undefined)}
                      style={styles.photoRemoveButton}
                    >
                      <Ionicons name="trash-outline" size={17} color="#A96363" />
                      <Text style={styles.photoRemoveText}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={chooseMemoryPhoto}
                  style={[
                    styles.addPhotoButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.addPhotoIcon,
                      { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={23}
                      color={theme.accent}
                    />
                  </View>
                  <View style={styles.addPhotoText}>
                    <Text style={[styles.addPhotoTitle, { color: theme.title }]}>
                      Adicionar uma imagem
                    </Text>
                    <Text style={styles.addPhotoHint}>
                      Opcional. O arquivo fica localmente por enquanto.
                    </Text>
                  </View>
                  <Ionicons name="add" size={21} color={theme.accent} />
                </Pressable>
              )}
            </>
          )}

          <Pressable onPress={save} style={styles.saveButton}>
            <LinearGradient
              colors={theme.heroColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveButtonText}>
                {isPlan
                  ? "Adicionar aos planos"
                  : isEditingMemory
                    ? "Salvar alterações"
                    : "Guardar lembrança"}
              </Text>
              <Ionicons
                name={
                  isPlan ? "calendar" : isEditingMemory ? "checkmark" : "heart"
                }
                size={17}
                color={palette.paper}
              />
            </LinearGradient>
          </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
