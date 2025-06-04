import { View, Text } from 'react-native'
import React from 'react'
import AddMedicationHeader from '../../component/AddMedicationHeader'
import AddMedicationForm from '../../component/AddMedicationForm'
import { ScrollView } from 'react-native-gesture-handler'

export default function AddNewMedication() {
  return (
    <ScrollView>
      <AddMedicationHeader />
      <AddMedicationForm />
    </ScrollView>
  )
}