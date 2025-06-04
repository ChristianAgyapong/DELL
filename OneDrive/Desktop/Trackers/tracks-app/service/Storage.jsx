import AsyncStorage from '@react-native-async-storage/async-storage';

// Save value to local storage
export const setLocalStorage = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Retrieve value from local storage
export const getLocalStorage = async (key) => {
  try {
    const result = await AsyncStorage.getItem(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

// Remove specific key
export const removeFromLocalStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing key:', error);
  }
};

// Clear entire local storage
export const clearLocalStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
