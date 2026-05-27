import React, { useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { TextInput, Button, Text, Surface, HelperText } from "react-native-paper";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg("Please enter both username and password");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Surface style={styles.card} elevation={4}>
          <Text style={styles.title} variant="headlineLarge">
            Lab Ledger
          </Text>
          <Text style={styles.subtitle} variant="bodyMedium">
            Sign in to manage labs, commissions, and collections
          </Text>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
          />

          {errorMsg ? (
            <HelperText type="error" visible={!!errorMsg} style={styles.errorText}>
              {errorMsg}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Login
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8"
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff"
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#6200ee",
    marginBottom: 8
  },
  subtitle: {
    textAlign: "center",
    color: "#757575",
    marginBottom: 24
  },
  input: {
    marginBottom: 16
  },
  button: {
    marginTop: 8,
    borderRadius: 8
  },
  buttonContent: {
    paddingVertical: 6
  },
  errorText: {
    textAlign: "center",
    marginBottom: 12
  }
});
