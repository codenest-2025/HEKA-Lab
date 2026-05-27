import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Text, Card, Button, Portal, Modal, TextInput, ActivityIndicator, Snackbar, Chip, SegmentedButtons } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function AgentDashboard() {
  const { user, logout, refreshProfile } = useAuth();

  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings"); // "bookings" or "settlements"

  // Send share modal state
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      await refreshProfile();
      const [payRes, bookRes] = await Promise.all([
        API.get("/payments"),
        API.get("/bookings")
      ]);
      setPayments(payRes.data);
      setBookings(bookRes.data);
    } catch {
      setSnack("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendShare = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setSnack("Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await API.post("/payments", {
        type: "AgentToAdmin",
        amount: parseFloat(amount),
        paymentMode,
        notes,
        bookingId: selectedBookingId || undefined
      });
      setVisible(false);
      setAmount("");
      setNotes("");
      setSelectedBookingId(null);
      setSnack("Payment submitted successfully!");
      loadData();
    } catch (e) {
      setSnack(e.response?.data?.message || "Error submitting payment");
    } finally {
      setSaving(false);
    }
  };

  const balance = user?.balance || 0;
  const balanceColor = balance < 0 ? "#e53935" : balance > 0 ? "#43a047" : "#757575";
  const userId = user?._id;
  const getMyAgentSnapshot = (booking) =>
    booking.agents?.find((item) => {
      const agentId = typeof item.agent === "object" ? item.agent?._id : item.agent;
      return agentId === userId;
    });

  // Calculate total revenue from this agent's automatic booking shares.
  const totalRevenue = bookings.reduce((sum, b) => sum + (getMyAgentSnapshot(b)?.commission || 0), 0);

  return (
    <View style={styles.container}>
      {/* Premium Teal Gradient Header */}
      <LinearGradient
        colors={["#0a3c30", "#0e6655", "#117a65"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.welcome}>Welcome back, {user?.name || "Agent"}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleActionBtn} onPress={logout}>
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator animating style={{ marginTop: 80 }} size="large" color="#0e6655" />
      ) : (
        <FlatList
          data={activeTab === "bookings" ? bookings : payments}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 12 }}>
              {/* Overlapping Balance & Revenue Cards Grid (2x1 or 2x2 style) */}
              <View style={styles.metricsGrid}>
                <Card style={styles.metricCard}>
                  <Card.Content style={styles.metricContent}>
                    <View style={[styles.metricIconContainer, { backgroundColor: balance < 0 ? "#ffebee" : balance > 0 ? "#e8f5e9" : "#eeeeee" }]}>
                      <Icon name="scale-balance" size={20} color={balanceColor} />
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.metricLabel}>Current Balance</Text>
                      <Text style={[styles.metricAmount, { color: balanceColor }]}>₹{Math.abs(balance).toFixed(2)}</Text>
                      <Text style={styles.metricSubText}>
                        {balance < 0 ? "Payable to Admin" : balance > 0 ? "You will get from Admin" : "Dues Cleared"}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>

                <Card style={styles.metricCard}>
                  <Card.Content style={styles.metricContent}>
                    <View style={[styles.metricIconContainer, { backgroundColor: "#e0f2f1" }]}>
                      <Icon name="cash-multiple" size={20} color="#0e6655" />
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.metricLabel}>Total Revenue</Text>
                      <Text style={[styles.metricAmount, { color: "#0e6655" }]}>₹{totalRevenue.toFixed(2)}</Text>
                      <Text style={styles.metricSubText}>Total earnings</Text>
                    </View>
                  </Card.Content>
                </Card>
              </View>

              {/* Action Button: Pay admin */}
              <Button
                mode="contained"
                onPress={() => {
                  if (balance < 0) setAmount(Math.abs(balance).toFixed(2));
                  setVisible(true);
                }}
                style={styles.payButton}
                icon="send"
                contentStyle={{ paddingVertical: 6 }}
                buttonColor="#0e6655"
                disabled={balance >= 0}
              >
                {balance < 0 ? `Pay Admin share (₹${Math.abs(balance).toFixed(2)})` : "No admin payment due"}
              </Button>

              {/* Tab Selector */}
              <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                style={styles.toggle}
                buttons={[
                  { value: "bookings", label: `Bookings (${bookings.length})`, icon: "clipboard-text-outline" },
                  { value: "settlements", label: `Settlements (${payments.length})`, icon: "cash-check" }
                ]}
              />
            </View>
          }
          renderItem={({ item }) => {
            if (activeTab === "bookings") {
              const myShare = getMyAgentSnapshot(item);
              const isSettled = item.adminSettlementStatus === "Settled";
              const wasPaidByMe = isSettled && item.adminSettledBy && (
                typeof item.adminSettledBy === "object"
                  ? item.adminSettledBy._id?.toString() === userId?.toString()
                  : item.adminSettledBy.toString() === userId?.toString()
              );
              const commission = myShare?.commission || 0;
              const adminDue = Math.max(item.totalPrice - commission, 0);

              return (
                <Card style={styles.listCard}>
                  <Card.Content style={{ gap: 8 }}>
                    <View style={styles.listRow}>
                      <View style={styles.listLeft}>
                        <View style={[styles.circularIconBg, { backgroundColor: isSettled ? "#ede7f6" : "#e8f5e9" }]}>
                          <Icon name="account" size={22} color={isSettled ? "#6200ee" : "#2e7d32"} />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.patientName}>{item.patient?.name}</Text>
                          <Text style={styles.testMeta}>
                            {item.tests?.map((t) => t.name).join(", ")}
                          </Text>
                          <Text style={styles.dateMeta}>
                            {new Date(item.createdAt).toLocaleDateString()} · Collected by: {item.paymentCollectedBy}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.commissionText}>+₹{commission.toFixed(0)}</Text>
                        <Text style={styles.commissionLabel}>Commission</Text>
                      </View>
                    </View>

                    <View style={{ borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        {!isSettled ? (
                          <>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Chip size="small" compact style={{ backgroundColor: "#ffebee" }} textStyle={{ color: "#c62828", fontSize: 10 }}>Pending Settlement</Chip>
                            </View>
                            <Text style={{ fontSize: 12, color: "#e53935", marginTop: 4, fontWeight: "600" }}>
                              Admin Due: ₹{adminDue.toFixed(2)} (Total: ₹{item.totalPrice})
                            </Text>
                          </>
                        ) : wasPaidByMe ? (
                          <>
                            <Chip size="small" compact style={{ backgroundColor: "#e8f5e9", alignSelf: "flex-start" }} textStyle={{ color: "#2e7d32", fontSize: 10 }}>Settled (Paid by You)</Chip>
                            <Text style={{ fontSize: 11, color: "#757575", marginTop: 4 }}>Your dues are fully settled for this booking.</Text>
                          </>
                        ) : (
                          <>
                            <Chip size="small" compact style={{ backgroundColor: "#e0f2f1", alignSelf: "flex-start" }} textStyle={{ color: "#00796b", fontSize: 10 }}>Settled (Paid by {item.adminSettledBy?.name || "Other Agent"})</Chip>
                            <Text style={{ fontSize: 12, color: "#2e7d32", marginTop: 4, fontWeight: "600" }}>
                              You will get from Admin: +₹{commission.toFixed(2)}
                            </Text>
                          </>
                        )}
                      </View>

                      {!isSettled && (
                        <Button
                          mode="contained"
                          buttonColor="#0e6655"
                          compact
                          labelStyle={{ fontSize: 10, marginHorizontal: 6, marginVertical: 4 }}
                          style={{ borderRadius: 6, alignSelf: "center", minWidth: 80 }}
                          onPress={() => {
                            setAmount(adminDue.toFixed(2));
                            setNotes(`Settle booking for patient ${item.patient?.name || ""}`);
                            setSelectedBookingId(item._id);
                            setVisible(true);
                          }}
                        >
                          Settle & Pay
                        </Button>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              );
            } else {
              return (
                <Card style={styles.listCard}>
                  <Card.Content style={styles.listRow}>
                    <View style={styles.listLeft}>
                      <View style={[styles.circularIconBg, { backgroundColor: "#ede7f6" }]}>
                        <Icon name="check-circle-outline" size={22} color="#6200ee" />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.historyText}>Payment Ref: {item._id.substring(18)}</Text>
                        <Text style={styles.historySub}>
                          {new Date(item.createdAt).toLocaleDateString()} · Mode: {item.paymentMode}
                        </Text>
                        {item.notes ? <Text style={styles.notes}>"{item.notes}"</Text> : null}
                      </View>
                    </View>
                    <Text style={styles.paymentAmount}>₹{item.amount.toFixed(0)}</Text>
                  </Card.Content>
                </Card>
              );
            }
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {activeTab === "bookings" ? "No bookings referred yet." : "No settlements recorded yet."}
            </Text>
          }
          refreshing={loading}
          onRefresh={loadData}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => { setVisible(false); setSelectedBookingId(null); setAmount(""); setNotes(""); }} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Settle Dues with Admin</Text>
          <TextInput
            label="Amount (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Payment Mode</Text>
          <View style={styles.modeContainer}>
            <Button
              mode={paymentMode === "Cash" ? "contained" : "outlined"}
              onPress={() => setPaymentMode("Cash")}
              style={{ flex: 1 }}
              buttonColor={paymentMode === "Cash" ? "#0e6655" : undefined}
            >
              Cash
            </Button>
            <Button
              mode={paymentMode === "Bank" ? "contained" : "outlined"}
              onPress={() => setPaymentMode("Bank")}
              style={{ flex: 1, marginLeft: 10 }}
              buttonColor={paymentMode === "Bank" ? "#0e6655" : undefined}
            >
              Bank
            </Button>
          </View>
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleSendShare} loading={saving} disabled={saving} style={{ marginTop: 12 }} buttonColor="#0e6655">
            Submit Payment
          </Button>
          <Button mode="text" onPress={() => { setVisible(false); setSelectedBookingId(null); setAmount(""); setNotes(""); }} textColor="#757575">
            Cancel
          </Button>
        </Modal>
      </Portal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>
        {snack}
      </Snackbar>
    </View>
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
  metricsGrid: { marginTop: 12, flexDirection: "row", gap: 12, marginBottom: 4 },
  metricCard: { flex: 1, borderRadius: 16, backgroundColor: "#fff", elevation: 2 },
  metricContent: { paddingVertical: 12, paddingHorizontal: 12 },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  metricLabel: { fontSize: 10, color: "#757575", fontWeight: "600" },
  metricAmount: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  metricSubText: { fontSize: 9, color: "#9e9e9e", marginTop: 2 },
  payButton: { borderRadius: 10, marginVertical: 4 },
  toggle: { marginTop: 6, marginBottom: 4 },
  listCard: { marginBottom: 10, borderRadius: 16, backgroundColor: "#fff", elevation: 1 },
  listRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  circularIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  patientName: { fontSize: 14, fontWeight: "600", color: "#212121" },
  testMeta: { fontSize: 12, color: "#616161", marginTop: 2 },
  dateMeta: { fontSize: 10, color: "#9e9e9e", marginTop: 2 },
  commissionText: { fontSize: 15, fontWeight: "700", color: "#2e7d32" },
  commissionLabel: { fontSize: 10, color: "#757575", marginTop: 2 },
  historyText: { fontSize: 14, fontWeight: "600", color: "#212121" },
  historySub: { fontSize: 11, color: "#757575", marginTop: 2 },
  paymentAmount: { fontSize: 15, fontWeight: "700", color: "#6200ee" },
  notes: { fontSize: 11, color: "#757575", fontStyle: "italic", marginTop: 2 },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 24, fontSize: 14 },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: "#616161", marginBottom: 6, fontWeight: "600" },
  modeContainer: { flexDirection: "row", marginBottom: 16 }
});
