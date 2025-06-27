import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
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
  const [viewMode, setViewMode] = useState('all'); // 'all', 'taken', 'missed'
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
      Alert.alert('Error', 'Failed to load medication history. Please try again.');
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

  const getFilteredHistory = () => {
    if (viewMode === 'all') return medHistory;
    
    return medHistory.map(med => ({
      ...med,
      actions: med.actions.filter(action => action.status === viewMode)
    })).filter(med => med.actions.length > 0);
  };

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return { color: '#2ed573', border: '#2ed573' };
    if (rate >= 60) return { color: '#ffa502', border: '#ffa502' };
    return { color: '#ff4757', border: '#ff4757' };
  };

  const renderFilterButton = (mode, label, icon) => (
    <TouchableOpacity
      style={[styles.filterButton, viewMode === mode && styles.activeFilterButton]}
      onPress={() => setViewMode(mode)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={viewMode === mode ? '#fff' : '#007BFF'} 
      />
      <Text style={[
        styles.filterButtonText, 
        viewMode === mode && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#007BFF']}
          tintColor="#007BFF"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Medication History</Text>
        <Text style={styles.headerSubtext}>Track your medication adherence</Text>
      </View>

      {/* Statistics Section */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.mainStatCard]}>
          <View style={[
            styles.adherenceRing,
            { borderColor: getAdherenceColor(statistics.adherenceRate).border }
          ]}>
            <Text style={[styles.adherenceRate, { color: getAdherenceColor(statistics.adherenceRate).color }]}>
              {statistics.adherenceRate}%
            </Text>
          </View>
          <Text style={styles.mainStatLabel}>Adherence Rate</Text>
          <Text style={[styles.mainStatSubtext, { 
            color: getAdherenceColor(statistics.adherenceRate).color,
            fontWeight: '700'
          }]}>
            {statistics.adherenceRate >= 80 ? '🎉 Excellent!' : 
             statistics.adherenceRate >= 60 ? '👍 Good Progress' : '💪 Keep Going!'}
          </Text>
        </View>
        
        <View style={styles.smallStatsContainer}>
          <View style={[styles.statCard, styles.smallStatCard]}>
            <Ionicons name="checkmark-circle" size={32} color="#2ed573" />
            <Text style={[styles.statNumber, { color: '#2ed573' }]}>{statistics.taken}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </View>
          <View style={[styles.statCard, styles.smallStatCard]}>
            <Ionicons name="close-circle" size={32} color="#ff4757" />
            <Text style={[styles.statNumber, { color: '#ff4757' }]}>{statistics.missed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', 'list')}
        {renderFilterButton('taken', 'Taken', 'checkmark-circle')}
        {renderFilterButton('missed', 'Missed', 'close-circle')}
      </View>

      {/* History List */}
      <View style={styles.historyContainer}>
        <FlatList
          data={getFilteredHistory()}
          keyExtractor={item => item.docId}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                title={viewMode === 'all' ? "No History" : `No ${viewMode} medications`}
                subtitle={viewMode === 'all' ? 
                  "No medication history available yet" : 
                  `No ${viewMode} medications found`
                }
              />
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.historyCard, { marginTop: index === 0 ? 0 : 12 }]}>
              <View style={styles.cardHeader}>
                <Image
                  source={item.type?.icon ? { uri: item.type.icon } : require('../../assets/images/smile4.jpg')}
                  style={styles.medIcon}
                />
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{item.name}</Text>
                  <Text style={styles.medDosage}>
                    {item.dosage} • {item.frequency}
                  </Text>
                  <Text style={styles.actionCount}>
                    {item.actions.length} {item.actions.length === 1 ? 'record' : 'records'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionsContainer}>
                {item.actions.slice(0, 3).map((action, actionIndex) => (
                  <View key={actionIndex} style={styles.actionRow}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: action.status === 'taken' ? '#e8f5e8' : '#ffe8e8' }
                    ]}>
                      <Ionicons 
                        name={action.status === 'taken' ? 'checkmark' : 'close'} 
                        size={14} 
                        color={action.status === 'taken' ? '#2ed573' : '#ff4757'} 
                      />
                    </View>
                    <View style={styles.actionDetails}>
                      <Text style={styles.actionStatus}>
                        {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                      </Text>
                      <Text style={styles.actionTime}>
                        {new Date(action.timestamp).toLocaleDateString()} • {action.time}
                      </Text>
                    </View>
                  </View>
                ))}
                
                {item.actions.length > 3 && (
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Text style={styles.showMoreText}>
                      +{item.actions.length - 3} more records
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    color: '#666',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtext: {
    fontFamily: 'Outfit-Regular',
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  mainStatCard: {
    flex: 1.2,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f8ff',
  },
  smallStatsContainer: {
    flex: 1,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f8fbff',
  },
  smallStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  adherenceRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adherenceRate: {
    fontFamily: 'Outfit-ExtraBold',
    fontSize: 24,
    fontWeight: '800',
  },
  mainStatLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 6,
    fontWeight: '700',
  },
  mainStatSubtext: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  statNumber: {
    fontFamily: 'Outfit-ExtraBold',
    fontSize: 28,
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '800',
  },
  statLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e6f0ff',
    gap: 8,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  activeFilterButton: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: '#007BFF',
    fontWeight: '700',
  },
  activeFilterButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    paddingTop: 40,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f8fbff',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  medIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#f0f8ff',
  },
  medInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  medName: {
    fontFamily: 'Outfit-ExtraBold',
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: 6,
    fontWeight: '800',
  },
  medDosage: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#007BFF',
    marginBottom: 4,
    fontWeight: '700',
  },
  actionCount: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f8ff',
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionDetails: {
    flex: 1,
  },
  actionStatus: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
    fontWeight: '700',
  },
  actionTime: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6f0ff',
  },
  showMoreText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: '#007BFF',
    fontWeight: '700',
  },
};