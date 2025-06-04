import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

  const onLogin = async () => {
    if (!email || !password) {
      showToast('Please enter email and password');
      return;
    }

    setLoading(true);

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
        showToast('Incorrect password. Please try again.');
      } else {
        showToast('Login failed. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.container}>
        <Text style={styles.textHeader}>Welcome Back</Text>
        <Text style={styles.textSubHeader}>Sign in to continue</Text>
        <Text style={styles.textNote}>Stay healthy, stay motivated!</Text>

        <Animatable.View animation="fadeInUp" delay={300} style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.icon} />
            <TextInput
              placeholder="Enter your email"
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>
          <View style={styles.inputRow}>
            <FontAwesome name="lock" size={20} color="#888" style={styles.icon} />
            <TextInput
              placeholder="Enter your password"
              style={styles.textInput}
              secureTextEntry
              onChangeText={setPassword}
            />
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={600}>
          <TouchableOpacity
            style={[styles.button, loading && { backgroundColor: '#ccc' }]}
            onPress={onLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonCreateAccount}
            onPress={() => router.push('/login/signUp')}
          >
            <Text style={styles.createAccountText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </Animatable.View>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
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
    marginBottom: 5,
    color: '#444',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    marginTop: 25,
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 17,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonCreateAccount: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    backgroundColor: '#fff',
  },
  createAccountText: {
    fontSize: 17,
    color: Colors.PRIMARY,
    textAlign: 'center',
    fontWeight: '600',
  },
});
