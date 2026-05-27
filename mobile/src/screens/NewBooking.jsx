import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import {
  Text, TextInput, Button, Card, Snackbar, ActivityIndicator,
  SegmentedButtons, Checkbox, Searchbar, Portal, Modal, Menu, Chip
} from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function NewBooking({ route, navigation }) {
  const { user } = useAuth();

  // Mode: "new" or "existing"
  const [bookingMode, setBookingMode] = useState("new");

  // New Patient fields
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientPhone, setPatientPhone] = useState("");

  // Existing Patient fields
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  // Booking fields
  const [tests, setTests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentMode, setPaymentMode] = useState("Cash");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");
  const [snackType, setSnackType] = useState("info");

  // New Test creation states
  const [labs, setLabs] = useState([]);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestPrice, setNewTestPrice] = useState("");
  const [selectedLabForNewTest, setSelectedLabForNewTest] = useState(null);
  const [labMenuVisible, setLabMenuVisible] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [testDropdownVisible, setTestDropdownVisible] = useState(false);

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
      const [testsRes, agentsRes, patientsRes, labsRes] = await Promise.all([
        API.get("/labs/tests"),
        API.get("/auth/agents"),
        API.get("/bookings/patients"),
        API.get("/labs")
      ]);
      setTests(testsRes.data);
      setAgents(agentsRes.data);
      setPatients(patientsRes.data);
      setLabs(labsRes.data);
    } catch {
      setSnack("Failed to load tests/agents");
      setSnackType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateTest = async () => {
    if (!newTestName || !newTestPrice || !selectedLabForNewTest) {
      setSnack("Please fill all test fields");
      setSnackType("error");
      return;
    }
    setCreatingTest(true);
    try {
      const res = await API.post("/labs/tests", {
        name: newTestName,
        price: parseFloat(newTestPrice),
        labId: selectedLabForNewTest._id
      });
      setTests(prev => [...prev, res.data]);
      setSelectedTests(prev => [...prev, res.data]);
      setNewTestName("");
      setNewTestPrice("");
      setSelectedLabForNewTest(null);
      setShowAddTestModal(false);
      setSnack("Test created and selected!");
      setSnackType("success");
    } catch (e) {
      setSnack(e.response?.data?.message || "Error creating test");
      setSnackType("error");
    } finally {
      setCreatingTest(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      if (route.params?.patient) {
        setSelectedPatient(route.params.patient);
        setBookingMode("existing");
        // Clear route params so it doesn't get stuck
        navigation.setParams({ patient: undefined });
      }
    }, [loadData, route.params?.patient, navigation])
  );

  const toggleTest = (test) => {
    setSelectedTests(prev =>
      prev.find(t => t._id === test._id) ? prev.filter(t => t._id !== test._id) : [...prev, test]
    );
  };

  const handleSubmit = async () => {
    let patientId = "";

    if (bookingMode === "new") {
      if (!patientName || !patientAge || !patientPhone) {
        setSnack("Fill all patient fields");
        setSnackType("error");
        return;
      }
      setSaving(true);
      try {
        // Register patient first
        const patRes = await API.post("/bookings/patients", {
          name: patientName,
          age: parseInt(patientAge, 10),
          gender: patientGender,
          phone: patientPhone
        });
        patientId = patRes.data._id;
      } catch (e) {
        setSnack(e.response?.data?.message || "Error creating patient");
        setSnackType("error");
        setSaving(false);
        return;
      }
    } else {
      if (!selectedPatient) {
        setSnack("Please select an existing patient");
        setSnackType("error");
        return;
      }
      patientId = selectedPatient._id;
      setSaving(true);
    }

    if (selectedTests.length === 0) {
      setSnack("Select at least one test");
      setSnackType("error");
      setSaving(false);
      return;
    }

    try {
      // Create booking
      await API.post("/bookings", {
        patientId,
        testIds: selectedTests.map(t => t._id),
        paymentMode,
        paymentCollectedBy: "Staff",
        centerId,
      });

      // Reset
      setPatientName("");
      setPatientAge("");
      setPatientPhone("");
      setPatientGender("Male");
      setSelectedPatient(null);
      setSelectedTests([]);
      setPatientSearchQuery("");
      setSnack("Booking created successfully!");
      setSnackType("success");
    } catch (e) {
      setSnack(e.response?.data?.message || "Error creating booking");
      setSnackType("error");
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = patientSearchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.phone?.includes(q);
  });

  if (loading) {
    return <ActivityIndicator animating style={{ flex: 1, justifyContent: "center", marginTop: 80 }} size="large" />;
  }

  return (
    <ScrollView style={styles.container}>

      <View style={{ padding: 16, gap: 12 }}>
        {/* Toggle Mode */}
        <SegmentedButtons
          value={bookingMode}
          onValueChange={setBookingMode}
          buttons={[
            { value: "new", label: "New Patient", icon: "account-plus" },
            { value: "existing", label: "Existing Patient", icon: "account-check" }
          ]}
          style={{ marginBottom: 4 }}
        />

        {/* Patient Details Card */}
        <Card style={styles.card}>
          <Card.Title
            title={bookingMode === "new" ? "New Patient Details" : "Select Patient"}
            left={() => <Icon name="account" size={22} color="#0e6655" />}
          />
          <Card.Content style={{ gap: 10 }}>
            {bookingMode === "new" ? (
              <>
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
              </>
            ) : selectedPatient ? (
              <View style={styles.selectedPatientBox}>
                <View style={styles.patientInfoCol}>
                  <Text style={styles.selectedPatientName}>{selectedPatient.name}</Text>
                  <Text style={styles.selectedPatientSub}>
                    {selectedPatient.age} yrs · {selectedPatient.gender} · {selectedPatient.phone}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  textColor="#c62828"
                  style={{ borderColor: "#c62828" }}
                  onPress={() => setSelectedPatient(null)}
                  compact
                >
                  Change
                </Button>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Searchbar
                  placeholder="Search name or phone..."
                  value={patientSearchQuery}
                  onChangeText={setPatientSearchQuery}
                  style={styles.searchBar}
                  inputStyle={styles.searchInput}
                />
                <View style={styles.patientListContainer}>
                  {filteredPatients.slice(0, 5).map((p) => (
                    <TouchableOpacity
                      key={p._id}
                      style={styles.patientSelectItem}
                      onPress={() => setSelectedPatient(p)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientSelectName}>{p.name}</Text>
                        <Text style={styles.patientSelectSub}>{p.age} yrs · {p.gender} · {p.phone}</Text>
                      </View>
                      <Icon name="chevron-right" size={20} color="#757575" />
                    </TouchableOpacity>
                  ))}
                  {filteredPatients.length === 0 && (
                    <Text style={styles.empty}>No matching patients found.</Text>
                  )}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Test Selection Card */}
        <Card style={styles.card}>
          <Card.Title title="Select Tests" left={() => <Icon name="flask" size={22} color="#1e88e5" />} />
          <Card.Content style={{ gap: 8 }}>
            <Menu
              visible={testDropdownVisible}
              onDismiss={() => setTestDropdownVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setTestDropdownVisible(true)}
                  icon="chevron-down"
                  contentStyle={{ flexDirection: "row-reverse", justifyContent: "space-between" }}
                  style={{ borderColor: "#0e6655", width: "100%" }}
                  textColor="#0e6655"
                >
                  {selectedTests.length > 0
                    ? `${selectedTests.length} Test(s) Selected`
                    : "Choose Tests"}
                </Button>
              }
              contentStyle={{ width: "90%", maxHeight: 300 }}
            >
              <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled={true}>
                {tests.map((test) => {
                  const checked = !!selectedTests.find((t) => t._id === test._id);
                  return (
                    <Menu.Item
                      key={test._id}
                      onPress={() => toggleTest(test)}
                      title={`${test.name} (₹${test.price})`}
                      leadingIcon={checked ? "checkbox-marked" : "checkbox-blank-outline"}
                    />
                  );
                })}
                {tests.length === 0 && (
                  <Menu.Item title="No tests available" disabled />
                )}
              </ScrollView>
            </Menu>

            {/* Selected Tests Chips */}
            {selectedTests.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {selectedTests.map((test) => (
                  <Chip
                    key={test._id}
                    onClose={() => toggleTest(test)}
                    style={{ backgroundColor: "#e0f2f1" }}
                    textStyle={{ color: "#0e6655", fontSize: 12, fontWeight: "600" }}
                  >
                    {test.name} (₹{test.price})
                  </Chip>
                ))}
              </View>
            )}

            <Button
              icon="plus"
              mode="text"
              textColor="#0e6655"
              style={{ marginTop: 4 }}
              onPress={() => setShowAddTestModal(true)}
            >
              Add New Test Option
            </Button>
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

      <Portal>
        <Modal
          visible={showAddTestModal}
          onDismiss={() => setShowAddTestModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add New Test Option</Text>
          <TextInput
            label="Test Name"
            value={newTestName}
            onChangeText={setNewTestName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Price (₹)"
            value={newTestPrice}
            onChangeText={setNewTestPrice}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          <Menu
            visible={labMenuVisible}
            onDismiss={() => setLabMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setLabMenuVisible(true)}
                style={styles.input}
                contentStyle={{ justifyContent: "flex-start" }}
                textColor="#0e6655"
              >
                {selectedLabForNewTest ? selectedLabForNewTest.name : "Select Lab"}
              </Button>
            }
          >
            {labs.map((lab) => (
              <Menu.Item
                key={lab._id}
                onPress={() => {
                  setSelectedLabForNewTest(lab);
                  setLabMenuVisible(false);
                }}
                title={lab.name}
              />
            ))}
          </Menu>
          <Button
            mode="contained"
            onPress={handleCreateTest}
            loading={creatingTest}
            disabled={creatingTest}
            style={{ marginTop: 12 }}
            buttonColor="#0e6655"
          >
            Add Test
          </Button>
          <Button
            mode="text"
            onPress={() => setShowAddTestModal(false)}
            style={{ marginTop: 4 }}
            textColor="#757575"
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3500}>{snack}</Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  title: { fontSize: 20, fontWeight: "bold", color: "#0e6655" },
  card: { borderRadius: 12 },
  fieldLabel: { fontSize: 13, color: "#616161", marginBottom: 6, fontWeight: "600" },
  testRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  testName: { fontSize: 14, fontWeight: "600", color: "#212121" },
  testPrice: { fontSize: 15, fontWeight: "700", color: "#0e6655" },
  empty: { color: "#9e9e9e", textAlign: "center", marginVertical: 10 },
  agentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  agentName: { fontWeight: "600", color: "#212121" },
  agentSub: { color: "#757575", fontSize: 12 },
  agentShare: { fontSize: 14, fontWeight: "700", color: "#ff9800" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryBold: { fontWeight: "700", color: "#212121" },
  selectedPatientBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e0f2f1",
    padding: 12,
    borderRadius: 8,
  },
  patientInfoCol: {
    flex: 1,
  },
  selectedPatientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0a3c30",
  },
  selectedPatientSub: {
    fontSize: 12,
    color: "#0e6655",
    marginTop: 2,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#f4f6f8",
    borderRadius: 8,
    height: 48,
  },
  searchInput: {
    fontSize: 14,
    minHeight: 48,
  },
  patientListContainer: {
    marginTop: 4,
    maxHeight: 250,
  },
  patientSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  patientSelectName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  patientSelectSub: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
});
