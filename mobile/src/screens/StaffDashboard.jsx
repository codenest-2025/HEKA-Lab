import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";

export default function StaffDashboard({ navigation }) {
  const { user, logout } = useAuth();

  const actions = [
    { label: "New Booking", sub: "Register patient & select tests", icon: "plus-circle-outline", color: "#0e6655", bg: "#e0f2f1", screen: "New Booking" },
    { label: "Booking History", sub: "View bookings at your center", icon: "history", color: "#1e88e5", bg: "#e3f2fd", screen: "History" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Premium Teal Gradient Header */}
      <LinearGradient
        colors={["#0a3c30", "#0e6655", "#117a65"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.welcome}>Logged in as Staff · {user?.name}</Text>
          {user?.center && (
            <View style={styles.centerTag}>
              <Icon name="hospital-building" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.centerText}>{user.center.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleActionBtn} onPress={logout}>
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {actions.map(a => (
          <Card key={a.label} style={styles.listCard} onPress={() => navigation.navigate(a.screen)}>
            <Card.Content style={styles.listRow}>
              <View style={styles.listLeft}>
                <View style={[styles.circularIconBg, { backgroundColor: a.bg }]}>
                  <Icon name={a.icon} size={22} color={a.color} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.listName}>{a.label}</Text>
                  <Text style={styles.listSub}>{a.sub}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#bdbdbd" />
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  header: {
    backgroundColor: "#0e6655",
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4
  },
  headerInfo: { flex: 1 },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", letterSpacing: 0.5 },
  welcome: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 },
  centerTag: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  centerText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  circleActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center"
  },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.3
  },
  listCard: { marginBottom: 12, borderRadius: 16, backgroundColor: "#fff", elevation: 1 },
  listRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  circularIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  listName: { fontSize: 15, fontWeight: "600", color: "#212121" },
  listSub: { fontSize: 12, color: "#757575", marginTop: 2 }
});
