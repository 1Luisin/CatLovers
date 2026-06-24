import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import {
  expoBuildsUrl,
  mobileDownloads,
  type MobileDownload,
} from "../../../data/mobileDownloads";
import { AppHeader } from "../../../components/common/AppComponents.web";
import { palette } from "../../../theme/themes";
import type { ThemePalette as AppTheme } from "../../../types";
import styles from "../../../platforms/web/styles";

const openUrl = (url: string) => {
  void Linking.openURL(url);
};

function PlatformCard({
  icon,
  title,
  description,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  theme: AppTheme;
}) {
  return (
    <View
      style={[
        styles.downloadPlatformCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View
        style={[
          styles.downloadPlatformIcon,
          { backgroundColor: theme.accentSoft },
        ]}
      >
        <Ionicons name={icon} size={23} color={theme.accent} />
      </View>
      <Text style={[styles.downloadPlatformTitle, { color: theme.title }]}>
        {title}
      </Text>
      <Text style={[styles.downloadPlatformText, { color: theme.muted }]}>
        {description}
      </Text>
    </View>
  );
}

function DownloadCard({
  item,
  theme,
}: {
  item: MobileDownload;
  theme: AppTheme;
}) {
  const available = item.status === "Disponível";

  return (
    <View
      style={[
        styles.downloadVersionCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.downloadVersionTop}>
        <View
          style={[
            styles.downloadVersionIcon,
            { backgroundColor: theme.accentSoft },
          ]}
        >
          <Ionicons
            name={item.platform === "Android" ? "logo-android" : "logo-apple"}
            size={19}
            color={theme.accent}
          />
        </View>
        <View style={styles.downloadVersionInfo}>
          <Text style={[styles.downloadVersionTitle, { color: theme.title }]}>
            {item.platform} {item.version}
          </Text>
          <Text style={[styles.downloadVersionMeta, { color: theme.muted }]}>
            {item.buildType} · {item.date}
          </Text>
        </View>
        <View
          style={[
            styles.downloadStatusBadge,
            { backgroundColor: available ? theme.accentSoft : "#F4ECE8" },
          ]}
        >
          <Text
            style={[
              styles.downloadStatusText,
              { color: available ? theme.accent : theme.muted },
            ]}
          >
            {available ? "Disponível" : "Em preparo"}
          </Text>
        </View>
      </View>
      <Text style={[styles.downloadVersionNotes, { color: theme.muted }]}>
        {item.notes}
      </Text>
      <Pressable
        disabled={!available}
        onPress={() => openUrl(item.url)}
        style={({ pressed }) => [
          styles.downloadActionButton,
          { backgroundColor: theme.accent },
          !available && styles.downloadActionDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="download-outline" size={16} color={palette.paper} />
        <Text style={styles.downloadActionText}>Baixar versão</Text>
      </Pressable>
    </View>
  );
}

export function MobileDownloadsScreen({ theme }: { theme: AppTheme }) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader
        eyebrow="APP NO CELULAR"
        title="Download para celular"
        theme={theme}
      />

      <LinearGradient
        colors={theme.heroColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.downloadHero, { shadowColor: theme.accent }]}
      >
        <View style={styles.heroDecorationOne} />
        <View style={styles.heroDecorationTwo} />
        <View style={styles.downloadHeroIcon}>
          <Ionicons
            name="phone-portrait-outline"
            size={28}
            color={palette.paper}
          />
        </View>
        <Text style={styles.downloadHeroKicker}>VERSÕES MOBILE</Text>
        <Text style={styles.downloadHeroTitle}>Instale o CatLovers no celular</Text>
        <Text style={styles.downloadHeroText}>
          Os builds oficiais ficam no painel da Expo. A lista abaixo mostra os
          links cadastrados no projeto para download rápido.
        </Text>
        <Pressable
          onPress={() => openUrl(expoBuildsUrl)}
          style={({ pressed }) => [
            styles.downloadHeroButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="open-outline" size={16} color={theme.accent} />
          <Text style={[styles.downloadHeroButtonText, { color: theme.accent }]}>
            Abrir builds da Expo
          </Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.downloadPlatformGrid}>
        <PlatformCard
          icon="logo-android"
          title="Android"
          description="Use os APKs dos perfis development ou preview gerados pelo EAS."
          theme={theme}
        />
        <PlatformCard
          icon="logo-apple"
          title="iOS"
          description="Quando houver build interno para iPhone, o link aparece nesta aba."
          theme={theme}
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>
            HISTÓRICO
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.title }]}>
            Versões disponíveis
          </Text>
        </View>
        <Text style={[styles.resultCount, { color: theme.muted }]}>
          {mobileDownloads.length} builds
        </Text>
      </View>

      {mobileDownloads.length > 0 ? (
        mobileDownloads.map((item) => (
          <DownloadCard key={item.id} item={item} theme={theme} />
        ))
      ) : (
        <View
          style={[
            styles.downloadEmptyCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.downloadEmptyIcon,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={23}
              color={theme.accent}
            />
          </View>
          <Text style={[styles.downloadEmptyTitle, { color: theme.title }]}>
            Lista oficial protegida por login
          </Text>
          <Text style={[styles.downloadEmptyText, { color: theme.muted }]}>
            A página de builds da Expo exige conta autenticada, por isso o site
            não consegue sincronizar esses dados sozinho sem expor credenciais.
            Abra o painel da Expo ou cadastre links públicos em
            src/data/mobileDownloads.ts.
          </Text>
          <Pressable
            onPress={() => openUrl(expoBuildsUrl)}
            style={({ pressed }) => [
              styles.downloadOutlineButton,
              { borderColor: `${theme.accent}66` },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="open-outline" size={16} color={theme.accent} />
            <Text
              style={[
                styles.downloadOutlineButtonText,
                { color: theme.accent },
              ]}
            >
              Ver builds no painel da Expo
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
