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
import styles from "../../platforms/ios/styles";

export function ThemeDecorations({ theme }: { theme: AppTheme }) {
  if (!theme.character) return null;

  const image = characterImages[theme.character];
  const isCinnamoroll = theme.character === "Cinnamoroll";

  return (
    <View style={styles.themeDecorations}>
      <View
        style={[
          styles.themeBubble,
          styles.themeBubbleTop,
          { backgroundColor: theme.accentSoft },
        ]}
      />
      <View
        style={[
          styles.themeBubble,
          styles.themeBubbleBottom,
          { backgroundColor: theme.accentSoft },
        ]}
      />
      <Ionicons
        name={isCinnamoroll ? "cloud-outline" : "star-outline"}
        size={25}
        color={`${theme.accent}58`}
        style={styles.themeCornerIcon}
      />
      <Image
        source={image}
        resizeMode="contain"
        style={[
          styles.themeCharacterTop,
          isCinnamoroll && styles.cinnamorollCharacterTop,
        ]}
      />
      <Image
        source={image}
        resizeMode="contain"
        style={[
          styles.themeCharacterBottom,
          isCinnamoroll && styles.cinnamorollCharacterBottom,
        ]}
      />
    </View>
  );
}

export function ProfileAvatar({
  profile,
  size = 72,
  border = false,
  borderWidth = 4,
  initialLength = 1,
}: {
  profile: Profile;
  size?: number;
  border?: boolean;
  borderWidth?: number;
  initialLength?: number;
}) {
  return (
    <View
      style={[
        styles.profileAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: profile.color,
          borderWidth: border ? borderWidth : 0,
        },
      ]}
    >
      {profile.photoUri ? (
        <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
      ) : (
        <Text style={[styles.profileInitial, { fontSize: size * 0.34 }]}>
          {profile.name.trim().slice(0, initialLength).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export function ProfileGate({
  profiles,
  onSelect,
}: {
  profiles: Profile[];
  onSelect: (id: Profile["id"]) => void;
}) {
  return (
    <LinearGradient
      colors={["#FCF8F4", "#F3E8F0"]}
      style={styles.gateContainer}
    >
      <View style={styles.gateBrand}>
        <View style={styles.gateLogo}>
          <Ionicons name="heart" size={25} color={palette.paper} />
        </View>
        <Text style={styles.gateBrandName}>CatLovers</Text>
        <Text style={styles.gateBrandTag}>NOSSO CANTINHO</Text>
      </View>

      <View style={styles.gateContent}>
        <Text style={styles.gateTitle}>Quem está entrando?</Text>
        <Text style={styles.gateSubtitle}>
          Escolha seu perfil. Aqui não tem senha, só o nosso espaço compartilhado.
        </Text>
        <View style={styles.profileChoices}>
          {profiles.map((profile) => (
            <Pressable
              key={profile.id}
              onPress={() => onSelect(profile.id)}
              style={({ pressed }) => [
                styles.profileChoice,
                pressed && styles.pressed,
              ]}
            >
              <ProfileAvatar profile={profile} size={92} border />
              <Text style={styles.profileChoiceName}>{profile.name}</Text>
              <View style={styles.enterProfile}>
                <Text style={styles.enterProfileText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={14} color={palette.rose} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.gatePrivacy}>
        <Ionicons name="lock-closed-outline" size={14} color={palette.muted} />
        <Text style={styles.gatePrivacyText}>Perfis salvos somente neste aparelho</Text>
      </View>
    </LinearGradient>
  );
}

export function AppHeader({
  eyebrow,
  title,
  onAdd,
  addAccessibilityLabel,
  theme,
}: {
  eyebrow: string;
  title: string;
  onAdd?: () => void;
  addAccessibilityLabel?: string;
  theme: AppTheme;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>
        <Text style={[styles.pageTitle, { color: theme.title }]}>{title}</Text>
      </View>
      {onAdd && (
        <Pressable
          accessibilityLabel={addAccessibilityLabel}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.accent, shadowColor: theme.accent },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={25} color={palette.paper} />
        </Pressable>
      )}
    </View>
  );
}

export function CategoryPill({ category }: { category: Category }) {
  const meta = categoryMeta[category];
  return (
    <View style={[styles.categoryPill, { backgroundColor: `${meta.color}18` }]}>
      <Ionicons name={meta.icon} size={13} color={meta.color} />
      <Text style={[styles.categoryPillText, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

export function MemoryPhotoViewer({
  item,
  theme,
}: {
  item: CoupleItem;
  theme: AppTheme;
}) {
  const [visible, setVisible] = useState(false);

  if (!item.photoUri) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ampliar imagem de ${item.title}`}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.memoryPhotoButton,
          pressed && styles.pressed,
        ]}
      >
        <Image
          source={{ uri: item.photoUri }}
          resizeMode="cover"
          style={styles.memoryPhoto}
        />
        <View style={styles.memoryPhotoBadge}>
          <Ionicons name="expand-outline" size={13} color={palette.paper} />
          <Text style={styles.memoryPhotoBadgeText}>Ver imagem</Text>
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.photoViewerOverlay}>
          <Pressable
            accessibilityLabel="Fechar imagem ampliada"
            onPress={() => setVisible(false)}
            style={styles.photoViewerDismiss}
          />
          <View
            style={[
              styles.photoViewerCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.photoViewerHeader,
                { borderColor: theme.border },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.photoViewerTitle, { color: theme.title }]}
              >
                {item.title}
              </Text>
              <Pressable
                accessibilityLabel="Fechar imagem"
                onPress={() => setVisible(false)}
                style={[
                  styles.photoViewerClose,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Ionicons name="close" size={20} color={theme.accent} />
              </Pressable>
            </View>
            <Image
              source={{ uri: item.photoUri }}
              resizeMode="contain"
              style={[
                styles.photoViewerImage,
                { backgroundColor: theme.background },
              ]}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export function MemoryCard({
  item,
  theme,
  onEdit,
}: {
  item: CoupleItem;
  theme: AppTheme;
  onEdit?: (item: CoupleItem) => void;
}) {
  return (
    <View
      style={[
        styles.memoryCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.memoryStripe, { backgroundColor: item.color }]} />
      <View style={styles.memoryBody}>
        <View style={styles.memoryTop}>
          <CategoryPill category={item.category} />
          <View style={styles.memoryTopActions}>
            <Text style={[styles.dateText, { color: theme.muted }]}>
              {item.date}
            </Text>
            {onEdit && (
              <Pressable
                accessibilityLabel={`Editar ${item.title}`}
                onPress={() => onEdit(item)}
                style={({ pressed }) => [
                  styles.memoryEditButton,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="pencil-outline"
                  size={14}
                  color={theme.accent}
                />
              </Pressable>
            )}
          </View>
        </View>
        <Text style={[styles.memoryTitle, { color: theme.title }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.memoryNote, { color: theme.muted }]}
          numberOfLines={2}
        >
          {item.note}
        </Text>
        <MemoryPhotoViewer item={item} theme={theme} />
        <View style={styles.memoryFooter}>
          {item.rating ? (
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < item.rating! ? "star" : "star-outline"}
                  size={14}
                  color={palette.apricot}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.memorySavedText, { color: theme.muted }]}>
              Lembrança guardada
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
