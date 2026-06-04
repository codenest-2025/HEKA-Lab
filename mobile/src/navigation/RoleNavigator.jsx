import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Shared
import AppHeader from "../components/AppHeader";

// Admin Screens
import AdminDashboard from "../screens/AdminDashboard";
import ManageLabsAndTests from "../screens/ManageLabsAndTests";
import ManageCenters from "../screens/ManageCenters";
import ManagePeople from "../screens/ManagePeople";
import SettlePayments from "../screens/SettlePayments";

// Staff Screens
import StaffDashboard from "../screens/StaffDashboard";
import NewBooking from "../screens/NewBooking";
import BookingList from "../screens/BookingList";
import ManagePatients from "../screens/ManagePatients";
import GiveReport from "../screens/GiveReport";

// Agent Screens
import AgentDashboard from "../screens/AgentDashboard";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Helper: returns the header config for a given screen title
function withAppHeader(title) {
  return {
    headerShown: true,
    header: () => <AppHeader title={title} />,
  };
}

function AdminTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#9e9e9e",
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e0e0e0", paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "view-dashboard",
            Labs: "flask",
            Centers: "hospital-building",
            People: "account-group",
            Finance: "cash-multiple",
            History: "history",
          };
          return <Icon name={icons[route.name] || "circle"} size={size} color={color} />;
        },
      })}
    >
      {/* Dashboard — no global header (has its own gradient header) */}
      <Tab.Screen name="Home" component={AdminDashboard} options={{ headerShown: false }} />
      <Tab.Screen name="Labs" component={AdminLabStack} options={{ headerShown: false }} />
      <Tab.Screen name="Centers" component={AdminCenterStack} options={{ headerShown: false }} />
      <Tab.Screen name="People" component={AdminPeopleStack} options={{ headerShown: false }} />
      <Tab.Screen name="Finance" component={SettlePayments} options={withAppHeader("Financial Settlements")} />
      <Tab.Screen name="History" component={BookingList} options={withAppHeader("Booking History")} />
    </Tab.Navigator>
  );
}

function AdminLabStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManageLabsAndTests"
        component={ManageLabsAndTests}
        options={withAppHeader("Labs & Tests")}
      />
    </Stack.Navigator>
  );
}

function AdminCenterStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManageCenters"
        component={ManageCenters}
        options={withAppHeader("Manage Centers")}
      />
    </Stack.Navigator>
  );
}

function AdminPeopleStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManagePeople"
        component={ManagePeople}
        options={withAppHeader("User Management")}
      />
    </Stack.Navigator>
  );
}

function StaffTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#9e9e9e",
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e0e0e0", paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: "home",
            Patients: "account-multiple-outline",
            "New Booking": "plus-circle",
            History: "history",
          };
          return <Icon name={icons[route.name] || "circle"} size={size} color={color} />;
        },
      })}
    >
      {/* Dashboard — no global header */}
      <Tab.Screen name="Dashboard" component={StaffDashboard} options={{ headerShown: false }} />
      <Tab.Screen name="Patients" component={ManagePatients} options={withAppHeader("Patients")} />
      <Tab.Screen name="New Booking" component={NewBooking} options={withAppHeader("New Booking")} />
      <Tab.Screen name="History" component={BookingList} options={withAppHeader("Booking History")} />
    </Tab.Navigator>
  );
}

function StaffStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StaffTabs" component={StaffTabs} options={{ headerShown: false }} />
      <Stack.Screen name="GiveReport" component={GiveReport} options={withAppHeader("Give Report")} />
    </Stack.Navigator>
  );
}

function AgentTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#9e9e9e",
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e0e0e0", paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "view-dashboard",
            History: "history",
          };
          return <Icon name={icons[route.name] || "circle"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={AgentDashboard} options={{ headerShown: false }} />
      <Tab.Screen name="History" component={BookingList} options={withAppHeader("Booking History")} />
    </Tab.Navigator>
  );
}

export default function RoleNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {user?.role === "admin" ? (
        <AdminTabs />
      ) : user?.role === "agent" ? (
        <AgentTabs />
      ) : (
        <StaffStack />
      )}
    </NavigationContainer>
  );
}
