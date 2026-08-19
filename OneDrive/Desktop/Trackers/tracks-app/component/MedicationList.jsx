import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from './EmptyState';
import { useRouter, useFocusEffect } from 'expo-router';

export default function MedicationList() {
  const router = useRouter();
  const [medList, setMedList] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false); // New state for filter loading

  // Fetch medications
  const fetchMedications = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'medications'));
      const meds = [];
      querySnapshot.forEach((doc) => {
        meds.push({ ...doc.data(), docId: doc.id });
      });
      setMedList(meds); // Always set the full list!
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    fetchMedications(true);
  }, []);

  // Fetch medications when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchMedications(false); // Don't show loader on focus
    }, [])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMedications().then(() => setRefreshing(false));
  }, []);

  // Helper to extend dates for the selector
  const getExtendedDates = (medicationDates) => {
    if (!medicationDates || medicationDates.length === 0) return [];
    const sortedDates = [...medicationDates].sort();
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const extendedDates = [...sortedDates];
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i);
      extendedDates.push(nextDate.toISOString().split('T')[0]);
    }
    return extendedDates;
  };

  // All unique dates for the selector
  const allDates = React.useMemo(() => {
    const medicationDates = Array.from(
      new Set(medList.flatMap(med => med.medicationDates || []))
    ).sort();
    return getExtendedDates(medicationDates);
  }, [medList]);

  // Filter meds for selected date
  const medsForDate = medList.filter(med => (med.medicationDates || []).includes(selectedDate));

  // When selectedDate changes, update selectedMed to the first med for that date
  useEffect(() => {
    if (medsForDate.length > 0) {
      setSelectedMed(medsForDate[0]);
    } else {
      setSelectedMed(null);
    }
  }, [selectedDate, medList]);

  // Check if date is in range
  const isDateInRange = (date, dates) => {
    if (dates.length === 0) return false;
    const firstDate = new Date(dates[0]);
    const lastMedicationDate = new Date(
      medList.flatMap(med => med.medicationDates || [])
        .sort((a, b) => new Date(b) - new Date(a))[0]
    );
    const checkDate = new Date(date);
    return checkDate >= firstDate && checkDate <= lastMedicationDate;
  };

  // Date selector handler
  const handleDatePress = async (date) => {
    setFilterLoading(true);
    setSelectedDate(date);
    
    // Simulate a small delay for the filtering process
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setFilterLoading(false);
  };

  // Medication select handler (optional)
  const handleMedSelect = (med) => {
    setSelectedMed(med);
  };

  // Convert 24-hour time to 12-hour format with AM/PM
  function formatTime24to12(time24) {
    if (!time24) return '';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  // Status indicator logic
  const getStatusForMedication = (medication, date) => {
    if (!medication.actions) return null;
    return medication.actions.find(action =>
      action.timestamp && action.timestamp.slice(0, 10) === date
    );
  };

  const StatusIndicator = ({ status }) => {
    if (!status) return null; // Don't show anything if no status

    const icon = status.status === 'taken' ? 'checkmark-circle' : 'close-circle';
    const color = status.status === 'taken' ? '#4CAF50' : '#ff4757';
    const label = status.status === 'taken' ? 'Taken' : 'Missed';

    return (
      <View style={styles.statusContainer}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.statusTime, { color, marginLeft: 6 }]}>
          {status.time ? `${label} (${status.time})` : label}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f6faff' }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: 'Outfit-Bold',
          fontSize: 22,
          color: '#222',
          marginTop: 30,
          marginBottom: 10,
          marginLeft: 18
        }}>
          Medication List
        </Text>

        {/* Date Selector */}
        <FlatList
          data={allDates}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(date) => date}
          contentContainerStyle={{ paddingHorizontal: 16, marginBottom: 10 }}
          renderItem={({ item: date }) => {
            const jsDate = new Date(date);
            const dayShort = jsDate.toLocaleDateString(undefined, { weekday: 'short' });
            const dayNumber = jsDate.getDate();
            const isSelected = date === selectedDate;
            const isInRange = medList.some(med => 
              med.medicationDates && med.medicationDates.includes(date)
            );

            return (
              <TouchableOpacity
                onPress={() => handleDatePress(date)}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                  !isInRange && styles.futureDate
                ]}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>{dayShort}</Text>
                <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>{dayNumber}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Loading indicator */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Loading medications...</Text>
          </View>
        ) : selectedDate ? (
          <>
            {filterLoading ? (
              <View style={styles.filterLoadingContainer}>
                <ActivityIndicator size="small" color="#007BFF" />
                <Text style={styles.filterLoadingText}>Filtering medications...</Text>
              </View>
            ) : (
              <FlatList
                data={medsForDate}
                keyExtractor={item => item.docId}
                refreshControl={
                  <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={onRefresh}
                    colors={['#007BFF']}
                    tintColor="#007BFF"
                  />
                }
                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 30 }}
                ListEmptyComponent={
                  medsForDate.length > 0 ? null : (
                    <EmptyState
                      title={
                        new Date(selectedDate) > new Date(
                          medList.flatMap(med => med.medicationDates || [])
                            .sort((a, b) => new Date(b) - new Date(a))[0]
                        )
                          ? 'Future Date'
                          : isDateInRange(selectedDate, allDates)
                            ? 'No Medications'
                            : 'Outside Schedule'
                      }
                      subtitle={
                        new Date(selectedDate) > new Date(
                          medList.flatMap(med => med.medicationDates || [])
                            .sort((a, b) => new Date(b) - new Date(a))[0]
                        )
                          ? 'No medications scheduled for future dates'
                          : isDateInRange(selectedDate, allDates)
                            ? `No medications scheduled for ${new Date(selectedDate).toLocaleDateString()}`
                            : 'This date is outside your medication schedule'
                      }
                    />
                  )
                }
                renderItem={({ item }) => {
                  const medicationStatus = getStatusForMedication(item, selectedDate);
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedMed(item);
                        router.push({
                          pathname: '/action-modal',
                          params: { 
                            ...item,
                            selectedDate: selectedDate,
                          }
                        });
                      }}
                      style={styles.medCardContainer}
                    >
                      <View style={styles.medCardLarge}>
                        <Image
                          source={item.type?.icon ? { uri: item.type.icon } : require('../assets/images/smile4.jpg')}
                          style={styles.medIconLarge}
                        />
                        <View style={{ flex: 1, marginLeft: 18 }}>
                          <Text style={styles.medNameLarge}>{item.name}</Text>
                          <Text style={styles.medSubLarge}>{item.whenToTake || 'When to take?'}</Text>
                          <Text style={styles.medDoseLarge}>
                            {(item.dose ? item.dose : 'Dosage?') + 
                              (item.type?.name ? ` ${item.type.name}` : '')}
                            {item.medicationDates?.length ? ` • ${item.medicationDates.length} days` : ''}
                          </Text>
                        </View>
                        <View style={styles.rightContainer}>
                          <StatusIndicator status={medicationStatus} />
                          <View style={styles.reminderBoxLarge}>
                            <Ionicons name="time-outline" size={24} color="#007BFF" />
                            <Text style={styles.reminderTimeLarge}>
                              {formatTime24to12(item.reminderTime)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyTitleText}>
              Select a Date
            </Text>
            <Text style={styles.emptySubText}>
              Choose a date to view medications
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Add these styles if not already present
const styles = {
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e0eaff',
    minWidth: 54,
  },
  dateCardSelected: {
    backgroundColor: '#007BFF',
    borderColor: '#0056b3',
  },
  dateDay: {
    fontFamily: 'Outfit-SemiBold',
    color: '#007BFF',
    fontSize: 16,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: '#fff',
  },
  dateNum: {
    fontFamily: 'Outfit-Bold',
    fontSize: 22,
    color: '#222',
  },
  dateNumSelected: {
    color: '#fff',
  },
  medCardContainer: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  medCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#d9e7ff',
  },
  medIconLarge: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  medNameLarge: {
    fontFamily: 'Outfit-Bold',
    color: '#007BFF',
    fontSize: 22,
    marginBottom: 4,
  },
  medSubLarge: {
    fontFamily: 'Outfit-Medium',
    color: '#333',
    fontSize: 16,
    marginBottom: 3,
  },
  medDoseLarge: {
    fontFamily: 'Outfit-Regular',
    color: '#666',
    fontSize: 15,
    marginTop: 2,
  },
  reminderBoxLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 14,
    alignSelf: 'flex-start',
  },
  reminderTimeLarge: {
    fontFamily: 'Outfit-SemiBold',
    marginLeft: 8,
    fontSize: 18,
    color: '#007BFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontFamily: 'Outfit-Medium',
    color: '#007BFF',
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitleText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
    color: '#007BFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  futureDate: {
    opacity: 0.6,
  },
  emptyFutureText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTime: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  filterLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterLoadingText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: '#007BFF',
    marginLeft: 8,
  },
};