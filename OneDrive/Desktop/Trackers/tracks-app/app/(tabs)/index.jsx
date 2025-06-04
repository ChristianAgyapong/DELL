import { View, ScrollView, Platform } from 'react-native';
import Header from '../../component/Header';
import EmptyState from '../../component/EmptyState';
import MedicationList from '../../component/MedicationList';

export default function Homescreen() {
  return (
    <ScrollView
      style={{
        backgroundColor: 'white',
        flex: 1,
      }}
      contentContainerStyle={{
        padding: 25,
        minHeight: '100%',
      }}
      showsVerticalScrollIndicator={false}
    >
      <Header />
      <MedicationList />
    </ScrollView>
  );
}

