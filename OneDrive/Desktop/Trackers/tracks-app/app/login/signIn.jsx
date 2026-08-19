import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState, useRef } from 'react';
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
  Keyboard,
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

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const passwordInputRef = useRef(null);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (emailError) {
      setEmailError('');
    }
    if (text && !validateEmail(text)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError('');
    }
    if (text && text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    }
  };

  const onLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validation
    let hasError = false;
    
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) {
      Vibration.vibrate(50);
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Save user details to local storage for use in header
      await setLocalStorage('userDetail', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
      });

      showToast('Login successful!');
      router.replace('(tabs)'); // ✅ Navigate to home screen
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error.code);

      if (error.code === 'auth/user-not-found') {
        showToast('No account found. Redirecting to Sign Up...');
        Vibration.vibrate(100);
        setTimeout(() => {
          router.push('/login/signUp');
        }, 2000);
      } else if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password. Please try again.');
        Vibration.vibrate([50, 100, 50]);
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email format');
      } else if (error.code === 'auth/user-disabled') {
        showToast('Account has been disabled. Contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.');
      } else {
        showToast('Login failed. Please try again.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View animation="fadeInDown" duration={1000} style={styles.container}>
          <Text style={styles.textHeader}>Welcome Back</Text>
          <Text style={styles.textSubHeader}>Sign in to continue</Text>
          <Text style={styles.textNote}>Stay healthy, stay motivated!</Text>

          <Animatable.View animation="fadeInUp" delay={300} style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={[
              styles.inputRow, 
              isEmailFocused && styles.inputFocused,
              emailError && styles.inputError
            ]}>
              <MaterialCommunityIcons 
                name="email-outline" 
                size={20} 
                color={isEmailFocused ? Colors.PRIMARY : '#888'} 
                style={styles.icon} 
              />
              <TextInput
                placeholder="Enter your email"
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                editable={!loading}
              />
            </View>
            {emailError ? (
              <Animatable.Text animation="fadeInLeft" style={styles.errorText}>
                {emailError}
              </Animatable.Text>
            ) : null}

            <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>
            <View style={[
              styles.inputRow, 
              isPasswordFocused && styles.inputFocused,
              passwordError && styles.inputError
            ]}>
              <FontAwesome 
                name="lock" 
                size={20} 
                color={isPasswordFocused ? Colors.PRIMARY : '#888'} 
                style={styles.icon} 
              />
              <TextInput
                ref={passwordInputRef}
                placeholder="Enter your password"
                style={styles.textInput}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                returnKeyType="done"
                onSubmitEditing={onLogin}
                editable={!loading}
              />
              <TouchableOpacity 
                onPress={togglePasswordVisibility}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={isPasswordFocused ? Colors.PRIMARY : '#888'}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Animatable.Text animation="fadeInLeft" style={styles.errorText}>
                {passwordError}
              </Animatable.Text>
            ) : null}
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={600}>
            <TouchableOpacity
              style={[
                styles.button, 
                loading && styles.buttonDisabled,
                (!email || !password || emailError || passwordError) && styles.buttonInactive
              ]}
              onPress={onLogin}
              disabled={loading || !email || !password || emailError || passwordError}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.buttonText, { marginLeft: 10 }]}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonCreateAccount, loading && styles.buttonDisabled]}
              onPress={() => router.push('/login/signUp')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.createAccountText,
                loading && styles.disabledText
              ]}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
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
    marginTop: 25,
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
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 5,
  },
  inputFocused: {
    borderColor: Colors.PRIMARY,
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  icon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 5,
    marginLeft: 5,
    fontWeight: '500',
  },
  button: {
    marginTop: 30,
    backgroundColor: Colors.PRIMARY,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonInactive: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
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
  buttonCreateAccount: {
    marginTop: 15,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    backgroundColor: 'transparent',
  },
  createAccountText: {
    fontSize: 17,
    color: Colors.PRIMARY,
    textAlign: 'center',
    fontWeight: '600',
  },
  disabledText: {
    color: '#ccc',
  },
});