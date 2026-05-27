import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import {
  Text, FAB, Portal, Modal, TextInput, Button, Card,
  Snackbar, ActivityIndicator, Chip, Menu, SegmentedButtons
} from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import API from "../utils/api";

export default function ManagePeople() {
  const [activeTab, setActiveTab] = useState("agents"); // "agents" or "staff"

  // Lists
  const [agents, setAgents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [centers, setCenters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [percentage, setPercentage] = useState(""); // Only for Agent
  const [selectedCenter, setSelectedCenter] = useState(null); // For Agent & Staff

  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [agentsRes, staffRes, centersRes] = await Promise.all([
        API.get("/auth/agents"),
        API.get("/auth/staff"),
        API.get("/centers")
      ]);
      setAgents(agentsRes.data);
      setStaff(staffRes.data);
      setCenters(centersRes.data);
    } catch {
      setSnack("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async () => {
    if (activeTab === "agents") {
      if (!name || !username || !password || !percentage || !selectedCenter) {
        setSnack("Fill all fields");
        return;
      }
    } else {
      if (!name || !username || !password || !selectedCenter) {
        setSnack("Fill all fields");
        return;
      }
    }

    setSaving(true);
    try {
      await API.post("/auth/register", {
        name,
        username,
        password,
        role: activeTab === "agents" ? "agent" : "staff",
        agentPercentage: activeTab === "agents" ? parseFloat(percentage) : 0,
        centerId: selectedCenter._id
      });
      setVisible(false);
      setName("");
      setUsername("");
      setPassword("");
      setPercentage("");
      setSelectedCenter(null);
      loadData();
      setSnack(activeTab === "agents" ? "Agent added!" : "Staff member added!");
    } catch (e) {
      setSnack(e.response?.data?.message || "Error adding user");
    } finally {
      setSaving(false);
    }
  };

  const balanceColor = (b) => (b < 0 ? "#e53935" : b > 0 ? "#43a047" : "#757575");
  const balanceLabel = (b) => (b < 0 ? `Owes ₹${Math.abs(b).toFixed(2)}` : b > 0 ? `Due ₹${b.toFixed(2)}` : "Clear ✓");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage People</Text>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          style={styles.toggle}
          buttons={[
            { value: "agents", label: "Agents", icon: "account-tie" },
            { value: "staff", label: "Staff", icon: "account" }
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator animating style={{ marginTop: 40 }} />
      ) : activeTab === "agents" ? (
        <FlatList
          data={agents}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Icon name="account-tie" size={22} color="#6200ee" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.sub}>@{item.username} · {item.agentPercentage}% commission</Text>
                      {item.center && (
                        <View style={styles.centerChip}>
                          <Icon name="hospital-building" size={12} color="#1e88e5" />
                          <Text style={styles.centerText}>{item.center.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Chip
                    textStyle={{ color: balanceColor(item.balance), fontWeight: "700" }}
                    style={{ backgroundColor: balanceColor(item.balance) + "22" }}
                  >
                    {balanceLabel(item.balance)}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No agents added yet.</Text>}
        />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.row}>
                <Icon name="account" size={22} color="#43a047" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>@{item.username}</Text>
                </View>
                {item.center && (
                  <View style={styles.centerChip}>
                    <Icon name="hospital-building" size={12} color="#1e88e5" />
                    <Text style={styles.centerText}>{item.center.name}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No staff members added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>
            {activeTab === "agents" ? "Add New Agent" : "Add New Staff"}
          </Text>
          <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" autoCapitalize="none" style={styles.input} />
          <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={styles.input} />
          
          {activeTab === "agents" && (
            <TextInput
              label="Commission %"
              value={percentage}
              onChangeText={setPercentage}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          )}

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.input}
                contentStyle={{ justifyContent: "flex-start" }}
              >
                {selectedCenter ? selectedCenter.name : "Select Center"}
              </Button>
            }
          >
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

          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 12 }}>
            {activeTab === "agents" ? "Add Agent" : "Add Staff"}
          </Button>
          <Button mode="text" onPress={() => setVisible(false)}>
            Cancel
          </Button>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setVisible(true)}
        label={activeTab === "agents" ? "Add Agent" : "Add Staff"}
      />
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: {
    padding: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 16,
    backgroundColor: "#fff",
    elevation: 2,
    gap: 10
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#6200ee" },
  toggle: { marginTop: 4 },
  listContainer: { padding: 16, gap: 10 },
  card: { borderRadius: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#212121" },
  sub: { fontSize: 12, color: "#757575", marginTop: 2 },
  centerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start"
  },
  centerText: { fontSize: 11, color: "#1e88e5", fontWeight: "600" },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 40, fontSize: 15 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#6200ee" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 }
});
