import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, FAB, Portal, Modal, TextInput, Button, Card, Snackbar, ActivityIndicator, Menu } from "react-native-paper";
import API from "../utils/api";

export default function ManageTests() {
  const [tests, setTests] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedLab, setSelectedLab] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [testsRes, labsRes] = await Promise.all([API.get("/labs/tests"), API.get("/labs")]);
      setTests(testsRes.data);
      setLabs(labsRes.data);
    } catch { setSnack("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!name || !price || !selectedLab) { setSnack("Fill all fields"); return; }
    setSaving(true);
    try {
      await API.post("/labs/tests", { name, price: parseFloat(price), labId: selectedLab._id });
      setVisible(false); setName(""); setPrice(""); setSelectedLab(null);
      loadData(); setSnack("Test added!");
    } catch (e) { setSnack(e.response?.data?.message || "Error adding test"); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Tests</Text>
      </View>

      {loading ? <ActivityIndicator animating style={{ marginTop: 40 }} /> : (
        <FlatList
          data={tests}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.row}>
                <View>
                  <Text style={styles.testName}>{item.name}</Text>
                  <Text style={styles.testSub}>{item.lab?.name} · {item.lab?.labPercentage}% lab share</Text>
                </View>
                <Text style={styles.price}>₹{item.price}</Text>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No tests added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Add New Test</Text>
          <TextInput label="Test Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Price (₹)" value={price} onChangeText={setPrice} mode="outlined" keyboardType="numeric" style={styles.input} />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)} style={styles.input} contentStyle={{ justifyContent: "flex-start" }}>
                {selectedLab ? selectedLab.name : "Select Lab"}
              </Button>
            }
          >
            {labs.map(lab => (
              <Menu.Item key={lab._id} onPress={() => { setSelectedLab(lab); setMenuVisible(false); }} title={lab.name} />
            ))}
          </Menu>
          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 12 }}>Add Test</Button>
          <Button mode="text" onPress={() => setVisible(false)} style={{ marginTop: 4 }}>Cancel</Button>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={() => setVisible(true)} label="Add Test" />
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: { padding: 16, backgroundColor: "#fff", elevation: 2 },
  title: { fontSize: 20, fontWeight: "bold", color: "#6200ee" },
  card: { borderRadius: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  testName: { fontSize: 15, fontWeight: "600", color: "#212121" },
  testSub: { fontSize: 12, color: "#757575", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "700", color: "#1e88e5" },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 40, fontSize: 15 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#6200ee" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
});
