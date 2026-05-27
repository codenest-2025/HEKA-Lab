import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import {
  Text, TextInput, Button, Card, Snackbar, ActivityIndicator,
  SegmentedButtons, Checkbox
 } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function NewBooking() {
  const { user } = useAuth();

  // Patient fields
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientPhone, setPatientPhone] = useState("");

  // Booking fields
  const [tests, setTests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentMode, setPaymentMode] = useState("Cash");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");
  const [snackType, setSnackType] = useState("info");

  // Commission preview
  const totalPrice = selectedTests.reduce((s, t) => s + t.price, 0);
  const centerId = typeof user?.center === "object" ? user.center?._id : user?.center;
  const centerAgents = agents.filter((agent) => {
    const agentCenterId = typeof agent.center === "object" ? agent.center?._id : agent.center;
    return agentCenterId === centerId;
  });
  const totalAgentCommission = centerAgents.reduce(
    (sum, agent) => sum + (totalPrice * (agent.agentPercentage || 0)) / 100,
    0
  );
  const loadData = useCallback(async () => {
    try {
      const [testsRes, agentsRes] = await Promise.all([API.get("/labs/tests"), API.get("/auth/agents")]);
      setTests(testsRes.data);
      setAgents(agentsRes.data);
    } catch { setSnack("Failed to load tests/agents"); setSnackType("error"); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleTest = (test) => {
    setSelectedTests(prev =>
      prev.find(t => t._id === test._id) ? prev.filter(t => t._id !== test._id) : [...prev, test]
    );
  };

  const handleSubmit = async () => {
    if (!patientName || !patientAge || !patientPhone) { setSnack("Fill all patient fields"); setSnackType("error"); return; }
    if (selectedTests.length === 0) { setSnack("Select at least one test"); setSnackType("error"); return; }
    setSaving(true);
    try {
      // 1. Create patient
      const patRes = await API.post("/bookings/patients", {
        name: patientName, age: parseInt(patientAge), gender: patientGender, phone: patientPhone
      });

      // 2. Create booking
      await API.post("/bookings", {
        patientId: patRes.data._id,
        testIds: selectedTests.map(t => t._id),
        paymentMode,
        paymentCollectedBy: "Staff",
        centerId,
      });

      // Reset
      setPatientName(""); setPatientAge(""); setPatientPhone(""); setPatientGender("Male");
      setSelectedTests([]);
      setSnack("Booking created successfully!"); setSnackType("success");
    } catch (e) {
      setSnack(e.response?.data?.message || "Error creating booking"); setSnackType("error");
    }
    finally { setSaving(false); }
  };

  if (loading) return <ActivityIndicator animating style={{ flex: 1, justifyContent: "center", marginTop: 80 }} size="large" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>New Booking</Text></View>

      <View style={{ padding: 16, gap: 12 }}>
        {/* Patient Card */}
        <Card style={styles.card}>
          <Card.Title title="Patient Details" left={() => <Icon name="account-plus" size={22} color="#0e6655" />} />
          <Card.Content style={{ gap: 10 }}>
            <TextInput label="Patient Name" value={patientName} onChangeText={setPatientName} mode="outlined" />
            <TextInput label="Age" value={patientAge} onChangeText={setPatientAge} mode="outlined" keyboardType="numeric" />
            <View style={{ marginTop: 4 }}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <SegmentedButtons
                value={patientGender}
                onValueChange={setPatientGender}
                buttons={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]}
              />
            </View>
            <TextInput label="Phone" value={patientPhone} onChangeText={setPatientPhone} mode="outlined" keyboardType="phone-pad" />
          </Card.Content>
        </Card>

        {/* Test Selection Card */}
        <Card style={styles.card}>
          <Card.Title title="Select Tests" left={() => <Icon name="flask" size={22} color="#1e88e5" />} />
          <Card.Content style={{ gap: 6 }}>
            {tests.map(test => {
              const checked = !!selectedTests.find(t => t._id === test._id);
              return (
                <TouchableOpacity key={test._id} onPress={() => toggleTest(test)} style={styles.testRow}>
                  <Checkbox status={checked ? "checked" : "unchecked"} color="#0e6655" />
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.testName}>{test.name}</Text>
                  </View>
                  <Text style={styles.testPrice}>₹{test.price}</Text>
                </TouchableOpacity>
              );
            })}
            {tests.length === 0 && <Text style={styles.empty}>No tests available. Admin must add tests first.</Text>}
          </Card.Content>
        </Card>

        {/* Payment */}
        <Card style={styles.card}>
          <Card.Title title="Payment Details" left={() => <Icon name="cash" size={22} color="#43a047" />} />
          <Card.Content style={{ gap: 10 }}>
            <Text style={styles.fieldLabel}>Payment Mode</Text>
            <SegmentedButtons value={paymentMode} onValueChange={setPaymentMode}
              buttons={[{ value: "Cash", label: "Cash" }, { value: "Bank", label: "Bank Transfer" }]} />
          </Card.Content>
        </Card>

        {user?.role !== "staff" && (
          <Card style={styles.card}>
            <Card.Title title="Auto Selected Agents" left={() => <Icon name="account-group" size={22} color="#ff9800" />} />
            <Card.Content style={{ gap: 6 }}>
              {centerAgents.map((agent) => {
                const commission = (totalPrice * (agent.agentPercentage || 0)) / 100;
                const adminDue = Math.max(totalPrice - commission, 0);
                return (
                  <View key={agent._id} style={styles.agentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agentName}>{agent.name}</Text>
                      <Text style={styles.agentSub}>{agent.agentPercentage || 0}% share · Admin due ₹{adminDue.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.agentShare}>₹{commission.toFixed(2)}</Text>
                  </View>
                );
              })}
              {centerAgents.length === 0 && <Text style={styles.empty}>No agents assigned to this center.</Text>}
            </Card.Content>
          </Card>
        )}

        {/* Summary */}
        {selectedTests.length > 0 && (
          <Card style={[styles.card, { backgroundColor: "#e2f2f0" }]}>
            <Card.Content style={{ gap: 6 }}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryBold}>Total Price to Collect</Text>
                <Text style={[styles.summaryBold, { color: "#0e6655", fontSize: 18 }]}>
                  ₹{totalPrice.toFixed(2)}
                </Text>
              </View>
              {user?.role !== "staff" && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryBold}>Total Agent Shares</Text>
                  <Text style={styles.summaryBold}>₹{totalAgentCommission.toFixed(2)}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        <Button mode="contained" onPress={handleSubmit} loading={saving} disabled={saving}
          style={{ borderRadius: 10 }} contentStyle={{ paddingVertical: 6 }} buttonColor="#0e6655">
          Confirm Booking & Collect Payment
        </Button>
        <View style={{ height: 32 }} />
      </View>
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3500}>{snack}</Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: {
    padding: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 16,
    backgroundColor: "#fff",
    elevation: 2
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#6200ee" },
  card: { borderRadius: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  fieldLabel: { fontSize: 13, color: "#616161", marginBottom: 6, fontWeight: "600" },
  testRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  testName: { fontSize: 14, fontWeight: "600", color: "#212121" },
  testMeta: { fontSize: 12, color: "#757575" },
  testPrice: { fontSize: 15, fontWeight: "700", color: "#6200ee" },
  empty: { color: "#9e9e9e", textAlign: "center", marginVertical: 10 },
  agentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  agentName: { fontWeight: "600", color: "#212121" },
  agentSub: { color: "#757575", fontSize: 12 },
  agentShare: { fontSize: 14, fontWeight: "700", color: "#ff9800" },
  summaryTitle: { fontSize: 15, fontWeight: "700", color: "#6200ee", marginBottom: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryBold: { fontWeight: "700", color: "#212121" },
});
