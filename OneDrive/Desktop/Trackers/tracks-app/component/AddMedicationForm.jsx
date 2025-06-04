import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TypeList, WhenToTake } from '../constant/Options';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getLocalStorage } from '../service/Storage'; // Import getLocalStorage
import { useRouter } from 'expo-router';

export default function AddMedicationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const [successMessage, setSuccessMessage] = useState(null);

  // Verify Firestore connection on component mount
  useEffect(() => {
    const verifyConnection = async () => {
      try {
        await setDoc(doc(db, '_test', 'connection'), {
          timestamp: new Date(),
        });
        console.log('Firestore connection verified');
      } catch (error) {
        console.error('Firestore connection failed:', error);
        Alert.alert('Connection Error', 'Database connection failed');
      }
    };
    verifyConnection();
  }, []);

  const testFirestoreConnection = async () => {
    try {
      const testDoc = await setDoc(
        doc(db, '_test', 'connection'),
        {
          timestamp: new Date(),
          test: true,
        }
      );
      console.log('Firestore connection test successful');
      return true;
    } catch (error) {
      console.error('Firestore connection test failed:', error);
      return false;
    }
  };

  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const showDate = (field) => {
    if (field === 'startDate') {
      setShowStartPicker(true);
    } else if (field === 'endDate') {
      setShowEndPicker(true);
    }
  };

  // Helper to generate date range array (dates only, no time)
  const generateDateRange = (start, end) => {
    if (!start || !end) return [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const SaveMedication = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      // Get user details
      const user = await getLocalStorage('userDetail');
      if (!user?.email) {
        throw new Error('User not logged in');
      }

      // Validate form data (handle type as object)
      const requiredFields = [
        { key: 'name', label: 'name' },
        { key: 'type', label: 'type' },
        { key: 'dose', label: 'dose' },
        { key: 'startDate', label: 'startDate' },
        { key: 'endDate', label: 'endDate' },
        { key: 'reminderTime', label: 'reminderTime' },
      ];

      const missingFields = requiredFields.filter(field => {
        if (field.key === 'type') {
          return !formData.type || !formData.type.name;
        }
        return !formData[field.key];
      }).map(field => field.label);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Check if start date is before end date
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        throw new Error('Start date must be before end date');
      }

      // Generate medicationDates array
      const medicationDates = generateDateRange(formData.startDate, formData.endDate);

      // Prepare medication data
      const medicationData = {
        ...formData,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
        docId: `med_${Date.now()}`,
        status: 'active',
        medicationDates, // Save the date range
      };

      console.log('Saving medication data:', medicationData);

      // Save to Firestore with explicit error handling
      const docRef = doc(db, 'medications', medicationData.docId);
      await setDoc(docRef, medicationData);

      
      // Instead, just set the success message:
      setSuccessMessage('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setError(error.message);
      Alert.alert(
        'Error',
        error.message === 'User not logged in'
          ? 'Please log in to save medications'
          : `Failed to save medication: ${error.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (field, event, selectedDate) => {
    if (Platform.OS === 'android') {
      if (field === 'startDate') setShowStartPicker(false);
      else if (field === 'endDate') setShowEndPicker(false);
    }

    if (selectedDate) {
      const formatted = selectedDate.toISOString();
      onHandleInputChange(field, formatted);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    //const date = new Date(dateString);
    //return date.toLocaleString();
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setSelectedTime(timeString);
      onHandleInputChange('reminderTime', timeString);
    }
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '';
    return new Date(`2000/01/01 ${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Add New Medication</Text>

        {/* Medication Name */}
        <View style={styles.inputGroup}>
          <Ionicons style={styles.icon} name="medkit-outline" size={24} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter medication name"
            onChangeText={(value) => onHandleInputChange('name', value)}
          />
        </View>

        {/* Type List */}
        <FlatList
          data={TypeList}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 5 }}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.inputGroup,
                styles.typeItem,
                {
                  backgroundColor:
                    item.name === formData?.type?.name ? '#cce5ff' : '#f9f9f9',
                },
              ]}
              onPress={() => onHandleInputChange('type', item)}
            >
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      item.name === formData?.type?.name ? '#007BFF' : '#000',
                  },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Dosage */}
        <View style={styles.inputGroup}>
          <Ionicons style={styles.icon} name="eyedrop-outline" size={24} />
          <TextInput
            style={styles.textInput}
            placeholder="Dosage Ex. 2 , 5ml"
            onChangeText={(value) => onHandleInputChange('dose', value)}
          />
        </View>

        {/* When to Take */}
        <View style={styles.inputGroup}>
          <Ionicons style={styles.icon} name="time-outline" size={24} />
          <Picker
            selectedValue={formData.whenToTake}
            onValueChange={(itemValue) =>
              onHandleInputChange('whenToTake', itemValue)
            }
            style={styles.picker}
          >
            {WhenToTake.map((item, index) => (
              <Picker.Item key={index} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>

        {/* Date Selection */}
        <View style={styles.dateContainer}>
          {/* Start Date */}
          <View style={styles.dateWrapper}>
            <Text style={styles.dateLabel}>Start Date & Time</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateInputGroup}>
                <Ionicons
                  style={[styles.icon, { fontSize: 20 }]}
                  name="calendar-outline"
                />
                <input
                  type="datetime-local"
                  style={styles.webDateInput}
                  value={formData.startDate || ''}
                  onChange={(e) => onHandleInputChange('startDate', e.target.value)}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateInputGroup}
                  onPress={() => showDate('startDate')}
                >
                  <Ionicons
                    style={styles.icon}
                    name="calendar-outline"
                    size={24}
                  />
                  <Text style={styles.text}>
                    {formData.startDate
                      ? formatDateTime(formData.startDate)
                      : 'Select Start Date'}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={
                      formData.startDate ? new Date(formData.startDate) : new Date()
                    }
                    mode="datetime"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) =>
                      handleDateChange('startDate', event, selectedDate)
                    }
                  />
                )}
              </>
            )}
          </View>

          {/* End Date */}
          <View style={styles.dateWrapper}>
            <Text style={styles.dateLabel}>End Date & Time</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateInputGroup}>
                <Ionicons
                  style={[styles.icon, { fontSize: 20 }]}
                  name="calendar-outline"
                />
                <input
                  type="datetime-local"
                  style={styles.webDateInput}
                  value={formData.endDate || ''}
                  onChange={(e) => onHandleInputChange('endDate', e.target.value)}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateInputGroup}
                  onPress={() => showDate('endDate')}
                >
                  <Ionicons
                    style={styles.icon}
                    name="calendar-outline"
                    size={24}
                  />
                  <Text style={styles.text}>
                    {formData.endDate
                      ? formatDateTime(formData.endDate)
                      : 'Select End Date'}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={
                      formData.endDate ? new Date(formData.endDate) : new Date()
                    }
                    mode="datetime"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) =>
                      handleDateChange('endDate', event, selectedDate)
                    }
                  />
                )}
              </>
            )}
          </View>
        </View>

        {/* Time Picker */}
        <View style={styles.dateContainer}>
          <View style={styles.dateWrapper}>
            <Text style={styles.dateLabel}>Reminder Time</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateInputGroup}>
                <Ionicons
                  style={[styles.icon, { fontSize: 20 }]}
                  name="time-outline"
                />
                <input
                  type="time"
                  style={styles.webDateInput}
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                    onHandleInputChange('reminderTime', e.target.value);
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateInputGroup}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons
                    style={styles.icon}
                    name="time-outline"
                    size={24}
                  />
                  <Text style={styles.text}>
                    {selectedTime
                      ? new Date(`2000/01/01 ${selectedTime}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Select Time'}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime ? (() => {
                      const [hours, minutes] = selectedTime.split(':');
                      const date = new Date();
                      date.setHours(Number(hours));
                      date.setMinutes(Number(minutes));
                      return date;
                    })() : new Date()}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}
          </View>
        </View>

        {/* Show any errors */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Save button with loading state */}
        <TouchableOpacity
          onPress={SaveMedication}
          style={[
            styles.buttonContainer,
            isSaving && styles.buttonDisabled,
          ]}
          disabled={isSaving}
        >
          {isSaving ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.buttonText, styles.loadingText]}>
                Saving...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Add Medication</Text>
          )}
        </TouchableOpacity>

        {/* Success Message Banner */}
        {successMessage && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Your data has been saved!</Text>
              <TouchableOpacity
                style={styles.okButton}
                onPress={() => {
                  setSuccessMessage(null);
                  setFormData({});
                  setSelectedTime('');
                  router.back(); // Go back to previous page
                }}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    ...(Platform.OS === 'web'
      ? { width: '100%', boxSizing: 'border-box' }
      : { flex: 1 }),
    padding: 20,
  },
  header: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  inputGroup: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  icon: {
    marginRight: 10,
    color: '#007BFF',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    paddingRight: 10,
  },
  typeText: {
    fontSize: 16,
  },
  typeItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  picker: {
    flex: 1,
    marginLeft: 10,
  },
  dateContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 10,
    width: '100%',
  },
  dateWrapper: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 220 : '48%',
    maxWidth: Platform.OS === 'web' ? '48%' : '100%',
    marginBottom: Platform.OS === 'web' ? 0 : 10,
  },
  dateInputGroup: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: Platform.OS === 'web' ? 8 : 12,
    borderRadius: 10,
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    minHeight: 45,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  webDateInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    padding: 4,
  },
  text: {
    fontSize: 14,
    color: '#000',
    paddingHorizontal: 10,
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: '#fff',
      paddingHorizontal: 10,
    }),
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    minHeight: 54,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#80b3ff',
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  successBanner: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  successText: {
    color: '#155724',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 250,
  },
  modalText: {
    fontSize: 18,
    color: '#155724',
    marginBottom: 20,
    textAlign: 'center',
  },
  okButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});