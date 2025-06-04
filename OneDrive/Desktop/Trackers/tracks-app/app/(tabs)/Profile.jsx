import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { getLocalStorage, removeFromLocalStorage } from "../../service/Storage";

export default function Profile() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    displayName: "",
    email: "",
  });
  const [logoutMsg, setLogoutMsg] = useState("");

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const info = await getLocalStorage("userDetail");
        if (info) {
          const parsedInfo = typeof info === "string" ? JSON.parse(info) : info;
          setUserInfo(parsedInfo);
        }
      } catch (error) {
        console.error("Error loading user info:", error);
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await removeFromLocalStorage("userDetail");
      setLogoutMsg("You have been logged out.");
      console.log("Logout successful");
      router.replace("/login"); // Redirect to login screen
    } catch (error) {
      setLogoutMsg("Logout failed. Please try again.");
      console.error("Logout error:", error);
      alert("Logout error: " + error?.message || error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/smile4.jpg")}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.greeting}>
            Hello, {userInfo?.displayName || "Friend"} 👋
          </Text>
          <Text style={styles.subtitle}>Welcome to Health Tracker</Text>
          <Text style={styles.email}>{userInfo?.email || ""}</Text>
        </View>
      </View>

      {logoutMsg ? (
        <View style={{ padding: 16, alignItems: "center" }}>
          <Text style={{ color: "red", fontSize: 16 }}>{logoutMsg}</Text>
        </View>
      ) : null}

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/add-new-medication")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#e6f0ff" }]}>
            <Ionicons name="add-circle-outline" size={24} color="#007BFF" />
          </View>
          <Text style={styles.menuText}>Add New Medication</Text>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#e6f0ff" }]}>
            <Ionicons name="medical-outline" size={24} color="#007BFF" />
          </View>
          <Text style={styles.menuText}>My Medications</Text>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/History")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#e6f0ff" }]}>
            <Ionicons name="time-outline" size={24} color="#007BFF" />
          </View>
          <Text style={styles.menuText}>History</Text>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#fff5f5" }]}>
            <Ionicons name="log-out-outline" size={24} color="#ff4757" />
          </View>
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={24} color="#ff4757" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6faff",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#e6f0ff",
  },
  profileInfo: {
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: "#222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Outfit-Medium",
    color: "#007BFF",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    color: "#666",
    marginBottom: 20,
  },
  menuContainer: {
    padding: 20,
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    color: "#333",
  },
  logoutButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ffecee",
  },
  logoutText: {
    color: "#ff4757",
  },
});