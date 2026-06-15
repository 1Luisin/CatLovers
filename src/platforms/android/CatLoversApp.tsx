import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
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
import { MonthlyGoalModal } from "../../features/goals/components/MonthlyGoalModal.android";
import { HomeScreen } from "../../features/home/screens/HomeScreen.android";
import { AddModal } from "../../components/forms/AddModal.android";
import { CollectionScreen } from "../../features/memories/screens/CollectionScreen.android";
import { useCoupleItems } from "../../features/memories/hooks/useCoupleItems";
import { useNativeNotifications } from "../../features/notifications/hooks/useNativeNotifications";
import { PlansScreen } from "../../features/plans/screens/PlansScreen.android";
import {
  EditProfileModal,
  ProfileScreen,
} from "../../features/profiles/screens/ProfileScreen.android";
import { useProfiles } from "../../features/profiles/hooks/useProfiles";
import {
  ProfileAvatar,
  ProfileGate,
  ThemeDecorations,
} from "../../components/common/AppComponents.android";
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

async function hideSystemNavigationBar() {
  try {
    await NavigationBar.setVisibilityAsync("hidden");
  } catch {
    // The native API is unavailable while this screen is rendered in a non-Android preview.
  }
}

export default function App() {
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

  useEffect(() => {
    void hideSystemNavigationBar();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void hideSystemNavigationBar();
    });

    return () => subscription.remove();
  }, []);

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
  const notificationState = useNativeNotifications(activeProfile, saveProfile);
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
    void saveGoal(goal, activeProfileId ?? undefined);
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
          notificationsEnabled={notificationState.enabled}
          onNotificationChange={notificationState.setEnabled}
          notificationMessage={notificationState.message}
          notificationActionLabel={notificationState.actionLabel}
          notificationBusy={notificationState.busy}
          onNotificationPermissionAction={
            notificationState.handlePermissionAction
          }
          onThemeChange={handleThemeChange}
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    );
  }, [
    activeProfile,
    activeTheme,
    handleRefresh,
    items,
    monthlyGoals,
    navigateToTab,
    notificationState,
    profiles,
    refreshing,
    tab,
  ]);

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
            opacity: themeOpacity,
          },
        ]}
      >
        <ThemeDecorations theme={activeTheme} />
        <Animated.View
          style={[
            styles.screenLayer,
            {
              opacity: screenOpacity,
              transform: [{ translateX: screenTranslateX }],
            },
          ]}
        >
          {screen}
        </Animated.View>
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
