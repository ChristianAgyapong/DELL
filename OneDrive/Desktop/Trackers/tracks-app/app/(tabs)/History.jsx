import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../component/EmptyState';
import { useRouter, useFocusEffect } from 'expo-router';

export default function History() {
  const router = useRouter();
  const [medHistory, setMedHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    taken: 0,
    missed: 0,
    adherenceRate: 0
  });

  // Fetch medication history
  const fetchMedicationHistory = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'medications'), orderBy('lastUpdated', 'desc'))
      );
      
      const meds = [];
      let totalActions = 0;
      let takenCount = 0;
      let missedCount = 0;

      querySnapshot.forEach((doc) => {
        const medData = { ...doc.data(), docId: doc.id };
        if (medData.actions && medData.actions.length > 0) {
          totalActions += medData.actions.length;
          takenCount += medData.actions.filter(a => a.status === 'taken').length;
          missedCount += medData.actions.filter(a => a.status === 'missed').length;
          meds.push(medData);
        }
      });

      setMedHistory(meds);
      setStatistics({
        total: totalActions,
        taken: takenCount,
        missed: missedCount,
        adherenceRate: totalActions > 0 ? ((takenCount / totalActions) * 100).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Error fetching medication history:', error);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMedicationHistory();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMedicationHistory().then(() => setRefreshing(false));
  }, []);

  const formatTime24to12 = (time24) => {
    if (!time24) return '';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f6faff' }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.headerText}>Medication History</Text>

        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.adherenceRate}%</Text>
            <Text style={styles.statLabel}>Adherence Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.taken}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.missed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </View>

        {/* History List */}
        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={medHistory}
            keyExtractor={item => item.docId}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#007BFF']}
                tintColor="#007BFF"
              />
            }
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <EmptyState
                title="No History"
                subtitle="No medication history available yet"
              />
            }
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <Image
                  source={item.type?.icon ? { uri: item.type.icon } : require('../../assets/images/smile4.jpg')}
                  style={styles.medIconSmall}
                />
                <View style={styles.historyContent}>
                  <Text style={styles.medName}>{item.name}</Text>
                  {item.actions && item.actions.map((action, index) => (
                    <View key={index} style={styles.actionRow}>
                      <Ionicons 
                        name={action.status === 'taken' ? 'checkmark-circle' : 'close-circle'} 
                        size={20} 
                        color={action.status === 'taken' ? '#4CAF50' : '#ff4757'} 
                      />
                      <Text style={styles.actionText}>
                        {action.status.charAt(0).toUpperCase() + action.status.slice(1)} on{' '}
                        {new Date(action.timestamp).toLocaleDateString()} at {action.time}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = {
  headerText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 24,
    color: '#222',
    marginTop: 60,
    marginBottom: 20,
    marginLeft: 18
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontFamily: 'Outfit-Bold',
    fontSize: 24,
    color: '#007BFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: '#666',
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medIconSmall: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  medName: {
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
    color: '#007BFF',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  // ... include other necessary styles from the original component
};