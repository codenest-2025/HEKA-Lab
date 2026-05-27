import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Platform, StatusBar } from "react-native";
import { Text, FAB, Portal, Modal, TextInput, Button, Card, Snackbar, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import API from "../utils/api";

export default function ManageCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");

  const loadCenters = useCallback(async () => {
    try {
      const res = await API.get("/centers");
      setCenters(res.data);
    } catch { setSnack("Failed to load centers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCenters(); }, [loadCenters]);

  const handleAdd = async () => {
    if (!name || !location) { setSnack("Fill all fields"); return; }
    setSaving(true);
    try {
      await API.post("/centers", { name, location });
      setVisible(false); setName(""); setLocation("");
      loadCenters(); setSnack("Center added!");
    } catch (e) { setSnack(e.response?.data?.message || "Error adding center"); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Centers</Text>
      </View>

      {loading ? <ActivityIndicator animating style={{ marginTop: 40 }} /> : (
        <FlatList
          data={centers}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.row}>
                <Icon name="hospital-building" size={22} color="#1e88e5" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.centerName}>{item.name}</Text>
                  <Text style={styles.centerSub}>{item.location}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No centers added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Add New Center</Text>
          <TextInput label="Center Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Location" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 8 }}>Add Center</Button>
          <Button mode="text" onPress={() => setVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={() => setVisible(true)} label="Add Center" />
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>{snack}</Snackbar>
    </View>
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
  card: { borderRadius: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  centerName: { fontSize: 15, fontWeight: "600", color: "#212121" },
  centerSub: { fontSize: 12, color: "#757575", marginTop: 2 },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 40, fontSize: 15 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#6200ee" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
});
