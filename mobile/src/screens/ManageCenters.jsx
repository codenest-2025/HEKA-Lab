import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { Text, FAB, Portal, Modal, TextInput, Button, Card, Snackbar, ActivityIndicator, IconButton } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import API from "../utils/api";

export default function ManageCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  // Edit State
  const [editingCenter, setEditingCenter] = useState(null);

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

  const openAddModal = () => {
    setEditingCenter(null);
    setName("");
    setLocation("");
    setVisible(true);
  };

  const openEditModal = (center) => {
    setEditingCenter(center);
    setName(center.name);
    setLocation(center.location);
    setVisible(true);
  };

  const handleDeleteCenter = (centerId) => {
    Alert.alert(
      "Delete Center",
      "Are you sure you want to delete this center?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await API.delete(`/centers/${centerId}`);
              setSnack("Center deleted successfully!");
              loadCenters();
            } catch (e) {
              setSnack(e.response?.data?.message || "Error deleting center");
            }
          }
        }
      ]
    );
  };

  const handleAdd = async () => {
    if (!name || !location) { setSnack("Fill all fields"); return; }
    setSaving(true);
    try {
      if (editingCenter) {
        await API.put(`/centers/${editingCenter._id}`, { name, location });
        setSnack("Center updated!");
      } else {
        await API.post("/centers", { name, location });
        setSnack("Center added!");
      }
      setVisible(false); setName(""); setLocation(""); setEditingCenter(null);
      loadCenters();
    } catch (e) { setSnack(e.response?.data?.message || "Error saving center"); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>

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
                <View style={styles.actionsRow}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor="#0e6655"
                    onPress={() => openEditModal(item)}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#d32f2f"
                    onPress={() => handleDeleteCenter(item._id)}
                    style={styles.actionButton}
                  />
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No centers added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>{editingCenter ? "Edit Center" : "Add New Center"}</Text>
          <TextInput label="Center Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Location" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 8 }}>
            {editingCenter ? "Save Changes" : "Add Center"}
          </Button>
          <Button mode="text" onPress={() => setVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={openAddModal} label="Add Center" color="#fff" />
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  card: { borderRadius: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  centerName: { fontSize: 15, fontWeight: "600", color: "#212121" },
  centerSub: { fontSize: 12, color: "#757575", marginTop: 2 },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 40, fontSize: 15 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#0e6655" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  actionButton: { margin: 0, padding: 0 }
});
