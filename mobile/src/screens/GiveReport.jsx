import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Platform } from "react-native";
import { Text, Card, Searchbar, Switch, ActivityIndicator, Snackbar, Divider, Button } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import API from "../utils/api";

export default function GiveReport() {
  const { user, selectedCenter } = useAuth();
  const socket = useSocket();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(new Date());
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/bookings?`;
      if (selectedCenter) {
        url += `centerId=${selectedCenter._id}&`;
      }
      if (searchQuery.trim()) {
        url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      }
      if (isDateFilterActive) {
        const formattedDate = filterDate.toISOString().split("T")[0];
        url += `date=${formattedDate}&`;
      }
      const res = await API.get(url);
      setBookings(res.data);
    } catch (e) {
      setSnack("Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCenter, searchQuery, filterDate, isDateFilterActive]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      loadBookings();
    };
    socket.on("bookingCreated", handleUpdate);
    socket.on("bookingUpdated", handleUpdate);
    return () => {
      socket.off("bookingCreated", handleUpdate);
      socket.off("bookingUpdated", handleUpdate);
    };
  }, [socket, loadBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilterDate(selectedDate);
      setIsDateFilterActive(true);
    }
  };

  const handleToggleReport = async (bookingId, currentVal) => {
    try {
      await API.patch(`/bookings/${bookingId}/report-status`, {
        giveReportToPatient: !currentVal,
      });
      setSnack(`Report preference updated to ${!currentVal ? "Give" : "Don't Give"}!`);
    } catch {
      setSnack("Failed to update report preference");
    }
  };

  const renderBookingItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Icon name="account" size={20} color="#0e6655" />
            <Text style={styles.patientName}>{item.patient?.name}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>

        <Text style={styles.patientSub}>
          {item.patient?.age} yrs · {item.patient?.gender} · {item.patient?.phone}
        </Text>

        <Divider style={{ marginVertical: 8 }} />

        {/* Tests */}
        <View style={styles.testsList}>
          {item.tests?.map((t, idx) => (
            <View key={idx} style={styles.testRow}>
              <Icon name="flask-outline" size={13} color="#1e88e5" />
              <Text style={styles.testName}>{t.name}</Text>
            </View>
          ))}
        </View>

        <Divider style={{ marginVertical: 8 }} />

        {/* Action Row */}
        <View style={styles.actionRow}>
          <View style={styles.actionLeft}>
            <Icon
              name={item.giveReportToPatient ? "file-check-outline" : "file-remove-outline"}
              size={18}
              color={item.giveReportToPatient ? "#2e7d32" : "#c62828"}
            />
            <Text
              style={[
                styles.actionText,
                { color: item.giveReportToPatient ? "#2e7d32" : "#c62828" },
              ]}
            >
              {item.giveReportToPatient ? "Give Report to Patient" : "Do Not Give to Patient"}
            </Text>
          </View>
          <Switch
            value={item.giveReportToPatient}
            onValueChange={() => handleToggleReport(item._id, item.giveReportToPatient)}
            color="#0e6655"
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.filterSection}>
        <Searchbar
          placeholder="Search patient name..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        <View style={styles.dateSelectorRow}>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateBtn}
            textColor="#0e6655"
          >
            {isDateFilterActive
              ? filterDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : "Select Date"}
          </Button>

          {isDateFilterActive && (
            <Button
              mode="text"
              icon="calendar-remove"
              onPress={() => setIsDateFilterActive(false)}
              textColor="#c62828"
            >
              Clear Date
            </Button>
          )}
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={filterDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}

      {loading && bookings.length === 0 ? (
        <ActivityIndicator animating size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="file-search-outline" size={56} color="#bdbdbd" />
              <Text style={styles.emptyText}>No matching bookings found.</Text>
            </View>
          }
        />
      )}

      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={2500}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  filterSection: { padding: 16, backgroundColor: "#fff", gap: 10, elevation: 2, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  searchBar: { elevation: 0, backgroundColor: "#f4f6f8", borderRadius: 10, height: 44 },
  searchInput: { fontSize: 14, minHeight: 44 },
  dateSelectorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateBtn: { borderColor: "#0e6655", flex: 1, marginRight: 8 },
  listContainer: { padding: 16, gap: 12 },
  card: { borderRadius: 14, backgroundColor: "#fff", elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#212121" },
  patientSub: { fontSize: 12, color: "#757575", marginTop: 2, marginLeft: 26 },
  dateText: { fontSize: 12, color: "#9e9e9e" },
  testsList: { paddingLeft: 26, gap: 4 },
  testRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  testName: { fontSize: 13, color: "#424242" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingLeft: 26 },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 13, fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#bdbdbd" },
});
