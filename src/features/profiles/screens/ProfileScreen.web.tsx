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
import { getDaysTogether } from "../../../data/constants";
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
import { AppHeader, MemoryCard, ProfileAvatar } from "../../../components/common/AppComponents.web";
import styles from "../../../platforms/web/styles";

export function SettingSwitch({
  icon,
  label,
  description,
  value,
  accent,
  titleColor,
  descriptionColor,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  accent: string;
  titleColor: string;
  descriptionColor: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: `${accent}16` }]}>
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: titleColor }]}>{label}</Text>
        <Text style={[styles.settingDescription, { color: descriptionColor }]}>
          {description}
        </Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        onPress={() => onChange(!value)}
        style={[
          styles.settingToggle,
          { backgroundColor: value ? `${accent}75` : "#DDD4D8" },
        ]}
      >
        <View
          style={[
            styles.settingToggleThumb,
            {
              backgroundColor: value ? accent : "#F7F4F5",
              transform: [{ translateX: value ? 18 : 0 }],
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

export function ExpandableSetting({
  icon,
  title,
  description,
  accent,
  theme,
  maxHeight,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: string;
  theme: AppTheme;
  maxHeight: number;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [renderContent, setRenderContent] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 260 : 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !expanded) setRenderContent(false);
    });
  }, [expanded, progress]);

  const toggle = () => {
    if (!expanded) setRenderContent(true);
    setExpanded((current) => !current);
  };

  const panelHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });
  const panelOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  const chevronRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <>
      <Pressable
        onPress={toggle}
        style={styles.actionSettingRow}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[styles.settingIcon, { backgroundColor: `${accent}16` }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: theme.title }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: theme.muted }]}>
            {description}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </Animated.View>
      </Pressable>
      {renderContent && (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          accessibilityElementsHidden={!expanded}
          importantForAccessibility={
            expanded ? "auto" : "no-hide-descendants"
          }
          style={[
            styles.disclosurePanel,
            {
              maxHeight: panelHeight,
              opacity: progress,
              transform: [{ translateY: panelOffset }],
            },
          ]}
        >
          <View
            style={[
              styles.disclosureBox,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            {children}
          </View>
        </Animated.View>
      )}
    </>
  );
}

export function ProfileScreen({
  profile,
  items,
  theme,
  onEdit,
  onUpdate,
  onThemeChange,
  onSwitchProfile,
}: {
  profile: Profile;
  items: CoupleItem[];
  theme: AppTheme;
  onEdit: () => void;
  onUpdate: (profile: Profile) => void;
  onThemeChange: (theme: ThemeName) => void;
  onSwitchProfile: () => void;
}) {
  const completed = items.filter((item) => item.done).length;
  const daysTogether = getDaysTogether();
  const accent = theme.accent;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: accent }]}>MINHA CONTA</Text>
          <Text style={[styles.pageTitle, { color: theme.title }]}>Perfil</Text>
        </View>
        <Pressable
          onPress={onEdit}
          style={[
            styles.editProfileButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="pencil-outline" size={19} color={accent} />
        </Pressable>
      </View>

      <View
        style={[
          styles.profileHero,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View>
          <ProfileAvatar profile={profile} size={104} border />
          <Pressable
            onPress={onEdit}
            style={[styles.photoBadge, { backgroundColor: accent }]}
          >
            <Ionicons name="camera" size={16} color={palette.paper} />
          </Pressable>
        </View>
        <Text style={[styles.profileName, { color: theme.title }]}>
          {profile.name}
        </Text>
        <Text style={[styles.profileBirth, { color: theme.muted }]}>
          <Ionicons name="gift-outline" size={12} color={theme.muted} />{" "}
          {profile.birthDate}
        </Text>
        <Text style={[styles.profileBio, { color: theme.muted }]}>
          {profile.bio}
        </Text>
        <Pressable
          onPress={onEdit}
          style={[styles.outlineProfileButton, { borderColor: `${accent}55` }]}
        >
          <Text style={[styles.outlineProfileButtonText, { color: accent }]}>
            Editar perfil
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.profileStats,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            {completed}
          </Text>
          <Text style={[styles.profileStatLabel, { color: theme.muted }]}>
            memórias
          </Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            {items.filter((item) => !item.done).length}
          </Text>
          <Text style={[styles.profileStatLabel, { color: theme.muted }]}>
            planos
          </Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatValue, { color: theme.title }]}>
            {daysTogether}
          </Text>
          <Text style={[styles.profileStatLabel, { color: theme.muted }]}>
            {daysTogether === 1 ? "dia junto" : "dias juntos"}
          </Text>
        </View>
      </View>

      <Text style={[styles.settingsSectionTitle, { color: theme.title }]}>
        Aparência
      </Text>
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.themeHint, { color: theme.muted }]}>
          Tema do aplicativo
        </Text>
        <View style={styles.themeOptions}>
          {(Object.keys(themes) as ThemeName[]).map((themeName) => {
            const optionTheme = themes[themeName];
            const active = profile.theme === themeName;
            return (
              <Pressable
                key={themeName}
                onPress={() => onThemeChange(themeName)}
                style={styles.themeOption}
              >
                <View
                  style={[
                    styles.themeSwatch,
                    {
                      backgroundColor: optionTheme.character
                        ? optionTheme.accent
                        : optionTheme.surface,
                      borderColor: active
                        ? optionTheme.accent
                        : optionTheme.border,
                    },
                    active && styles.themeSwatchActive,
                  ]}
                >
                  {optionTheme.character ? (
                    <Image
                      source={characterImages[optionTheme.character]}
                      resizeMode="contain"
                      style={styles.themeSwatchCharacter}
                    />
                  ) : (
                    <Ionicons
                      name={optionTheme.icon ?? "color-palette-outline"}
                      size={22}
                      color={optionTheme.accent}
                    />
                  )}
                  {active && (
                    <View style={styles.themeSwatchCheck}>
                      <Ionicons
                        name="checkmark"
                        size={11}
                        color={palette.paper}
                      />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.themeName,
                    { color: theme.muted },
                    active && {
                      color: optionTheme.accent,
                      fontWeight: "800",
                    },
                  ]}
                >
                  {optionTheme.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={[styles.settingsSectionTitle, { color: theme.title }]}>
        Preferências
      </Text>
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <SettingSwitch
          icon="notifications-outline"
          label="Lembretes do casal"
          description="Planos próximos e datas especiais"
          value={profile.notifications}
          accent={accent}
          titleColor={theme.title}
          descriptionColor={theme.muted}
          onChange={(notifications) => onUpdate({ ...profile, notifications })}
        />
        <View
          style={[styles.settingDivider, { backgroundColor: theme.border }]}
        />
        <SettingSwitch
          icon="chatbubbles-outline"
          label="Pergunta da semana"
          description="Uma pergunta nova para responder juntos"
          value={profile.weeklyQuestion}
          accent={accent}
          titleColor={theme.title}
          descriptionColor={theme.muted}
          onChange={(weeklyQuestion) => onUpdate({ ...profile, weeklyQuestion })}
        />
      </View>

      <Text style={[styles.settingsSectionTitle, { color: theme.title }]}>
        CatLovers
      </Text>
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ExpandableSetting
          icon="heart-circle-outline"
          title="Sobre o aplicativo"
          description="Versão 1.1.0"
          accent={accent}
          theme={theme}
          maxHeight={180}
        >
          <Text style={[styles.aboutText, { color: theme.muted }]}>
            CatLovers é o nosso cantinho para guardar histórias, escolher o
            próximo evento e transformar planos simples em memória.
          </Text>
          <Text style={[styles.aboutSignature, { color: accent }]}>
            Feito com carinho para nós dois.
          </Text>
        </ExpandableSetting>
        <View
          style={[styles.settingDivider, { backgroundColor: theme.border }]}
        />
        <ExpandableSetting
          icon="document-text-outline"
          title="Privacidade e dados"
          description="Como suas informações serão tratadas"
          accent={accent}
          theme={theme}
          maxHeight={620}
        >
          <Text style={[styles.privacyIntro, { color: theme.muted }]}>
            Hoje os registros ficam no armazenamento local. Quando a
            sincronização for ativada, os dados serão enviados pela API e
            armazenados no banco do CatLovers.
          </Text>
          {[
            {
              title: "Dados tratados",
              text: "Perfil, preferências, lembranças, planos, datas, avaliações, metas e imagens adicionadas.",
            },
            {
              title: "Finalidade",
              text: "Manter a conta, sincronizar o casal entre dispositivos e disponibilizar as funções do aplicativo.",
            },
            {
              title: "Compartilhamento",
              text: "Os dados não serão vendidos. O acesso será limitado à infraestrutura necessária para operar a API, o banco e o armazenamento.",
            },
            {
              title: "Seus direitos",
              text: "Será possível solicitar confirmação, acesso, correção, portabilidade e exclusão, conforme a integração da conta for implementada.",
            },
            {
              title: "Segurança e retenção",
              text: "A transmissão deverá usar conexão segura, acesso autenticado e retenção somente pelo período necessário à prestação do serviço.",
            },
          ].map((section) => (
            <View key={section.title} style={styles.privacySection}>
              <Text style={[styles.privacyTitle, { color: theme.title }]}>
                {section.title}
              </Text>
              <Text style={[styles.privacyText, { color: theme.muted }]}>
                {section.text}
              </Text>
            </View>
          ))}
          <Text style={[styles.privacyDocumentHint, { color: accent }]}>
            Consulte também PRIVACIDADE_E_DADOS.md no projeto.
          </Text>
        </ExpandableSetting>
      </View>

      <Pressable
        onPress={onSwitchProfile}
        style={[styles.switchProfileButton, { borderColor: `${accent}55` }]}
      >
        <Ionicons name="swap-horizontal-outline" size={19} color={accent} />
        <Text style={[styles.switchProfileText, { color: accent }]}>
          Trocar de perfil
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export function EditProfileModal({
  visible,
  profile,
  accent,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: Profile;
  accent: string;
  onClose: () => void;
  onSave: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    if (visible) setDraft(profile);
  }, [profile, visible]);

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso às fotos para escolher uma imagem de perfil.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setDraft((current) => ({
        ...current,
        photoUri: result.assets[0].uri,
      }));
    }
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.editModalPage}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.editModalPage}
        >
          <View style={styles.fullModalHeader}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={palette.ink} />
            </Pressable>
            <Text style={styles.fullModalTitle}>Editar perfil</Text>
            <Pressable
              onPress={() => {
                if (!draft.name.trim()) {
                  Alert.alert("Nome obrigatório", "Informe o nome do perfil.");
                  return;
                }
                onSave({ ...draft, name: draft.name.trim() });
              }}
            >
              <Text style={[styles.fullModalSave, { color: accent }]}>Salvar</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.editProfileContent}>
            <Pressable onPress={choosePhoto} style={styles.editPhotoArea}>
              <ProfileAvatar profile={draft} size={112} border />
              <View style={[styles.editPhotoBadge, { backgroundColor: accent }]}>
                <Ionicons name="camera" size={18} color={palette.paper} />
              </View>
              <Text style={[styles.changePhotoText, { color: accent }]}>
                Alterar foto
              </Text>
            </Pressable>

            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#AFA4AA"
            />
            <Text style={styles.inputLabel}>Data de nascimento</Text>
            <TextInput
              value={draft.birthDate}
              onChangeText={(birthDate) => setDraft({ ...draft, birthDate })}
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#AFA4AA"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              value={draft.bio}
              onChangeText={(bio) => setDraft({ ...draft, bio })}
              style={[styles.input, styles.profileBioInput]}
              placeholder="Conte um pouco sobre você"
              placeholderTextColor="#AFA4AA"
              multiline
              maxLength={180}
            />
            <Text style={styles.characterCount}>{draft.bio.length}/180</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
