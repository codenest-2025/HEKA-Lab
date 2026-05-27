import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

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

// Agent Screens
import AgentDashboard from "../screens/AgentDashboard";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
          };
          return <Icon name={icons[route.name] || "circle"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={AdminDashboard} />
      <Tab.Screen name="Labs" component={AdminLabStack} />
      <Tab.Screen name="Centers" component={AdminCenterStack} />
      <Tab.Screen name="People" component={AdminPeopleStack} />
      <Tab.Screen name="Finance" component={SettlePayments} />
    </Tab.Navigator>
  );
}

function AdminLabStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManageLabsAndTests" component={ManageLabsAndTests} />
    </Stack.Navigator>
  );
}

function AdminCenterStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManageCenters" component={ManageCenters} />
    </Stack.Navigator>
  );
}

function AdminPeopleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagePeople" component={ManagePeople} />
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
            "New Booking": "plus-circle",
            History: "history",
          };
          return <Icon name={icons[route.name] || "circle"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={StaffDashboard} />
      <Tab.Screen name="New Booking" component={NewBooking} />
      <Tab.Screen name="History" component={BookingList} />
    </Tab.Navigator>
  );
}

function AgentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgentDashboard" component={AgentDashboard} />
    </Stack.Navigator>
  );
}

export default function RoleNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {user?.role === "admin" ? (
        <AdminTabs />
      ) : user?.role === "agent" ? (
        <AgentStack />
      ) : (
        <StaffTabs />
      )}
    </NavigationContainer>
  );
}
