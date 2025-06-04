import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { setLocalStorage, getLocalStorage } from "../../service/Storage";
import { Image, SafeAreaView, ActivityIndicator, useWindowDimensions } from "react-native";
import * as Animatable from "react-native-animatable";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Colors from "../../constant/Colors";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [imageLoading, setImageLoading] = useState(true);

  const handleLogin = async () => {
    try {
      const hasSignedUp = await getLocalStorage("hasSignedUp"); // Check if the user has signed up
      if (hasSignedUp) {
        router.replace("/login/signIn"); // Navigate to the sign-in page
      } else {
        router.replace("/login/signUp"); // Navigate to the sign-up page
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated image container */}
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.imageWrapper}>
        {imageLoading && (
          <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />
        )}
        <Image
          source={require("../../assets/images/log1.jpg")}
          style={[styles.image, { width: width * 0.98 }]}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
          accessibilityLabel="Health Tracker App Banner"
        />
      </Animatable.View>

      {/* Animated bottom content */}
      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        delay={200}
        style={styles.bottomSection}
      >
        <MaterialIcons
          name="track-changes"
          size={28}
          color="white"
          style={styles.iconTop}
          accessibilityLabel="Track your progress icon"
        />

        <Text style={styles.heading}>Stay on Track, Stay Healthy!</Text>

        <View style={styles.subIconRow}>
          <FontAwesome5
            name="pills"
            size={18}
            color="white"
            style={styles.smallIcon}
            accessibilityLabel="Medication icon"
          />
          <Text style={styles.subheading}>
            Track your meds, take control of your health. Stay consistent, stay confident.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue to sign-up or sign-in screen"
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          <MaterialIcons name="info" size={14} color="white" /> By clicking Continue, you agree to
          our terms and conditions.
        </Text>
      </Animatable.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
    backgroundColor: "#fff",
    position: "relative",
  },
  loader: {
    position: "absolute",
    zIndex: 1,
  },
  image: {
    height: "100%",
    resizeMode: "contain",
    borderRadius: 20,
  },
  bottomSection: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: "center",
  },
  iconTop: {
    marginBottom: 15,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subIconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 15,
  },
  smallIcon: {
    marginTop: 3,
  },
  subheading: {
    fontSize: 16,
    color: "white",
    textAlign: "left",
    lineHeight: 22,
    flex: 1,
  },
  button: {
    marginTop: 25,
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 99,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  note: {
    color: "white",
    marginTop: 12,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    maxWidth: "90%",
  },
});
