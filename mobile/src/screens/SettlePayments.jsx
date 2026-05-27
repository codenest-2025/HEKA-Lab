import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Card, Button, TextInput, Snackbar, ActivityIndicator, SegmentedButtons, Menu, Divider } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import API from "../utils/api";

export default function SettlePayments() {
  const [agents, setAgents] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("AgentToAdmin");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [agentMenuVisible, setAgentMenuVisible] = useState(false);
  const [labMenuVisible, setLabMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState("");
  const [history, setHistory] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [agRes, labRes, payRes] = await Promise.all([
        API.get("/auth/agents"),
        API.get("/labs"),
        API.get("/payments"),
      ]);
      setAgents(agRes.data);
      setLabs(labRes.data);
      setHistory(payRes.data);
    } catch { setSnack("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSettle = async () => {
    if (!amount || parseFloat(amount) <= 0) { setSnack("Enter a valid amount"); return; }
    if ((type === "AgentToAdmin" || type === "AdminToAgent") && !selectedAgent) { setSnack("Select an agent"); return; }
    if (type === "AdminToLab" && !selectedLab) { setSnack("Select a lab"); return; }
    setSaving(true);
    try {
      await API.post("/payments", {
        type,
        agentId: selectedAgent?._id,
        labId: selectedLab?._id,
        amount: parseFloat(amount),
        paymentMode,
        notes,
      });
      setAmount(""); setNotes(""); setSelectedAgent(null); setSelectedLab(null);
      loadData(); setSnack("Payment recorded!");
    } catch (e) { setSnack(e.response?.data?.message || "Error recording payment"); }
    finally { setSaving(false); }
  };

  const typeLabels = { AgentToAdmin: "Agent → Admin", AdminToAgent: "Admin → Agent", AdminToLab: "Admin → Lab" };
  const typeColors = { AgentToAdmin: "#e53935", AdminToAgent: "#43a047", AdminToLab: "#1e88e5" };
  const typeIcons = { AgentToAdmin: "arrow-down-circle", AdminToAgent: "arrow-up-circle", AdminToLab: "flask" };

  return (
    <ScrollView style={styles.container}>
      {loading ? <ActivityIndicator animating style={{ margin: 40 }} /> : (
        <View style={{ padding: 16 }}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionLabel}>Payment Type</Text>
              <SegmentedButtons
                value={type}
                onValueChange={setType}
                buttons={[
                  { value: "AgentToAdmin", label: "Agent→Admin" },
                  { value: "AdminToAgent", label: "Admin→Agent" },
                  { value: "AdminToLab", label: "Admin→Lab" },
                ]}
                style={{ marginBottom: 16 }}
              />

              {(type === "AgentToAdmin" || type === "AdminToAgent") && (
                <Menu
                  visible={agentMenuVisible}
                  onDismiss={() => setAgentMenuVisible(false)}
                  anchor={
                    <Button mode="outlined" onPress={() => setAgentMenuVisible(true)} style={styles.input} contentStyle={{ justifyContent: "flex-start" }}>
                      {selectedAgent ? `${selectedAgent.name} (Balance: ${selectedAgent.balance?.toFixed(2)})` : "Select Agent"}
                    </Button>
                  }
                >
                  {agents.map(a => (
                    <Menu.Item key={a._id} onPress={() => { setSelectedAgent(a); setAgentMenuVisible(false); }}
                      title={`${a.name} — Bal: ${a.balance?.toFixed(2)}`} />
                  ))}
                </Menu>
              )}

              {type === "AdminToLab" && (
                <Menu
                  visible={labMenuVisible}
                  onDismiss={() => setLabMenuVisible(false)}
                  anchor={
                    <Button mode="outlined" onPress={() => setLabMenuVisible(true)} style={styles.input} contentStyle={{ justifyContent: "flex-start" }}>
                      {selectedLab ? `${selectedLab.name} (Owed: ₹${selectedLab.balance?.toFixed(2)})` : "Select Lab"}
                    </Button>
                  }
                >
                  {labs.map(l => (
                    <Menu.Item key={l._id} onPress={() => { setSelectedLab(l); setLabMenuVisible(false); }}
                      title={`${l.name} — Owed: ₹${l.balance?.toFixed(2)}`} />
                  ))}
                </Menu>
              )}

              <TextInput label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" mode="outlined" style={styles.input} />

              <Text style={styles.sectionLabel}>Payment Mode</Text>
              <SegmentedButtons
                value={paymentMode}
                onValueChange={setPaymentMode}
                buttons={[{ value: "Cash", label: "Cash" }, { value: "Bank", label: "Bank" }]}
                style={{ marginBottom: 12 }}
              />

              <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes} mode="outlined" style={styles.input} multiline numberOfLines={2} />
              <Button mode="contained" onPress={handleSettle} loading={saving} disabled={saving} style={{ borderRadius: 8 }}>Record Payment</Button>
            </Card.Content>
          </Card>

          <Text style={styles.historyTitle}>Recent Transactions</Text>
          {history.slice(0, 15).map(p => (
            <Card key={p._id} style={styles.historyCard}>
              <Card.Content style={styles.historyRow}>
                <Icon name={typeIcons[p.type]} size={22} color={typeColors[p.type]} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.historyType}>{typeLabels[p.type]}</Text>
                  <Text style={styles.historySub}>
                    {p.agent?.name || p.lab?.name || "—"} · {p.paymentMode}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </Text>
                </View>
                <Text style={[styles.historyAmount, { color: typeColors[p.type] }]}>₹{p.amount?.toFixed(2)}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3000}>{snack}</Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  card: { borderRadius: 12, marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#616161", marginBottom: 8, marginTop: 4 },
  input: { marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: "700", color: "#424242", marginBottom: 10 },
  historyCard: { borderRadius: 10, marginBottom: 8 },
  historyRow: { flexDirection: "row", alignItems: "center" },
  historyType: { fontSize: 13, fontWeight: "600", color: "#212121" },
  historySub: { fontSize: 12, color: "#757575" },
  historyAmount: { fontSize: 15, fontWeight: "700" },
});
