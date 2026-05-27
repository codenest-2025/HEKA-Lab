import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text, Card, Button, Portal, Modal, TextInput, ActivityIndicator,
  Snackbar, Searchbar, SegmentedButtons
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import API from "../utils/api";

export default function ManagePatients({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog/Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Snackbar Notification
  const [snack, setSnack] = useState("");

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/bookings/patients");
      setPatients(res.data);
    } catch (e) {
      setSnack("Failed to load patients list");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

  const handleRegisterPatient = async () => {
    if (!name || !age || !phone) {
      setSnack("Please fill in all details");
      return;
    }
    setSaving(true);
    try {
      const res = await API.post("/bookings/patients", {
        name,
        age: parseInt(age, 10),
        gender,
        phone,
      });
      setSnack("Patient registered successfully!");
      setModalVisible(false);
      setName("");
      setAge("");
      setGender("Male");
      setPhone("");
      loadPatients();
    } catch (e) {
      setSnack(e.response?.data?.message || "Error registering patient");
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.phone?.includes(query)
    );
  });

  return (
    <View style={styles.container}>
      {/* Search + Register Button row */}
      <View style={styles.topBar}>
        <Searchbar
          placeholder="Search by name or phone..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Icon name="account-plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator animating style={{ marginTop: 80 }} size="large" color="#0e6655" />
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.avatar}>
                    <Icon
                      name={item.gender === "Female" ? "gender-female" : item.gender === "Male" ? "gender-male" : "gender-transgender"}
                      size={24}
                      color="#0e6655"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.patientName}>{item.name}</Text>
                    <Text style={styles.patientMeta}>
                      {item.age} yrs · {item.gender}
                    </Text>
                    <View style={styles.phoneRow}>
                      <Icon name="phone" size={14} color="#757575" />
                      <Text style={styles.patientPhone}>{item.phone}</Text>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    buttonColor="#0e6655"
                    style={styles.bookButton}
                    labelStyle={{ fontSize: 11, marginHorizontal: 8, marginVertical: 4 }}
                    compact
                    onPress={() => navigation.navigate("New Booking", { patient: item })}
                  >
                    Book Test
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchQuery ? "No patients matched your search." : "No patients registered yet."}
            </Text>
          }
          refreshing={loading}
          onRefresh={loadPatients}
        />
      )}

      {/* Register Patient Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Register New Patient</Text>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Gender</Text>
          <SegmentedButtons
            value={gender}
            onValueChange={setGender}
            style={styles.segmentedButtons}
            buttons={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleRegisterPatient}
            loading={saving}
            disabled={saving}
            style={styles.submitBtn}
            buttonColor="#0e6655"
          >
            Register Patient
          </Button>
          <Button
            mode="text"
            onPress={() => setModalVisible(false)}
            textColor="#757575"
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 1,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0e6655",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    borderRadius: 12,
    elevation: 3,
    backgroundColor: "#fff",
  },
  searchInput: {
    fontSize: 14,
  },
  card: {
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 1,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0f2f1",
    justifyContent: "center",
    alignItems: "center",
  },
  patientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212121",
  },
  patientMeta: {
    fontSize: 12,
    color: "#616161",
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  patientPhone: {
    fontSize: 12,
    color: "#757575",
  },
  bookButton: {
    borderRadius: 8,
    minWidth: 80,
  },
  empty: {
    textAlign: "center",
    color: "#9e9e9e",
    marginTop: 32,
    fontSize: 14,
  },
  modal: {
    backgroundColor: "#fff",
    margin: 24,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#212121",
  },
  input: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#616161",
    marginBottom: 6,
    fontWeight: "600",
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 8,
    borderRadius: 10,
  },
});
