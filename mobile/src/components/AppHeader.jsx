import React from "react";
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
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
  const { logout } = useAuth();

  return (
    <LinearGradient
      colors={["#0a3c30", "#0e6655", "#117a65"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Icon name="logout" size={20} color="#fff" />
      </TouchableOpacity>
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
    flex: 1,
    marginRight: 12,
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
});
