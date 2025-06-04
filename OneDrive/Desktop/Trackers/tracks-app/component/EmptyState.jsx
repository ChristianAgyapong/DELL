import { useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, Image } from 'react-native';
import ConstantString from '../constant/ConstantString';

export default function EmptyState() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={require('../assets/images/smile2.jpg')} style={{ width: 120, height: 120 }} />
      <Text style={{ fontSize: 35, marginTop: 30 }}>{ConstantString.NoMedication}</Text>
      <Text style={{ marginTop: 10 }}>{ConstantString.NoMedicationMessage}</Text>

      <TouchableOpacity
        onPress={() => router.push('/add-new-medication')}  // 👈 FLAT PATH
        style={{
          marginTop: 30,
          backgroundColor: '#007BFF',
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
          {ConstantString.NoMedicationButton}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
