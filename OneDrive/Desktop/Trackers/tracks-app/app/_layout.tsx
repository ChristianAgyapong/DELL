import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getLocalStorage } from "../service/Storage";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userInfo = await getLocalStorage("userDetail");
        if (!userInfo) {
          router.replace("/login"); // Redirect to login if not authenticated
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/login");
      }
    };

    checkAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-new-medication"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Add Medication",
        }}
      />
      <Stack.Screen
        name="action-modal"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}