import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, Dimensions, Alert, ActivityIndicator, Animated } from 'react-native';
import React, { useState, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig.jsx';

export default function MedicationActionModal() {
  const medicine = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ visible: false, message: '', color: '#4CAF50' });
  const bannerAnim = useRef(new Animated.Value(-60)).current;

  const showBanner = (message, color = '#4CAF50') => {
    setBanner({ visible: true, message, color });
    Animated.timing(bannerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(bannerAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setBanner({ ...banner, visible: false });
          router.replace({ pathname: '(tabs)', params: { refresh: true } });
        });
      }, 2000);
    });
  };

  const updateActionStatus = async (status) => {
    if (!medicine.docId) {
      Alert.alert('Error', 'No medication ID found.');
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const actionData = {
        status,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };

      const docRef = doc(db, 'medications', medicine.docId);
      await updateDoc(docRef, {
        actions: arrayUnion(actionData),
        lastUpdated: now.toISOString(),
        lastStatus: status,
        lastStatusTime: now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        lastStatusDate: now.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      });

      showBanner(
        `Medication ${status} at ${actionData.time}`, 
        status === 'taken' ? '#4CAF50' : '#ff4757'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update status. Please try again.');
      console.error('Error updating medicine status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime24to12 = (time24) => {
    if (!time24) return '';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const windowWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';
  const isMobile = windowWidth < 768;

  return (
    <View style={[styles.container, isWeb && !isMobile && styles.webContainer]}>
      {/* Banner */}
      {banner.visible && (
        <Animated.View style={[styles.banner, { top: bannerAnim, backgroundColor: banner.color }]}>
          <Text style={styles.bannerText}>{banner.message}</Text>
        </Animated.View>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      )}
      <TouchableOpacity 
        style={styles.closeRoundButton}
        onPress={() => router.back()}
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={24} color="#666" />
      </TouchableOpacity>
      <View style={[styles.contentWrapper, isWeb && !isMobile && styles.webContentWrapper]}>
        <Image
          source={medicine.type?.icon 
            ? { uri: medicine.type.icon } 
            : require('../../assets/images/smile5.jpg')}
          style={[
            styles.medicineImage,
            isWeb && !isMobile && styles.webMedicineImage
          ]}
          resizeMode="cover"
        />
        <View style={[styles.infoContainer, isWeb && !isMobile && styles.webInfoContainer]}>
          <Text style={styles.dateText}>
            {new Date(medicine.selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.reminderText}>
            It's time to take your medication
          </Text>
          <View style={styles.medicationDetailsContainer}>
            <Text style={styles.medicineTitle}>{medicine.name}</Text>
            <Text style={styles.whenToTake}>{medicine.whenToTake}</Text>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={24} color="#007BFF" />
              <Text style={styles.timeText}>
                {formatTime24to12(medicine.reminderTime)}
              </Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.takenButton]}
              onPress={() => updateActionStatus('taken')}
              disabled={loading}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.buttonText}>Taken</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.missedButton]}
              onPress={() => updateActionStatus('missed')}
              disabled={loading}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
              <Text style={styles.buttonText}>Missed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: Platform.select({ ios: 25, android: 20, web: 40 }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: {
    maxWidth: 1000, // Reduced for better readability
    marginHorizontal: 'auto',
    width: '100%',
    paddingVertical: 40,
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 200,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  bannerText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: Platform.select({ ios: '100%', android: '100%', web: 800 }),
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: 40,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        padding: 20,
      },
      android: {
        elevation: 4,
        padding: 20,
      },
    }),
  },
  webContentWrapper: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
    gap: 40,
  },
  medicineImage: {
    width: Platform.select({ ios: 180, android: 160, web: 220 }),
    height: Platform.select({ ios: 180, android: 160, web: 220 }),
    borderRadius: 20,
    marginBottom: Platform.OS !== 'web' ? 24 : 0,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoContainer: {
    flex: Platform.OS === 'web' ? 1 : undefined,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 500 : '100%',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, web: 0 }),
  },
  dateText: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#222',
    marginBottom: 8, // Reduced from 16 to 8 for closer spacing
    textAlign: 'center', // Center align like the reminder text
    width: '100%', // Ensure full width
  },
  reminderText: {
    fontSize: 18,
    fontFamily: 'Outfit-Medium',
    color: '#666',
    marginBottom: 24, // Increased from 16 to 24 for better spacing with card below
    textAlign: 'center',
    width: '100%', // Ensure full width
  },
  medicationDetailsContainer: {
    backgroundColor: '#f8f9fe',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  timeText: {
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    color: '#007BFF',
    marginLeft: 8,
  },
  medicineTitle: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#007BFF',
    marginBottom: 4,
    textAlign: 'center'
  },
  whenToTake: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: Platform.select({ ios: 14, android: 12, web: 16 }),
    paddingHorizontal: Platform.select({ ios: 24, android: 20, web: 32 }),
    justifyContent: 'center',
    flex: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ':hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        },
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  takenButton: {
    backgroundColor: '#4CAF50',
  },
  missedButton: {
    backgroundColor: '#ff4757',
  },
  closeRoundButton: {
    position: 'absolute',
    top: Platform.select({ ios: 40, android: 20, web: 20 }),
    right: Platform.select({ ios: 20, android: 16, web: 20 }),
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        ':hover': {
          transform: 'scale(1.05)',
        },
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: Platform.select({ ios: 18, android: 16, web: 18 }),
    fontFamily: 'Outfit-SemiBold',
    color: '#fff',
    marginLeft: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});