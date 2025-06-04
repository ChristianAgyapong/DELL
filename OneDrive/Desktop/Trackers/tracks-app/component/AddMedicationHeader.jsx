import { View, Text,Image ,TouchableOpacity} from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';

export default function AddMedicationHeader() {
    const router = useRouter();

  return (
    <View>
      <Image source={require('../assets/images/smile3.jpg')} style={{
         width: '100%',
          height: 350 }} />

        <TouchableOpacity style={{
          position: 'absolute',
          padding: 20,
        }}
        
        onPress={() => router.back()} // Use router.back() to navigate back
        >
          <AntDesign name="back" size={24} color="black" />
        </TouchableOpacity>

    </View>
  )
}