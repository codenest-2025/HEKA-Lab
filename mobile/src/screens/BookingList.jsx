import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Platform } from "react-native";
import { Text, Card, Chip, ActivityIndicator, Snackbar, Divider, Searchbar, Button } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import API from "../utils/api";

function InfoRow({ icon, label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={14} color={color || "#757575"} style={{ marginTop: 1 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

export default function BookingList() {
  const { user, selectedCenter, refreshTick } = useAuth();
  const socket = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(new Date());
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
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
    } catch { setSnack("Failed to load bookings"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedCenter, searchQuery, filterDate, isDateFilterActive]);

  useEffect(() => { loadBookings(); }, [loadBookings, refreshTick]);

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

  const onRefresh = () => { setRefreshing(true); loadBookings(); };

  const toggleReportStatus = async (bookingId, currentVal) => {
    try {
      await API.patch(`/bookings/${bookingId}/report-status`, {
        giveReportToPatient: !currentVal
      });
      setSnack("Report status updated!");
    } catch {
      setSnack("Failed to update report status");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilterDate(selectedDate);
      setIsDateFilterActive(true);
    }
  };

  const modeColor = (m) => m === "Cash" ? "#43a047" : "#1e88e5";
  const collectorColor = (c) => c === "Staff" ? "#9c27b0" : "#ff9800";

  const renderBooking = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Icon name="account-circle" size={20} color="#6200ee" />
            <Text style={styles.patientName}>{item.patient?.name}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
          </Text>
        </View>

        <Divider style={{ marginVertical: 8 }} />

        {/* Tests */}
        <View style={{ gap: 3, marginBottom: 8 }}>
          {item.tests?.map((t, i) => (
            <View key={i} style={styles.testRow}>
              <Icon name="flask-outline" size={13} color="#1e88e5" />
              <Text style={styles.testName}>{t.name}</Text>
              <Text style={styles.testPrice}>₹{t.price}</Text>
            </View>
          ))}
        </View>

        <Divider style={{ marginBottom: 8 }} />

        {/* Financial info */}
        <InfoRow icon="cash-multiple" label="Total" value={`₹${item.totalPrice?.toFixed(2)}`} color="#212121" />
        {user?.role !== "staff" && item.totalAgentCommission > 0 && (
          <InfoRow icon="account-tie" label="Agent Shares" value={`₹${item.totalAgentCommission?.toFixed(2)}`} color="#ff9800" />
        )}

        <Divider style={{ marginVertical: 8 }} />

        {/* Tags row */}
        <View style={styles.tagsRow}>
          <Chip compact icon="cash" textStyle={{ fontSize: 11, color: modeColor(item.paymentMode) }}
            style={{ backgroundColor: modeColor(item.paymentMode) + "22" }}>
            {item.paymentMode}
          </Chip>
          <Chip
            compact
            icon={item.giveReportToPatient ? "check-circle" : "close-circle"}
            textStyle={{ fontSize: 11, color: item.giveReportToPatient ? "#2e7d32" : "#c62828" }}
            style={{ backgroundColor: item.giveReportToPatient ? "#e8f5e9" : "#ffebee" }}
            onPress={
              (user?.role === "staff" || user?.role === "admin")
                ? () => toggleReportStatus(item._id, item.giveReportToPatient)
                : undefined
            }
          >
            {item.giveReportToPatient ? "Give Report" : "Don't Give"}
          </Chip>
          {user?.role !== "staff" && item.agents?.map((agentItem) => (
            <Chip compact icon="account-tie" textStyle={{ fontSize: 11, color: "#ff9800" }}
              key={agentItem.agent?._id || agentItem.agent || agentItem.name}
              style={{ backgroundColor: "#fff3e0" }}>
              {agentItem.name}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
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
              Clear
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
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={renderBooking}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="clipboard-text-off-outline" size={56} color="#bdbdbd" />
              <Text style={styles.emptyText}>No bookings found.</Text>
            </View>
          }
        />
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  searchSection: { padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  searchBar: { elevation: 0, backgroundColor: "#f4f6f8", borderRadius: 10, height: 44 },
  searchInput: { fontSize: 14, minHeight: 44 },
  dateSelectorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  dateBtn: { borderColor: "#0e6655", flex: 1, marginRight: 8 },

  card: { borderRadius: 14, backgroundColor: "#fff" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#212121" },
  dateText: { fontSize: 12, color: "#9e9e9e" },
  testRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  testName: { flex: 1, fontSize: 13, color: "#424242" },
  testPrice: { fontSize: 13, fontWeight: "600", color: "#0e6655" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  infoLabel: { flex: 1, fontSize: 13, color: "#757575" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#212121" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  emptyContainer: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#bdbdbd" },
  emptySub: { fontSize: 13, color: "#bdbdbd", textAlign: "center" },
});
