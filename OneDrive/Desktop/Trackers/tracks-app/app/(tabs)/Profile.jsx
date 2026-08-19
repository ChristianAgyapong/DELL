import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from "react-native";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        setIsLoading(true);
        const info = await getLocalStorage("userDetail");
        if (info) {
          const parsedInfo = typeof info === "string" ? JSON.parse(info) : info;
          setUserInfo(parsedInfo);
        }
      } catch (error) {
        console.error("Error loading user info:", error);
        Alert.alert("Error", "Failed to load user information. Please try again.");
      } finally {
        setIsLoading(false);
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

  const menuItems = [
    {
      title: "Add New Medication",
      icon: "add-circle-outline",
      route: "/add-new-medication",
      backgroundColor: "#e6f0ff",
      iconColor: "#007BFF",
    },
    {
      title: "My Medications",
      icon: "medical-outline",
      route: "/",
      backgroundColor: "#e6f0ff",
      iconColor: "#007BFF",
    },
    {
      title: "History",
      icon: "time-outline",
      route: "/(tabs)/History",
      backgroundColor: "#e6f0ff",
      iconColor: "#007BFF",
    },
  ];

  const handleMenuPress = (route) => {
    router.push(route);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={require("../../assets/images/smile4.jpg")}
            style={styles.avatar}
          />
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.greeting}>
            Hello, {userInfo?.displayName || "Friend"} 👋
          </Text>
          <Text style={styles.subtitle}>Welcome to Health Tracker</Text>
          {userInfo?.email && (
            <Text style={styles.email}>{userInfo.email}</Text>
          )}
        </View>
      </View>

      {logoutMsg ? (
        <View style={styles.messageContainer}>
          <Ionicons 
            name={logoutMsg.includes("failed") ? "alert-circle" : "checkmark-circle"} 
            size={20} 
            color={logoutMsg.includes("failed") ? "#ff4757" : "#2ed573"} 
          />
          <Text style={[
            styles.messageText,
            { color: logoutMsg.includes("failed") ? "#ff4757" : "#2ed573" }
          ]}>
            {logoutMsg}
          </Text>
        </View>
      ) : null}

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, styles.menuItemShadow]}
            onPress={() => handleMenuPress(item.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
              <Ionicons name={item.icon} size={24} color={item.iconColor} />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#007BFF" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton, styles.menuItemShadow]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#fff5f5" }]}>
            <Ionicons name="log-out-outline" size={24} color="#ff4757" />
          </View>
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color="#ff4757" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Health Tracker v1.0</Text>
        <Text style={styles.footerSubtext}>Stay healthy, stay happy! 💊</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fbff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    color: "#666",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#e6f0ff",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2ed573",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  profileInfo: {
    alignItems: "center",
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Outfit-Bold",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Outfit-Medium",
    color: "#007BFF",
    marginBottom: 8,
  },
  email: {
    fontSize: 15,
    fontFamily: "Outfit-Regular",
    color: "#666",
    marginBottom: 16,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    margin: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    marginLeft: 8,
  },
  menuContainer: {
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#1a1a1a",
    marginBottom: 16,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  menuItemShadow: {
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Outfit-SemiBold",
    color: "#1a1a1a",
  },
  logoutButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ffecee",
    backgroundColor: "#fffbfb",
  },
  logoutText: {
    color: "#ff4757",
  },
  footer: {
    alignItems: "center",
    padding: 24,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: "#999",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: "Outfit-Regular",
    color: "#bbb",
  },
});