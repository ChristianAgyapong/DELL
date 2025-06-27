import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  ScrollView, 
  Alert,
  Dimensions,
  Modal,
  Animated 
} from 'react-native';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from './EmptyState';
import { useRouter, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function MedicationList() {
  const router = useRouter();
  const [medList, setMedList] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedMedForCheckIn, setSelectedMedForCheckIn] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  // Fetch medications with better error handling
  const fetchMedications = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const querySnapshot = await getDocs(collection(db, 'medications'));
      const meds = [];
      querySnapshot.forEach((doc) => {
        meds.push({ ...doc.data(), docId: doc.id });
      });
      setMedList(meds);
      
      // Auto-select today's date if no date is selected and medications exist
      if (!selectedDate && meds.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayHasMeds = meds.some(med => 
          med.medicationDates && med.medicationDates.includes(today)
        );
        if (todayHasMeds) {
          setSelectedDate(today);
        } else {
          // Select the first available date
          const allAvailableDates = Array.from(
            new Set(meds.flatMap(med => med.medicationDates || []))
          ).sort();
          if (allAvailableDates.length > 0) {
            setSelectedDate(allAvailableDates[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Failed to load medications. Please try again.');
      Alert.alert(
        'Error',
        'Failed to load medications. Please check your connection and try again.',
        [{ text: 'OK', onPress: () => setError(null) }]
      );
    }
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    fetchMedications(true);
  }, []);

  // Fetch medications when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchMedications(false);
    }, [])
  );

  // Pull to refresh handler with haptic feedback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMedications(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Helper to extend dates for the selector with better logic
  const getExtendedDates = (medicationDates) => {
    if (!medicationDates || medicationDates.length === 0) return [];
    const sortedDates = [...medicationDates].sort();
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const extendedDates = [...sortedDates];
    
    // Add next 7 days for planning
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i);
      extendedDates.push(nextDate.toISOString().split('T')[0]);
    }
    return extendedDates;
  };

  // All unique dates for the selector with memoization
  const allDates = React.useMemo(() => {
    const medicationDates = Array.from(
      new Set(medList.flatMap(med => med.medicationDates || []))
    ).sort();
    return getExtendedDates(medicationDates);
  }, [medList]);

  // Filter meds for selected date with memoization
  const medsForDate = React.useMemo(() => {
    return medList.filter(med => (med.medicationDates || []).includes(selectedDate));
  }, [medList, selectedDate]);

  // When selectedDate changes, update selectedMed to the first med for that date
  useEffect(() => {
    if (medsForDate.length > 0) {
      setSelectedMed(medsForDate[0]);
    } else {
      setSelectedMed(null);
    }
  }, [selectedDate, medList]);

  // Check if date is in range with better logic
  const isDateInRange = (date, dates) => {
    if (dates.length === 0) return false;
    const medicationDates = medList.flatMap(med => med.medicationDates || []);
    return medicationDates.includes(date);
  };

  // Enhanced date selector handler
  const handleDatePress = async (date) => {
    if (selectedDate === date) return; // Prevent unnecessary re-selection
    
    setFilterLoading(true);
    setSelectedDate(date);
    
    // Simulate filtering with smooth transition
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setFilterLoading(false);
  };

  // Medication select handler
  const handleMedSelect = (med) => {
    setSelectedMed(med);
  };

  // Enhanced time formatting
  const formatTime24to12 = (time24) => {
    if (!time24) return 'No time set';
    try {
      const [hourStr, minute] = time24.split(':');
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${minute.padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Enhanced status indicator logic
  const getStatusForMedication = (medication, date) => {
    if (!medication.actions || !Array.isArray(medication.actions)) return null;
    return medication.actions.find(action =>
      action.timestamp && action.timestamp.slice(0, 10) === date
    );
  };

  // Check if medication can be checked in (not already checked in for the date)
  const canCheckIn = (medication, date) => {
    const status = getStatusForMedication(medication, date);
    return !status; // Can only check in if no status exists for this date
  };

  // Handle check-in modal
  const handleCheckInPress = (medication) => {
    if (!canCheckIn(medication, selectedDate)) {
      Alert.alert(
        'Already Checked In',
        'You have already marked this medication for today. You can only check in once per day.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedMedForCheckIn(medication);
    setCheckInModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle check-in action
  const handleCheckInAction = async (status) => {
    if (!selectedMedForCheckIn || checkInLoading) return;
    
    setCheckInLoading(true);
    
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const timestamp = `${selectedDate}T${currentTime}:00`;
      
      const action = {
        status,
        timestamp,
        time: currentTime,
        date: selectedDate,
        createdAt: now.toISOString()
      };

      // Update the medication document
      const medRef = doc(db, 'medications', selectedMedForCheckIn.docId);
      await updateDoc(medRef, {
        actions: arrayUnion(action)
      });

      // Update local state
      setMedList(prevMeds => 
        prevMeds.map(med => 
          med.docId === selectedMedForCheckIn.docId
            ? { ...med, actions: [...(med.actions || []), action] }
            : med
        )
      );

      // Close modal
      closeCheckInModal();
      
      // Show success message
      Alert.alert(
        'Success',
        `Medication marked as ${status === 'taken' ? 'taken' : 'missed'} for ${new Date(selectedDate).toLocaleDateString()}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error updating medication status:', error);
      Alert.alert(
        'Error',
        'Failed to update medication status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCheckInLoading(false);
    }
  };

  // Close check-in modal
  const closeCheckInModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCheckInModalVisible(false);
      setSelectedMedForCheckIn(null);
    });
  };

  // Get medication statistics (keeping the logic intact for future use)
  const getMedicationStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeds = medList.filter(med => 
      med.medicationDates && med.medicationDates.includes(today)
    );
    
    const takenToday = todayMeds.filter(med => {
      const status = getStatusForMedication(med, today);
      return status && status.status === 'taken';
    }).length;
    
    const missedToday = todayMeds.filter(med => {
      const status = getStatusForMedication(med, today);
      return status && status.status === 'missed';
    }).length;
    
    const pendingToday = todayMeds.length - takenToday - missedToday;
    
    // Weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    let weeklyTaken = 0;
    let weeklyTotal = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayMeds = medList.filter(med => 
        med.medicationDates && med.medicationDates.includes(dateStr)
      );
      
      weeklyTotal += dayMeds.length;
      weeklyTaken += dayMeds.filter(med => {
        const status = getStatusForMedication(med, dateStr);
        return status && status.status === 'taken';
      }).length;
    }
    
    const adherenceRate = weeklyTotal > 0 ? Math.round((weeklyTaken / weeklyTotal) * 100) : 100;
    
    return {
      todayMeds: todayMeds.length,
      takenToday,
      missedToday,
      pendingToday,
      adherenceRate
    };
  };

  // Keep stats calculation for potential future use
  const stats = getMedicationStats();

  // Enhanced status indicator component
  const StatusIndicator = ({ status, style = {} }) => {
    if (!status) {
      return (
        <View style={[styles.statusContainer, style]}>
          <View style={styles.pendingIndicator}>
            <Ionicons name="time-outline" size={16} color="#ff9500" />
          </View>
          <Text style={[styles.statusTime, { color: '#ff9500' }]}>Pending</Text>
        </View>
      );
    }

    const icon = status.status === 'taken' ? 'checkmark-circle' : 'close-circle';
    const color = status.status === 'taken' ? '#4CAF50' : '#ff4757';
    const label = status.status === 'taken' ? 'Taken' : 'Missed';

    return (
      <View style={[styles.statusContainer, style]}>
        <View style={[styles.statusIndicator, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.statusTime, { color }]}>
          {status.time ? `${label} at ${status.time}` : label}
        </Text>
      </View>
    );
  };

  // Enhanced date card with better visual feedback
  const renderDateCard = ({ item: date }) => {
    const jsDate = new Date(date);
    const dayShort = jsDate.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNumber = jsDate.getDate();
    const monthShort = jsDate.toLocaleDateString(undefined, { month: 'short' });
    const isSelected = date === selectedDate;
    const isInRange = medList.some(med => 
      med.medicationDates && med.medicationDates.includes(date)
    );
    const isToday = date === new Date().toISOString().split('T')[0];
    const isPast = new Date(date) < new Date().setHours(0, 0, 0, 0);

    return (
      <TouchableOpacity
        onPress={() => handleDatePress(date)}
        style={[
          styles.dateCard,
          isSelected && styles.dateCardSelected,
          !isInRange && styles.futureDate,
          isToday && !isSelected && styles.todayDate
        ]}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dateMonth, 
          isSelected && styles.dateMonthSelected,
          isToday && !isSelected && styles.todayText
        ]}>
          {monthShort}
        </Text>
        <Text style={[
          styles.dateDay, 
          isSelected && styles.dateDaySelected,
          isToday && !isSelected && styles.todayText
        ]}>
          {dayShort}
        </Text>
        <Text style={[
          styles.dateNum, 
          isSelected && styles.dateNumSelected,
          isToday && !isSelected && styles.todayText
        ]}>
          {dayNumber}
        </Text>
        {isInRange && (
          <View style={[
            styles.dateDot, 
            isSelected && styles.dateDotSelected,
            isToday && !isSelected && styles.todayDot
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  // Enhanced medication card
  const renderMedicationCard = ({ item, index }) => {
    const medicationStatus = getStatusForMedication(item, selectedDate);
    const hasReminder = item.reminderTime;
    const canCheckInMed = canCheckIn(item, selectedDate);
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => canCheckInMed ? handleCheckInPress(item) : null}
        style={[styles.medCardContainer, { marginTop: index === 0 ? 16 : 12 }]}
      >
        <View style={[
          styles.medCardLarge,
          medicationStatus?.status === 'taken' && styles.medCardTaken,
          medicationStatus?.status === 'missed' && styles.medCardMissed,
          !canCheckInMed && styles.medCardDisabled
        ]}>
          <Image
            source={item.type?.icon ? { uri: item.type.icon } : require('../assets/images/smile4.jpg')}
            style={styles.medIconLarge}
            onError={() => console.log('Image failed to load')}
          />
          
          <View style={styles.medInfoContainer}>
            <Text style={styles.medNameLarge} numberOfLines={1}>
              {item.name || 'Unnamed Medication'}
            </Text>
            <Text style={styles.medSubLarge} numberOfLines={1}>
              {item.whenToTake || 'When to take not specified'}
            </Text>
            <Text style={styles.medDoseLarge} numberOfLines={1}>
              {(item.dose || 'Dosage not specified') + 
                (item.type?.name ? ` ${item.type.name}` : '')}
              {item.medicationDates?.length ? ` • ${item.medicationDates.length} days` : ''}
            </Text>
          </View>
          
          <View style={styles.rightContainer}>
            <StatusIndicator 
              status={medicationStatus} 
              style={styles.statusContainerCard}
            />
            
            {hasReminder && (
              <View style={[
                styles.reminderBoxLarge,
                medicationStatus?.status === 'taken' && styles.reminderBoxTaken
              ]}>
                <Ionicons 
                  name="time-outline" 
                  size={20} 
                  color={medicationStatus?.status === 'taken' ? '#4CAF50' : '#007BFF'} 
                />
                <Text style={[
                  styles.reminderTimeLarge,
                  medicationStatus?.status === 'taken' && styles.reminderTimeTaken
                ]}>
                  {formatTime24to12(item.reminderTime)}
                </Text>
              </View>
            )}
            
            {canCheckInMed && (
              <TouchableOpacity 
                style={styles.checkInButton}
                onPress={() => handleCheckInPress(item)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#007BFF" />
                <Text style={styles.checkInButtonText}>Check In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Check-in modal
  const CheckInModal = () => (
    <Modal
      visible={checkInModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeCheckInModal}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Check In Medication</Text>
            <TouchableOpacity onPress={closeCheckInModal}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {selectedMedForCheckIn && (
            <View style={styles.modalMedInfo}>
              <Image
                source={selectedMedForCheckIn.type?.icon ? 
                  { uri: selectedMedForCheckIn.type.icon } : 
                  require('../assets/images/smile4.jpg')
                }
                style={styles.modalMedIcon}
              />
              <View style={styles.modalMedDetails}>
                <Text style={styles.modalMedName}>{selectedMedForCheckIn.name}</Text>
                <Text style={styles.modalMedDose}>
                  {selectedMedForCheckIn.dose} {selectedMedForCheckIn.type?.name}
                </Text>
                <Text style={styles.modalMedDate}>
                  {new Date(selectedDate).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
          )}
          
          <Text style={styles.modalQuestion}>
            Did you take this medication?
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.takenButton]}
              onPress={() => handleCheckInAction('taken')}
              disabled={checkInLoading}
            >
              {checkInLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.takenButtonText}>Yes, Taken</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.missedButton]}
              onPress={() => handleCheckInAction('missed')}
              disabled={checkInLoading}
            >
              {checkInLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.missedButtonText}>No, Missed</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalNote}>
            You can only check in once per day for each medication.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );

  // Error state
  if (error && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff4757" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchMedications(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
          title="Pull to refresh"
          titleColor="#666"
        />
      }
    >
      <View style={styles.content}>
        {/* Enhanced Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Medication List</Text>
          <Text style={styles.headerSubtitle}>
            {medList.length} {medList.length === 1 ? 'medication' : 'medications'} total
          </Text>
        </View>

        {/* Enhanced Date Selector */}
        <View style={styles.dateSelectorContainer}>
          <Text style={styles.dateSelectorTitle}>Select Date</Text>
          <FlatList
            data={allDates}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(date) => date}
            contentContainerStyle={styles.dateSelectorContent}
            renderItem={renderDateCard}
            getItemLayout={(data, index) => ({
              length: 70,
              offset: 70 * index,
              index,
            })}
            initialScrollIndex={selectedDate ? Math.max(0, allDates.indexOf(selectedDate) - 1) : 0}
            onScrollToIndexFailed={() => {}}
          />
        </View>

        {/* Content Area */}
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
              <View style={styles.medicationListContainer}>
                <Text style={styles.selectedDateText}>
                  {new Date(selectedDate).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
                
                <FlatList
                  data={medsForDate}
                  keyExtractor={item => item.docId}
                  scrollEnabled={false}
                  contentContainerStyle={styles.medicationListContent}
                  ListEmptyComponent={
                    <EmptyState
                      title={
                        new Date(selectedDate) > new Date(
                          medList.flatMap(med => med.medicationDates || [])
                            .sort((a, b) => new Date(b) - new Date(a))[0]
                        ) ? 'Future Date' :
                        isDateInRange(selectedDate, allDates) ? 'No Medications' : 'Outside Schedule'
                      }
                      subtitle={
                        new Date(selectedDate) > new Date(
                          medList.flatMap(med => med.medicationDates || [])
                            .sort((a, b) => new Date(b) - new Date(a))[0]
                        ) ? 'No medications scheduled for future dates' :
                        isDateInRange(selectedDate, allDates) ? 
                          `No medications scheduled for ${new Date(selectedDate).toLocaleDateString()}` :
                          'This date is outside your medication schedule'
                      }
                    />
                  }
                  renderItem={renderMedicationCard}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={64} color="#007BFF" />
            <Text style={styles.emptyTitleText}>Select a Date</Text>
            <Text style={styles.emptySubText}>Choose a date above to view your medications</Text>
          </View>
        )}
      </View>
      
      <CheckInModal />
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f6faff',
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 16,
    color: '#666',
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statsSectionTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statsValue: {
    fontFamily: 'Outfit-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  statsSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#999',
  },
  adherenceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  adherenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adherenceTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  adherenceValue: {
    fontFamily: 'Outfit-Bold',
    fontSize: 36,
    color: '#007BFF',
    marginBottom: 12,
  },
  adherenceBar: {
    height: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  adherenceProgress: {
    height: '100%',
    borderRadius: 4,
  },
  adherenceSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  dateSelectorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateSelectorTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  dateSelectorContent: {
    paddingHorizontal: 16,
  },
  dateCard: {
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e6f0ff',
    minWidth: 64,
    position: 'relative',
  },
  dateCardSelected: {
    backgroundColor: '#007BFF',
    borderColor: '#0056b3',
  },
  todayDate: {
    backgroundColor: '#fff4e6',
    borderColor: '#ff9500',
  },
  dateMonth: {
    fontFamily: 'Outfit-Medium',
    color: '#999',
    fontSize: 11,
    marginBottom: 2,
  },
  dateMonthSelected: {
    color: '#fff',
  },
  todayText: {
    color: '#ff9500',
  },
  dateDay: {
    fontFamily: 'Outfit-SemiBold',
    color: '#007BFF',
    fontSize: 14,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: '#fff',
  },
  dateNum: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#1a1a1a',
  },
  dateNumSelected: {
    color: '#fff',
  },
  dateDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007BFF',
  },
  dateDotSelected: {
    backgroundColor: '#fff',
  },
  todayDot: {
    backgroundColor: '#ff9500',
  },
  futureDate: {
    opacity: 0.5,
  },
  selectedDateText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  medicationListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  medicationListContent: {
    paddingBottom: 30,
  },
  medCardContainer: {
    marginBottom: 8,
  },
  medCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f8ff',
  },
  medCardTaken: {
    backgroundColor: '#f8fff8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  medCardMissed: {
    backgroundColor: '#fff8f8',
    borderColor: '#ff4757',
    borderWidth: 2,
  },
  medCardDisabled: {
    opacity: 0.7,
  },
  medIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
  },
  medInfoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  medNameLarge: {
    fontFamily: 'Outfit-Bold',
    color: '#1a1a1a',
    fontSize: 18,
    marginBottom: 4,
  },
  medSubLarge: {
    fontFamily: 'Outfit-Medium',
    color: '#666',
    fontSize: 14,
    marginBottom: 3,
  },
  medDoseLarge: {
    fontFamily: 'Outfit-Regular',
    color: '#999',
    fontSize: 13,
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusContainerCard: {
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff4e6',
  },
  statusTime: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
  },
  reminderBoxLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e6f0ff',
  },
  reminderBoxTaken: {
    backgroundColor: '#f8fff8',
    borderColor: '#4CAF50',
  },
  reminderTimeLarge: {
    fontFamily: 'Outfit-SemiBold',
    marginLeft: 6,
    fontSize: 13,
    color: '#007BFF',
  },
  reminderTimeTaken: {
    color: '#4CAF50',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f3ff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
  },
  checkInButtonText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    color: '#007BFF',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontFamily: 'Outfit-Medium',
    color: '#007BFF',
    marginTop: 12,
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitleText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  filterLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filterLoadingText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 16,
    color: '#007BFF',
    marginLeft: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f6faff',
  },
  errorTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#1a1a1a',
  },
  modalMedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  modalMedIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e6f3ff',
  },
  modalMedDetails: {
    flex: 1,
    marginLeft: 16,
  },
  modalMedName: {
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalMedDose: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  modalMedDate: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#999',
  },
  modalQuestion: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 32,
  },
  modalButtons: {
    gap: 12,
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  takenButton: {
    backgroundColor: '#4CAF50',
  },
  missedButton: {
    backgroundColor: '#ff4757',
  },
  takenButtonText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#fff',
  },
  missedButtonText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#fff',
  },
  modalNote: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};