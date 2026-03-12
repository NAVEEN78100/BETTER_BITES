import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Text, TextInput, Card, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { auth, db } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState('student'); // 'student' or 'manager'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleRole = () => setRole(r => r === 'student' ? 'manager' : 'student');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (role === 'manager') {
        if (normalizedEmail !== 'manager@betterbites.com') {
          throw new Error('Invalid Manager credentials.');
        }
        // In a real app, manager also might authenticate with Firebase
        // Here we just test predefined email for Manager
        // For project purpose, we can still use auth if manager account exists, else just simulate:
        navigation.replace('ManagerDashboard');
        setLoading(false);
        return;
      }

      if (role === 'student') {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const user = userCredential.user;

        // Fetch from firestore to verify role
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.role === 'student') {
            navigation.replace('StudentDashboard');
          } else {
            throw new Error('Not authorized as student');
          }
        } else {
          throw new Error('User profile not found');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Admin Shield Icon */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('AdminLoginScreen')}>
          <MaterialCommunityIcons name="shield-account" size={32} color="#555" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.cardContainer}
        >
          <Text variant="displaySmall" style={styles.mainTitle}>BETTER BITES</Text>
          <Text variant="titleMedium" style={styles.subtitle}>Smart Hostel Mess Management</Text>

          <Card style={styles.card} mode="elevated">
            <Card.Content>
              {/* Role Toggle Switch Animated */}
              <View style={styles.toggleContainer}>
                <Pressable onPress={() => setRole('student')} style={styles.toggleOption}>
                  <Text style={[styles.toggleText, role === 'student' && styles.toggleTextActive]}>Student</Text>
                </Pressable>
                <Pressable onPress={() => setRole('manager')} style={styles.toggleOption}>
                  <Text style={[styles.toggleText, role === 'manager' && styles.toggleTextActive]}>Manager</Text>
                </Pressable>
                
                {/* Animated Indicator line */}
                <MotiView 
                  style={styles.toggleIndicator}
                  animate={{
                    translateX: role === 'student' ? 0 : 130, // rough width
                  }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                />
              </View>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
              />

              {!!error && <HelperText type="error" visible={true}>{error}</HelperText>}

              {/* Animated Login Button */}
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: loading ? 0.95 : 1 }}
              >
                <TouchableOpacity 
                  style={styles.loginButton} 
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="login" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>{loading ? 'Authenticating...' : 'Login'}</Text>
                </TouchableOpacity>
              </MotiView>

              <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('StudentRegisterScreen')}>
                <Text style={styles.registerText}>New Student? <Text style={styles.registerTextBold}>Register Here</Text></Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  topRow: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  keyboardView: { flex: 1, justifyContent: 'center' },
  cardContainer: { padding: 20 },
  mainTitle: { textAlign: 'center', fontWeight: '900', color: '#6200ee', letterSpacing: 1 },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 30 },
  card: { borderRadius: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden' },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 25,
    width: 260,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eaeaea',
    position: 'relative',
  },
  toggleOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  toggleText: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  toggleTextActive: { color: '#fff' },
  toggleIndicator: {
    position: 'absolute',
    width: 130,
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 20,
    zIndex: 1,
  },
  input: { marginBottom: 15 },
  loginButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: '#666', fontSize: 14 },
  registerTextBold: { color: '#6200ee', fontWeight: 'bold' },
});
