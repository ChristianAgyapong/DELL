import { View, Text } from "react-native";
import React from "react";
import AddMedicationHeader from "../../component/AddMedicationHeader";
import AddMedicationForm from "../../component/AddMedicationForm";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

export default function AddNewMedication() {
  const router = useRouter();

  return (
    <ScrollView>
      <AddMedicationHeader />
      <AddMedicationForm />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 100,
        }}
      >
        <Text style={{ fontSize: 20 }}>Add New Medication</Text>
      </View>
    </ScrollView>
  );
}