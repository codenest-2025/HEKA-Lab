import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Platform, StatusBar } from "react-native";
import {
  Text, FAB, Portal, Modal, TextInput, Button, Card,
  Snackbar, ActivityIndicator, Menu, SegmentedButtons
} from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import API from "../utils/api";

export default function ManageLabsAndTests() {
  const [activeTab, setActiveTab] = useState("labs"); // "labs" or "tests"

  // Lists
  const [labs, setLabs] = useState([]);
  const [tests, setTests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState(""); // Only for Lab
  const [price, setPrice] = useState(""); // Only for Test
  const [selectedLab, setSelectedLab] = useState(null); // Only for Test

  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [labsRes, testsRes] = await Promise.all([
        API.get("/labs"),
        API.get("/labs/tests")
      ]);
      setLabs(labsRes.data);
      setTests(testsRes.data);
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
    if (activeTab === "labs") {
      if (!name || !percentage) {
        setSnack("Fill all fields");
        return;
      }
    } else {
      if (!name || !price || !selectedLab) {
        setSnack("Fill all fields");
        return;
      }
    }

    setSaving(true);
    try {
      if (activeTab === "labs") {
        await API.post("/labs", {
          name,
          labPercentage: parseFloat(percentage)
        });
        setSnack("Lab added!");
      } else {
        await API.post("/labs/tests", {
          name,
          price: parseFloat(price),
          labId: selectedLab._id
        });
        setSnack("Test added!");
      }
      setVisible(false);
      setName("");
      setPercentage("");
      setPrice("");
      setSelectedLab(null);
      loadData();
    } catch (e) {
      setSnack(e.response?.data?.message || "Error adding item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Labs & Tests</Text>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          style={styles.toggle}
          buttons={[
            { value: "labs", label: "Labs", icon: "hospital-building" },
            { value: "tests", label: "Tests", icon: "flask" }
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator animating style={{ marginTop: 40 }} />
      ) : activeTab === "labs" ? (
        <FlatList
          data={labs}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.listContainer}
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
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.row}>
                <View>
                  <Text style={styles.labName}>{item.name}</Text>
                  <Text style={styles.labSub}>{item.lab?.name} · {item.lab?.labPercentage}% share</Text>
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
          <Text style={styles.modalTitle}>
            {activeTab === "labs" ? "Add New Lab" : "Add New Test"}
          </Text>
          <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />

          {activeTab === "labs" ? (
            <TextInput
              label="Lab Share Percentage (%)"
              value={percentage}
              onChangeText={setPercentage}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          ) : (
            <>
              <TextInput
                label="Price (₹)"
                value={price}
                onChangeText={setPrice}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
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
                    {selectedLab ? selectedLab.name : "Select Lab"}
                  </Button>
                }
              >
                {labs.map((lab) => (
                  <Menu.Item
                    key={lab._id}
                    onPress={() => {
                      setSelectedLab(lab);
                      setMenuVisible(false);
                    }}
                    title={lab.name}
                  />
                ))}
              </Menu>
            </>
          )}

          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 12 }}>
            {activeTab === "labs" ? "Add Lab" : "Add Test"}
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
        label={activeTab === "labs" ? "Add Lab" : "Add Test"}
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
  labName: { fontSize: 16, fontWeight: "600", color: "#212121" },
  labSub: { fontSize: 13, color: "#757575", marginTop: 2 },
  balance: { fontWeight: "700", fontSize: 14 },
  price: { fontSize: 16, fontWeight: "700", color: "#1e88e5" },
  empty: { textAlign: "center", color: "#9e9e9e", marginTop: 40, fontSize: 15 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#6200ee" },
  modal: { backgroundColor: "#fff", margin: 24, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#212121" },
  input: { marginBottom: 12 }
});
