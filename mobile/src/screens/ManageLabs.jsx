import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, FAB, Portal, Modal, TextInput, Button, Card, Snackbar, ActivityIndicator } from "react-native-paper";
import API from "../utils/api";

export default function ManageLabs({ navigation }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");

  const loadLabs = useCallback(async () => {
    try {
      const res = await API.get("/labs");
      setLabs(res.data);
    } catch { setSnack("Failed to load labs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLabs(); }, [loadLabs]);

  const handleAdd = async () => {
    if (!name || !percentage) { setSnack("Fill all fields"); return; }
    setSaving(true);
    try {
      await API.post("/labs", { name, labPercentage: parseFloat(percentage) });
      setVisible(false); setName(""); setPercentage("");
      loadLabs(); setSnack("Lab added!");
    } catch (e) { setSnack(e.response?.data?.message || "Error adding lab"); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Labs</Text>
        <Button mode="text" onPress={() => navigation.navigate("ManageTests")} icon="flask">Tests</Button>
      </View>

      {loading ? <ActivityIndicator animating style={{ marginTop: 40 }} /> : (
        <FlatList
          data={labs}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.row}>
                <View>
                  <Text style={styles.labName}>{item.name}</Text>
                  <Text style={styles.labSub}>Commission: {item.labPercentage}%</Text>
                </View>
                <Text style={[styles.balance, { color: item.balance > 0 ? "#e53935" : "#43a047" }]}>
                  {item.balance > 0 ? `Owe ₹${item.balance.toFixed(2)}` : "Clear ✓"}
                </Text>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No labs added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Add New Lab</Text>
          <TextInput label="Lab Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Lab Percentage (%)" value={percentage} onChangeText={setPercentage} mode="outlined" keyboardType="numeric" style={styles.input} />
          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 8 }}>Add Lab</Button>
          <Button mode="text" onPress={() => setVisible(false)} style={{ marginTop: 4 }}>Cancel</Button>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={() => setVisible(true)} label="Add Lab" />
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", elevation: 2 },
  title: { fontSize: 20, fontWeight: "bold", color: "#6200ee" },
  card: { borderRadius: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labName: { fontSize: 16, fontWeight: "600", color: "#212121" },
  labSub: { fontSize: 13, color: "#757575", marginTop: 2 },
  balance: { fontWeight: "700", fontSize: 14 },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 40, fontSize: 15 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#6200ee" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
});
