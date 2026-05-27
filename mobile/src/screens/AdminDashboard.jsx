import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { Text, Surface, Card, ActivityIndicator, Snackbar, Chip } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import API from "../utils/api";

function MetricCard({ icon, label, amount, color, iconBg }) {
  return (
    <Card style={styles.metricCard}>
      <Card.Content style={styles.metricContent}>
        <View style={[styles.metricIconContainer, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricAmount, { color: "#212121" }]}>₹{amount.toFixed(2)}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      const res = await API.get("/payments/summary");
      setSummary(res.data);
    } catch (e) {
      setSnack("Failed to load summary");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      loadSummary();
    };

    socket.on("bookingCreated", handleUpdate);
    socket.on("bookingUpdated", handleUpdate);
    socket.on("paymentCreated", handleUpdate);

    return () => {
      socket.off("bookingCreated", handleUpdate);
      socket.off("bookingUpdated", handleUpdate);
      socket.off("paymentCreated", handleUpdate);
    };
  }, [socket, loadSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Premium Teal Gradient Header */}
      <LinearGradient
        colors={["#0a3c30", "#0e6655", "#117a65"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.welcome}>Welcome back, {user?.name || "Admin"}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleActionBtn} onPress={onRefresh}>
            <Icon name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleActionBtn, { marginLeft: 8 }]} onPress={logout}>
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator animating style={{ marginTop: 80 }} size="large" color="#0e6655" />
      ) : summary ? (
        <View style={styles.content}>
          {/* Overlapping Metric Cards Grid (2x2) */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <MetricCard
                icon="arrow-down-bold"
                label="From Centers"
                amount={summary.summary.totalFromCenters}
                color="#e53935"
                iconBg="#ffebee"
              />
              <MetricCard
                icon="arrow-up-bold"
                label="To Agents"
                amount={summary.summary.totalToAgents}
                color="#43a047"
                iconBg="#e8f5e9"
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                icon="flask"
                label="To Labs"
                amount={summary.summary.totalToLabs}
                color="#1e88e5"
                iconBg="#e3f2fd"
              />
              <MetricCard
                icon="scale-balance"
                label="Net Balance (1 Mo)"
                amount={summary.summary.netBalanceOneMonth}
                color={summary.summary.netBalanceOneMonth >= 0 ? "#0e6655" : "#e53935"}
                iconBg={summary.summary.netBalanceOneMonth >= 0 ? "#e0f2f1" : "#ffebee"}
              />
            </View>
          </View>

          {/* Admin Shortcuts Panel */}
          <Text style={styles.sectionTitle}>Admin Panel</Text>
          <Card style={styles.listCard} onPress={() => navigation.navigate("Finance")}>
            <Card.Content style={styles.listRow}>
              <View style={styles.listLeft}>
                <View style={[styles.circularIconBg, { backgroundColor: "#e0f2f1" }]}>
                  <Icon name="cash-register" size={22} color="#0e6655" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.listName}>Financial Settlements</Text>
                  <Text style={styles.listSub}>Settle dues with Labs or Agents</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#bdbdbd" />
            </Card.Content>
          </Card>

          <Card style={styles.listCard} onPress={() => navigation.navigate("People")}>
            <Card.Content style={styles.listRow}>
              <View style={styles.listLeft}>
                <View style={[styles.circularIconBg, { backgroundColor: "#ede7f6" }]}>
                  <Icon name="account-cog" size={22} color="#6200ee" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.listName}>User Management</Text>
                  <Text style={styles.listSub}>Edit, add, or toggle Agents & Staff</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#bdbdbd" />
            </Card.Content>
          </Card>

          {/* Center Balances */}
          <Text style={styles.sectionTitle}>Center Balances</Text>
          {summary.centers.map((center) => (
            <Card key={center._id} style={styles.listCard}>
              <Card.Content>
                <View style={styles.listRow}>
                  <View style={styles.listLeft}>
                    <View style={[styles.circularIconBg, { backgroundColor: "#e0f2f1" }]}>
                      <Icon name="storefront-outline" size={22} color="#0e6655" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.listName}>{center.name}</Text>
                      <Text style={styles.listSub}>Center Balance</Text>
                    </View>
                  </View>
                  <Chip
                    textStyle={{
                      color: center.balance > 0 ? "#e53935" : "#43a047",
                      fontWeight: "bold"
                    }}
                    style={{
                      backgroundColor: center.balance > 0 ? "#ffebee" : "#e8f5e9"
                    }}
                  >
                    {center.balance > 0 ? `Payable to Admin: ₹${center.balance.toFixed(2)}` : "Cleared"}
                  </Chip>
                </View>

                {center.agentsToPay && center.agentsToPay.length > 0 && (
                  <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: "#e0e0e0", paddingTop: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: "#757575", marginBottom: 6 }}>
                      Agents to Pay:
                    </Text>
                    {center.agentsToPay.map((agent) => (
                      <View key={agent._id} style={[styles.listRow, { marginVertical: 4, paddingLeft: 8 }]}>
                        <View style={styles.listLeft}>
                          <Icon name="account-tie" size={18} color="#8e24aa" />
                          <Text style={[styles.listName, { fontSize: 13, marginLeft: 8 }]}>{agent.name}</Text>
                        </View>
                        <Chip
                          compact
                          textStyle={{ color: "#43a047", fontWeight: "bold", fontSize: 11 }}
                          style={{ backgroundColor: "#e8f5e9" }}
                        >
                          {`Pay Agent: ₹${agent.balance.toFixed(2)}`}
                        </Chip>
                      </View>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))}
          {summary.centers.length === 0 && (
            <Text style={styles.empty}>No centers configured yet.</Text>
          )}

          {/* Lab Balances */}
          <Text style={styles.sectionTitle}>Lab Balances</Text>
          {summary.labs.map((lab) => (
            <Card key={lab._id} style={styles.listCard}>
              <Card.Content style={styles.listRow}>
                <View style={styles.listLeft}>
                  <View style={[styles.circularIconBg, { backgroundColor: "#e3f2fd" }]}>
                    <Icon name="flask-outline" size={22} color="#1e88e5" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.listName}>{lab.name}</Text>
                    <Text style={styles.listSub}>{lab.labPercentage}% lab share</Text>
                  </View>
                </View>
                <Chip
                  textStyle={{ color: lab.balance > 0 ? "#e53935" : "#43a047", fontWeight: "bold" }}
                  style={{ backgroundColor: lab.balance > 0 ? "#ffebee" : "#e8f5e9" }}
                >
                  {lab.balance > 0 ? `Payable to Lab: ₹${lab.balance.toFixed(2)}` : "Clear"}
                </Chip>
              </Card.Content>
            </Card>
          ))}
          {summary.labs.length === 0 && <Text style={styles.empty}>No labs configured yet.</Text>}
          <View style={{ height: 32 }} />
        </View>
      ) : null}
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>
        {snack}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  header: {
    backgroundColor: "#0e6655",
    paddingTop: 48,
    paddingBottom: 48,
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
  headerActions: { flexDirection: "row", alignItems: "center" },
  circleActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center"
  },
  content: { paddingHorizontal: 16 },
  metricsGrid: { marginTop: 12, gap: 12, marginBottom: 16 },
  metricsRow: { flexDirection: "row", gap: 12 },
  metricCard: { flex: 1, borderRadius: 16, backgroundColor: "#fff", elevation: 2 },
  metricContent: { paddingVertical: 12, paddingHorizontal: 12 },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  metricLabel: { fontSize: 11, color: "#757575", fontWeight: "600" },
  metricAmount: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.3
  },
  listCard: { marginBottom: 10, borderRadius: 16, backgroundColor: "#fff", elevation: 1 },
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
  listSub: { fontSize: 12, color: "#757575", marginTop: 2 },
  empty: { textAlign: "center", color: "#9e9e9e", marginVertical: 16, fontSize: 14 }
});
