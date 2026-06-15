import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { PLANS_MONTH_KEY, PLANS_MONTH_LABEL } from "../../data/constants";
import { tabs } from "../../data/uiConstants";
import { useMonthlyGoals } from "../../features/goals/hooks/useMonthlyGoals";
import { MonthlyGoalModal } from "../../features/goals/components/MonthlyGoalModal.web";
import { HomeScreen } from "../../features/home/screens/HomeScreen.web";
import { AddModal } from "../../components/forms/AddModal.web";
import { CollectionScreen } from "../../features/memories/screens/CollectionScreen.web";
import { useCoupleItems } from "../../features/memories/hooks/useCoupleItems";
import { PlansScreen } from "../../features/plans/screens/PlansScreen.web";
import {
  EditProfileModal,
  ProfileScreen,
} from "../../features/profiles/screens/ProfileScreen.web";
import { useProfiles } from "../../features/profiles/hooks/useProfiles";
import {
  ProfileAvatar,
  ProfileGate,
  ThemeDecorations,
} from "../../components/common/AppComponents.web";
import { palette, themes } from "../../theme/themes";
import type {
  AddMode,
  CoupleItem,
  MonthlyGoal,
  TabName as Tab,
  ThemeName,
} from "../../types";
import { supportsNativeDriver } from "../../utils/platform";
import styles from "./styles";

export default function App() {
  const { width: viewportWidth } = useWindowDimensions();
  const desktopLayout = viewportWidth >= 900;
  const [tab, setTab] = useState<Tab>("inicio");
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const themeOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateX = useRef(new Animated.Value(0)).current;
  const previousTab = useRef<Tab>("inicio");
  const transitionDirection = useRef(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("memory");
  const [editingMemory, setEditingMemory] = useState<CoupleItem>();
  const [monthlyGoalVisible, setMonthlyGoalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const showSyncError = useCallback(
    () =>
      Alert.alert(
        "Sem conexão com a API",
        "A alteração local foi mantida e pode ser refeita quando o servidor estiver disponível.",
      ),
    [],
  );
  const showRefreshError = useCallback(
    () =>
      Alert.alert(
        "Não foi possível atualizar",
        "Confira sua conexão e tente novamente.",
      ),
    [],
  );
  const {
    profiles,
    activeProfile,
    activeProfileId,
    profilesLoaded,
    selectProfile,
    clearActiveProfile,
    refreshProfiles,
    saveProfile,
  } = useProfiles(showSyncError);
  const { items, itemsLoaded, refreshItems, togglePlan, saveItem } =
    useCoupleItems(showSyncError);
  const { monthlyGoals, goalsLoaded, refreshMonthlyGoals, saveGoal } =
    useMonthlyGoals(showSyncError);
  const loaded = profilesLoaded && itemsLoaded && goalsLoaded;
  const activeTheme = themes[activeProfile?.theme ?? "Light"];
  const openAddModal = (mode: AddMode) => {
    setEditingMemory(undefined);
    setAddMode(mode);
    setModalVisible(true);
  };
  const openMemoryEditor = (item: CoupleItem) => {
    setEditingMemory(item);
    setAddMode("memory");
    setModalVisible(true);
  };
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        refreshProfiles(),
        refreshItems(),
        refreshMonthlyGoals(),
      ]);
    } catch {
      showRefreshError();
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshItems,
    refreshMonthlyGoals,
    refreshProfiles,
    refreshing,
    showRefreshError,
  ]);

  const handleThemeChange = (themeName: ThemeName) => {
    if (!activeProfile || activeProfile.theme === themeName) return;

    themeOpacity.stopAnimation();
    Animated.timing(themeOpacity, {
      toValue: 0,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: supportsNativeDriver,
    }).start(({ finished }) => {
      if (!finished) return;
      void saveProfile({ ...activeProfile, theme: themeName }, true);
      setTimeout(() => {
        Animated.timing(themeOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: supportsNativeDriver,
        }).start();
      }, 30);
    });
  };
  const handleItemSave = (item: CoupleItem) => {
    const editing = Boolean(editingMemory);
    setModalVisible(false);
    setEditingMemory(undefined);
    void saveItem(item, editing, activeProfileId ?? undefined);
  };
  const handleGoalSave = (goal: MonthlyGoal) => {
    setMonthlyGoalVisible(false);
    void saveGoal(goal);
  };
  const navigateToTab = useCallback(
    (nextTab: Tab) => {
      if (nextTab === tab) return;
      const currentIndex = tabs.findIndex((item) => item.key === tab);
      const nextIndex = tabs.findIndex((item) => item.key === nextTab);
      transitionDirection.current = nextIndex > currentIndex ? 1 : -1;
      setTab(nextTab);
    },
    [tab],
  );

  useEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    screenOpacity.stopAnimation();
    screenTranslateX.stopAnimation();
    screenOpacity.setValue(0);
    screenTranslateX.setValue(18 * transitionDirection.current);
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, screenTranslateX, tab]);

  const screen = useMemo(() => {
    if (!activeProfile) return null;
    if (tab === "colecao")
      return (
        <CollectionScreen
          items={items}
          theme={activeTheme}
          onAdd={() => openAddModal("memory")}
          onEdit={openMemoryEditor}
        />
      );
    if (tab === "planos")
      return (
        <PlansScreen
          items={items}
          monthlyGoal={monthlyGoals[PLANS_MONTH_KEY]}
          theme={activeTheme}
          onConfigureGoal={() => setMonthlyGoalVisible(true)}
          onAddIdea={() => openAddModal("plan")}
          onToggle={togglePlan}
        />
      );
    if (tab === "perfil")
      return (
        <ProfileScreen
          profile={activeProfile}
          items={items}
          theme={activeTheme}
          onEdit={() => setEditProfileVisible(true)}
          onUpdate={(updated) => void saveProfile(updated, true)}
          onThemeChange={handleThemeChange}
          onSwitchProfile={() => {
            setTab("inicio");
            clearActiveProfile();
          }}
        />
      );
    return (
      <HomeScreen
        items={items}
        profile={activeProfile}
        profiles={profiles}
        theme={activeTheme}
        onViewAll={() => navigateToTab("colecao")}
      />
    );
  }, [activeProfile, activeTheme, items, monthlyGoals, navigateToTab, profiles, tab]);

  if (!loaded) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.gateLogo}>
          <Ionicons name="heart" size={25} color={palette.paper} />
        </View>
        <Text style={styles.loadingText}>CatLovers</Text>
      </View>
    );
  }

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.gateSafeArea}>
        <StatusBar style="dark" />
        <ProfileGate profiles={profiles} onSelect={selectProfile} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: activeTheme.background }]}
    >
      <StatusBar style={activeTheme.isDark ? "light" : "dark"} />
      <Animated.View
        testID="app-theme-transition"
        style={[
          styles.appShell,
          {
            backgroundColor: activeTheme.background,
            flexDirection: desktopLayout ? "row" : "column",
            opacity: themeOpacity,
          },
        ]}
      >
        {desktopLayout && (
          <View
            style={[
              styles.desktopSidebar,
              {
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              },
            ]}
          >
            <View style={styles.desktopBrand}>
              <View
                style={[
                  styles.desktopBrandIcon,
                  { backgroundColor: activeTheme.accent },
                ]}
              >
                <Ionicons name="heart" size={22} color={palette.paper} />
              </View>
              <View>
                <Text
                  style={[styles.desktopBrandName, { color: activeTheme.title }]}
                >
                  CatLovers
                </Text>
                <Text
                  style={[
                    styles.desktopBrandCaption,
                    { color: activeTheme.accent },
                  ]}
                >
                  NOSSO CANTINHO
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.desktopProfile,
                {
                  backgroundColor: activeTheme.accentSoft,
                  borderColor: activeTheme.border,
                },
              ]}
            >
              <ProfileAvatar profile={activeProfile} size={48} />
              <View style={styles.desktopProfileText}>
                <Text
                  style={[
                    styles.desktopProfileName,
                    { color: activeTheme.title },
                  ]}
                >
                  {activeProfile.name}
                </Text>
                <Text
                  style={[
                    styles.desktopProfileCaption,
                    { color: activeTheme.muted },
                  ]}
                >
                  Perfil ativo
                </Text>
              </View>
            </View>

            <Pressable
              testID="desktop-refresh-button"
              accessibilityRole="button"
              accessibilityLabel="Atualizar dados do aplicativo"
              disabled={refreshing}
              onPress={() => void handleRefresh()}
              style={({ pressed }) => [
                styles.desktopRefreshButton,
                {
                  backgroundColor: activeTheme.surface,
                  borderColor: activeTheme.border,
                },
                refreshing && styles.desktopRefreshButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={activeTheme.accent}
              />
              <Text
                style={[
                  styles.desktopRefreshButtonText,
                  { color: activeTheme.title },
                ]}
              >
                {refreshing ? "Atualizando..." : "Atualizar dados"}
              </Text>
            </Pressable>

            <View style={styles.desktopNavigation}>
              {tabs.map((item) => {
                const active = tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => navigateToTab(item.key)}
                    style={({ pressed }) => [
                      styles.desktopNavItem,
                      active && {
                        backgroundColor: activeTheme.accentSoft,
                        borderColor: activeTheme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.desktopNavIcon,
                        active && { backgroundColor: activeTheme.accent },
                      ]}
                    >
                      <Ionicons
                        name={active ? item.activeIcon : item.icon}
                        size={20}
                        color={active ? palette.paper : activeTheme.muted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.desktopNavLabel,
                        {
                          color: active
                            ? activeTheme.title
                            : activeTheme.muted,
                        },
                        active && styles.desktopNavLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.desktopSidebarFooter}>
              <Text
                style={[
                  styles.desktopSidebarFooterTitle,
                  { color: activeTheme.title },
                ]}
              >
                CatLovers Web
              </Text>
              <Text
                style={[
                  styles.desktopSidebarFooterText,
                  { color: activeTheme.muted },
                ]}
              >
                Versão 1.1.0
              </Text>
            </View>
          </View>
        )}

        <View style={styles.desktopMain}>
          <ThemeDecorations theme={activeTheme} />
          <Animated.View
            style={[
              styles.screenLayer,
              desktopLayout && styles.desktopScreenLayer,
              {
                opacity: screenOpacity,
                transform: [{ translateX: screenTranslateX }],
              },
            ]}
          >
            {screen}
          </Animated.View>
        </View>

        {!desktopLayout && (
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              },
            ]}
          >
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => navigateToTab(item.key)}
                  style={styles.tabButton}
                >
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={22}
                    color={active ? activeTheme.accent : "#9C9298"}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      active && { color: activeTheme.accent },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>
      <AddModal
        visible={modalVisible}
        mode={addMode}
        editingItem={editingMemory}
        theme={activeTheme}
        onClose={() => {
          setModalVisible(false);
          setEditingMemory(undefined);
        }}
        onSave={(item) => void handleItemSave(item)}
      />
      <MonthlyGoalModal
        visible={monthlyGoalVisible}
        monthKey={PLANS_MONTH_KEY}
        monthLabel={PLANS_MONTH_LABEL}
        goal={monthlyGoals[PLANS_MONTH_KEY]}
        theme={activeTheme}
        onClose={() => setMonthlyGoalVisible(false)}
        onSave={(goal) => void handleGoalSave(goal)}
      />
      <EditProfileModal
        visible={editProfileVisible}
        profile={activeProfile}
        accent={activeTheme.accent}
        onClose={() => setEditProfileVisible(false)}
        onSave={(updated) => {
          void saveProfile(updated);
          setEditProfileVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
