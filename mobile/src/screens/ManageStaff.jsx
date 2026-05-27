import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, FAB, Portal, Modal, TextInput, Button, Card, Snackbar, ActivityIndicator, Menu } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import API from "../utils/api";

export default function ManageStaff() {
  const [staff, setStaff] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [staffRes, centersRes] = await Promise.all([API.get("/auth/staff"), API.get("/centers")]);
      setStaff(staffRes.data);
      setCenters(centersRes.data);
    } catch { setSnack("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!name || !username || !password || !selectedCenter) { setSnack("Fill all fields"); return; }
    setSaving(true);
    try {
      await API.post("/auth/register", { name, username, password, role: "staff", centerId: selectedCenter._id });
      setVisible(false); setName(""); setUsername(""); setPassword(""); setSelectedCenter(null);
      loadData(); setSnack("Staff member added!");
    } catch (e) { setSnack(e.response?.data?.message || "Error adding staff"); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Manage Staff</Text></View>

      {loading ? <ActivityIndicator animating style={{ marginTop: 40 }} /> : (
        <FlatList
          data={staff}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.row}>
                <Icon name="account" size={22} color="#43a047" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>@{item.username}</Text>
                </View>
                <View style={styles.centerChip}>
                  <Icon name="hospital-building" size={14} color="#1e88e5" />
                  <Text style={styles.centerText}>{item.center?.name || "No Center"}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No staff members added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Add New Staff</Text>
          <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" autoCapitalize="none" style={styles.input} />
          <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={styles.input} />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)} style={styles.input} contentStyle={{ justifyContent: "flex-start" }}>
                {selectedCenter ? selectedCenter.name : "Select Center"}
              </Button>
            }
          >
            {centers.map(c => (
              <Menu.Item key={c._id} onPress={() => { setSelectedCenter(c); setMenuVisible(false); }} title={c.name} />
            ))}
          </Menu>
          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 12 }}>Add Staff</Button>
          <Button mode="text" onPress={() => setVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={() => setVisible(true)} label="Add Staff" />
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: { padding: 16, backgroundColor: "#fff", elevation: 2 },
  title: { fontSize: 20, fontWeight: "bold", color: "#6200ee" },
  card: { borderRadius: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "600", color: "#212121" },
  sub: { fontSize: 12, color: "#757575" },
  centerChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#e3f2fd", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  centerText: { fontSize: 12, color: "#1e88e5", fontWeight: "600" },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 40, fontSize: 15 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#6200ee" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
});
