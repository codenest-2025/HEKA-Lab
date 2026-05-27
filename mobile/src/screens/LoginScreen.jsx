import React, { useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, StatusBar, TouchableOpacity } from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const Logo = () => (
  <View style={logoStyles.circle}>
    <View style={logoStyles.darkBox}>
      {/* Medical Cross */}
      <View style={logoStyles.crossContainer}>
        <View style={logoStyles.verticalBar} />
        <View style={logoStyles.horizontalBar} />
        {/* Golden Leaf at Center */}
        <View style={logoStyles.leafWrapper}>
          <Icon name="leaf" size={16} color="#f4c430" />
        </View>
      </View>
    </View>
  </View>
);

const logoStyles = StyleSheet.create({
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 16,
    alignSelf: "center",
  },
  darkBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#03352b",
    justifyContent: "center",
    alignItems: "center",
  },
  crossContainer: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  verticalBar: {
    position: "absolute",
    width: 10,
    height: 34,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  horizontalBar: {
    position: "absolute",
    width: 34,
    height: 10,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  leafWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  }
});

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
      <StatusBar barStyle="light-content" backgroundColor="#005c4b" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Logo />
          <Text style={styles.title}>Heka</Text>
          <Text style={styles.subtitle}>Lab</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="account" iconColor="#005c4b" />}
            theme={{ roundness: 20 }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#005c4b"
            textColor="#1a202c"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="lock" iconColor="#005c4b" />}
            theme={{ roundness: 20 }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#005c4b"
            textColor="#1a202c"
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
            buttonColor="#005c4b"
          >
            Sign In
          </Button>

          <TouchableOpacity onPress={() => setErrorMsg("Please contact your administrator to reset password.")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#005c4b"
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.8
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 4
  },
  card: {
    backgroundColor: "#f5f7f8",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a202c",
    textAlign: "center"
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#ffffff"
  },
  button: {
    marginTop: 8,
    borderRadius: 20,
    shadowColor: "#005c4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4
  },
  buttonContent: {
    height: 48
  },
  errorText: {
    textAlign: "center",
    marginBottom: 12
  },
  forgotText: {
    color: "#718096",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 16
  }
});
