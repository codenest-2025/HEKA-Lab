import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import {
  Text, FAB, Portal, Modal, TextInput, Button, Card,
  Snackbar, ActivityIndicator, Chip, Menu, SegmentedButtons, IconButton
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

  // Edit state
  const [editingUser, setEditingUser] = useState(null);

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

  const openAddModal = () => {
    setEditingUser(null);
    setName("");
    setUsername("");
    setPassword("");
    setPercentage("");
    setSelectedCenter(null);
    setVisible(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword("");
    setPercentage(user.agentPercentage ? user.agentPercentage.toString() : "");
    setSelectedCenter(user.center);
    setVisible(true);
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      "Delete User",
      "Are you sure you want to delete this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/auth/users/${userId}`);
              setSnack("User deleted successfully!");
              loadData();
            } catch (e) {
              setSnack(e.response?.data?.message || "Error deleting user");
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "inactive" ? "active" : "inactive";
    try {
      await API.put(`/auth/users/${user._id}`, { status: newStatus });
      setSnack(`User status updated to ${newStatus}!`);
      loadData();
    } catch (e) {
      setSnack(e.response?.data?.message || "Error updating status");
    }
  };

  const handleAdd = async () => {
    if (activeTab === "agents") {
      if (!name || !username || (!editingUser && !password) || !percentage || !selectedCenter) {
        setSnack("Fill all fields");
        return;
      }
    } else {
      if (!name || !username || (!editingUser && !password) || !selectedCenter) {
        setSnack("Fill all fields");
        return;
      }
    }

    setSaving(true);
    try {
      if (editingUser) {
        await API.put(`/auth/users/${editingUser._id}`, {
          name,
          username,
          ...(password ? { password } : {}),
          agentPercentage: activeTab === "agents" ? parseFloat(percentage) : 0,
          centerId: selectedCenter._id
        });
        setSnack(activeTab === "agents" ? "Agent updated!" : "Staff updated!");
      } else {
        await API.post("/auth/register", {
          name,
          username,
          password,
          role: activeTab === "agents" ? "agent" : "staff",
          agentPercentage: activeTab === "agents" ? parseFloat(percentage) : 0,
          centerId: selectedCenter._id
        });
        setSnack(activeTab === "agents" ? "Agent added!" : "Staff member added!");
      }
      setVisible(false);
      setName("");
      setUsername("");
      setPassword("");
      setPercentage("");
      setSelectedCenter(null);
      setEditingUser(null);
      loadData();
    } catch (e) {
      setSnack(e.response?.data?.message || "Error saving user");
    } finally {
      setSaving(false);
    }
  };

  const balanceColor = (b) => (b < 0 ? "#e53935" : b > 0 ? "#43a047" : "#757575");
  const balanceLabel = (b) => (b < 0 ? `Owes ₹${Math.abs(b).toFixed(2)}` : b > 0 ? `Due ₹${b.toFixed(2)}` : "Clear ✓");

  return (
    <View style={styles.container}>
      {/* Tab Toggle */}
      <View style={styles.tabRow}>
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
                    <Icon name="account-tie" size={22} color={item.status === "inactive" ? "#9e9e9e" : "#6200ee"} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={[styles.name, item.status === "inactive" && styles.inactiveText]}>{item.name}</Text>
                      <Text style={styles.sub}>@{item.username} · {item.agentPercentage}% commission</Text>
                      {item.center && (
                        <View style={styles.centerChip}>
                          <Icon name="hospital-building" size={12} color="#1e88e5" />
                          <Text style={styles.centerText}>{item.center.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Chip
                      textStyle={{ color: balanceColor(item.balance), fontWeight: "700" }}
                      style={{ backgroundColor: balanceColor(item.balance) + "22" }}
                    >
                      {balanceLabel(item.balance)}
                    </Chip>
                    <View style={styles.actionsRow}>
                      <IconButton
                        icon={item.status === "inactive" ? "account-off-outline" : "account-check-outline"}
                        size={18}
                        iconColor={item.status === "inactive" ? "#d32f2f" : "#43a047"}
                        onPress={() => handleToggleStatus(item)}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="pencil"
                        size={18}
                        iconColor="#0e6655"
                        onPress={() => openEditModal(item)}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={18}
                        iconColor="#d32f2f"
                        onPress={() => handleDeleteUser(item._id)}
                        style={styles.actionButton}
                      />
                    </View>
                  </View>
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
                <Icon name="account" size={22} color={item.status === "inactive" ? "#9e9e9e" : "#43a047"} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.name, item.status === "inactive" && styles.inactiveText]}>{item.name}</Text>
                  <Text style={styles.sub}>@{item.username}</Text>
                  {item.center && (
                    <View style={styles.centerChip}>
                      <Icon name="hospital-building" size={12} color="#1e88e5" />
                      <Text style={styles.centerText}>{item.center.name}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actionsRow}>
                  <IconButton
                    icon={item.status === "inactive" ? "account-off-outline" : "account-check-outline"}
                    size={18}
                    iconColor={item.status === "inactive" ? "#d32f2f" : "#43a047"}
                    onPress={() => handleToggleStatus(item)}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="pencil"
                    size={18}
                    iconColor="#0e6655"
                    onPress={() => openEditModal(item)}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="delete"
                    size={18}
                    iconColor="#d32f2f"
                    onPress={() => handleDeleteUser(item._id)}
                    style={styles.actionButton}
                  />
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No staff members added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>
            {activeTab === "agents" ? (editingUser ? "Edit Agent" : "Add New Agent") : (editingUser ? "Edit Staff" : "Add New Staff")}
          </Text>
          <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" autoCapitalize="none" style={styles.input} />
          <TextInput label="Password (leave blank to keep current)" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={styles.input} />

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
            {activeTab === "agents" ? (editingUser ? "Save Changes" : "Add Agent") : (editingUser ? "Save Changes" : "Add Staff")}
          </Button>
          <Button mode="text" onPress={() => setVisible(false)}>
            Cancel
          </Button>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        label={activeTab === "agents" ? "Add Agent" : "Add Staff"}
        color="#fff"
      />
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  tabRow: {
    padding: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 1,
  },
  toggle: { marginTop: 4 },
  listContainer: { padding: 16, gap: 10 },
  card: { borderRadius: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#212121" },
  sub: { fontSize: 12, color: "#757575", marginTop: 2 },
  inactiveText: { textDecorationLine: "line-through", color: "#9e9e9e" },
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
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#0e6655" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 0, marginTop: 4 },
  actionButton: { margin: 0, padding: 0 }
});
