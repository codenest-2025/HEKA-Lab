import React, { useState } from "react";
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity } from "react-native";
import { Text, Menu } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

/**
 * Global AppHeader — used on all non-dashboard screens.
 * Renders a teal gradient header with the page title and a logout button.
 *
 * Props:
 *   title (string) — the page title to display
 */
export default function AppHeader({ title }) {
  const { logout, user, selectedCenter, setSelectedCenter, centers, fetchCenters, refreshProfile, triggerRefresh } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleRefresh = async () => {
    try {
      if (isAdmin) {
        await fetchCenters();
      }
      await refreshProfile();
      triggerRefresh();
    } catch (e) {
      console.warn("AppHeader refresh failed:", e);
    }
  };

  return (
    <LinearGradient
      colors={["#0a3c30", "#0e6655", "#117a65"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.leftContainer}>
        <Text style={styles.brandTitle}>Rudraksh Foundation</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {isAdmin && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity style={styles.centerSelect} onPress={() => setMenuVisible(true)}>
                <Icon name="hospital-building" size={12} color="#a3e4d7" />
                <Text style={styles.centerSelectText} numberOfLines={1}>
                  {selectedCenter ? selectedCenter.name : "All Centers"}
                </Text>
                <Icon name="chevron-down" size={12} color="#a3e4d7" />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setSelectedCenter(null);
                setMenuVisible(false);
              }}
              title="All Centers"
            />
            {centers.map((c) => (
              <Menu.Item
                key={c._id}
                onPress={() => {
                  setSelectedCenter(c);
                  setMenuVisible(false);
                }}
                title={c.name}
              />
            ))}
          </Menu>
        )}
      </View>
      <View style={styles.rightContainer}>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Icon name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Icon name="logout" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const STATUSBAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 44;

const styles = StyleSheet.create({
  header: {
    paddingTop: STATUSBAR_HEIGHT + 8,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  brandTitle: {
    color: "#a3e4d7",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: -2,
  },
  leftContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    marginRight: 12,
  },
  centerSelect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 150,
  },
  centerSelectText: {
    color: "#a3e4d7",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  logoutLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
