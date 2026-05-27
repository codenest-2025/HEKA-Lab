import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RoleNavigator from "./src/navigation/RoleNavigator";
import { paperTheme } from "./src/theme/theme";

function AppContent() {
  const { user, booting } = useAuth();

  if (booting) {
    return null;
  }

  return user ? <RoleNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PaperProvider>
  );
}
