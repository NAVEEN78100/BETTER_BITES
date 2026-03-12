import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Card, HelperText, IconButton } from 'react-native-paper';
import { MotiView } from 'moti';
import { router } from 'expo-router';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = () => {
    if (email === 'admin' && password === 'admin123') {
      router.replace('/admin-dashboard');
    } else if (email === 'manager' && password === 'manager123') {
      router.replace('/manager/manager-dashboard');
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.cardContainer}
      >
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor="#fff" size={24} onPress={() => router.back()} />
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>Admin Access</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>System Configuration & Maintenance</Text>

            <TextInput
              label="Admin Username / Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              style={styles.input}
              textColor="#fff"
              theme={{ colors: { onSurfaceVariant: '#aaa', primary: '#ff4444' } }}
              left={<TextInput.Icon icon="shield-account" color="#aaa" />}
            />

            <TextInput
              label="Admin Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              textColor="#fff"
              theme={{ colors: { onSurfaceVariant: '#aaa', primary: '#ff4444' } }}
              left={<TextInput.Icon icon="lock-alert" color="#aaa" />}
            />

            {!!error && <HelperText type="error" visible={true}>{error}</HelperText>}

            <TouchableOpacity style={styles.loginButton} onPress={handleAdminLogin}>
              <Text style={styles.loginButtonText}>Gain Access</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </MotiView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center' },
  cardContainer: { padding: 20 },
  header: { alignItems: 'flex-start', marginBottom: 20, marginTop: Platform.OS === 'ios' ? 40 : 20 },
  card: { borderRadius: 16, elevation: 8, backgroundColor: '#1e1e1e' },
  title: { color: '#ff4444', fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { color: '#aaa', textAlign: 'center', marginBottom: 25 },
  input: { marginBottom: 15, backgroundColor: '#2a2a2a' },
  loginButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
