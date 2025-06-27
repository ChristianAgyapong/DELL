import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  Vibration,
  View,
  ScrollView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebaseConfig';
import Colors from '../../constant/Colors';
import { setLocalStorage } from '../../service/Storage';

const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Notification', message);
  }
};

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onCreateAccount = async () => {
    // Trim whitespace from inputs
    const trimmedName = name.trim();
    const trimmedUserName = userName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedUserName || !trimmedEmail || !password) {
      showToast('Please fill all details');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast('Please enter a valid email address');
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      showToast('Password should be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      try {
        await updateProfile(user, { displayName: trimmedUserName });
      } catch (err) {
        console.warn('Profile update error:', err);
        showToast('Account created, but failed to save username.');
      }

      await setLocalStorage('userDetail', {
        uid: user.uid,
        email: user.email,
        displayName: trimmedUserName,
      });

      showToast('Account created successfully!');
      router.replace('(tabs)');
    } catch (error) {
      console.error('Signup error:', error.code);
      setLoading(false);

      if (error.code === 'auth/email-already-in-use') {
        showToast('Email already in use. Redirecting to Sign In...');
        Vibration.vibrate(100);
        setTimeout(() => {
          router.push('/login/signIn');
        }, 2000);
      } else if (error.code === 'auth/invalid-email') {
        showToast('Invalid email format.');
      } else if (error.code === 'auth/weak-password') {
        showToast('Password should be at least 6 characters.');
      } else if (error.code === 'auth/network-request-failed') {
        showToast('Network error. Please check your connection.');
      } else {
        showToast('Signup failed. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View animation="fadeInDown" duration={1000} style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.textHeader}>Let's Sign Up</Text>
            <Text style={styles.textSubHeader}>Create a new account</Text>
            <Text style={styles.textNote}>Join us and stay on track!</Text>
          </View>

          <Animatable.View animation="fadeInUp" delay={300} style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputRow}>
                <FontAwesome name="user" size={20} color="#888" style={styles.icon} />
                <TextInput
                  placeholder="Enter your name"
                  style={styles.textInput}
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                  returnKeyType="next"
                  accessibilityLabel="Name input field"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputRow}>
                <FontAwesome name="user-circle" size={20} color="#888" style={styles.icon} />
                <TextInput
                  placeholder="Choose a username"
                  style={styles.textInput}
                  autoCapitalize="none"
                  value={userName}
                  onChangeText={setUserName}
                  editable={!loading}
                  returnKeyType="next"
                  accessibilityLabel="Username input field"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.icon} />
                <TextInput
                  placeholder="Enter your email"
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  returnKeyType="next"
                  accessibilityLabel="Email input field"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <FontAwesome name="lock" size={20} color="#888" style={styles.icon} />
                <TextInput
                  placeholder="Create a password"
                  style={styles.textInput}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={onCreateAccount}
                  accessibilityLabel="Password input field"
                />
              </View>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={600} style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onCreateAccount}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign up button"
              accessibilityHint="Creates a new account with the provided information"
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.buttonText, styles.loadingText]}>Creating Account...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonCreateAccount}
              onPress={() => router.push('/login/signIn')}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in link"
              accessibilityHint="Navigate to sign in screen"
            >
              <Text style={[styles.createAccountText, loading && styles.disabledText]}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 25,
  },
  headerContainer: {
    marginBottom: 25,
  },
  textHeader: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 15,
    color: Colors.PRIMARY,
  },
  textSubHeader: {
    fontSize: 20,
    color: '#555',
    marginTop: 10,
    fontWeight: 'bold',
  },
  textNote: {
    fontSize: 16,
    color: '#777',
    marginTop: 5,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    minHeight: 50,
  },
  icon: {
    marginRight: 12,
    width: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 10,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
  },
  buttonCreateAccount: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    backgroundColor: '#fff',
    minHeight: 50,
    justifyContent: 'center',
  },
  createAccountText: {
    fontSize: 17,
    color: Colors.PRIMARY,
    textAlign: 'center',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
});