import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons'; // Add this import
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getLocalStorage, removeFromLocalStorage } from '../service/Storage';

export default function Header({ title = 'Health Tracker' }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await removeFromLocalStorage('userDetail');
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const loadUserName = async () => {
      const user = await getLocalStorage('userDetail');
      if (user?.displayName) {
        setDisplayName(user.displayName);
      }
    };
    loadUserName();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.greetingRow}>
          <FontAwesome name="star-half-full" size={20} color="yellow" style={styles.icon} />
          <Text style={styles.greeting}>Hello, {displayName || 'User'} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/add-new-medication')}>
          <Ionicons name="medkit-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3D85C6',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  greeting: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Outfit-Regular',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
});
