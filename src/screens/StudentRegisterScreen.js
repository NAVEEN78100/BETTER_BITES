import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, HelperText, IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { MotiView } from 'moti';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function StudentRegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [dietType, setDietType] = useState('vegetarian');
  const [healthConditions, setHealthConditions] = useState('none');
  const [allergies, setAllergies] = useState('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !age || !height || !weight) {
      setError('Please fill all basic details');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      // 1. Create a Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      // 2. Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: normalizedEmail,
        role: 'student',
        age: parseInt(age, 10),
        height: parseFloat(height),
        weight: parseFloat(weight),
        gender, // stored as lowercase
        dietType,
        healthConditions,
        allergies,
      });

      setLoading(false);
      // Navigate or handle successful registration
      navigation.replace('StudentDashboard');
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700 }}
        >
          <View style={styles.header}>
            <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
            <Text variant="headlineSmall" style={styles.title}>Student Registration</Text>
            <View style={{ width: 48 }} /> 
          </View>

          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Basic Details</Text>
              
              <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
              <View style={styles.row}>
                <TextInput label="Age" value={age} onChangeText={setAge} keyboardType="numeric" mode="outlined" style={[styles.input, styles.flex1]} />
                <View style={{ width: 10 }} />
                <TextInput label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" mode="outlined" style={[styles.input, styles.flex1]} />
                <View style={{ width: 10 }} />
                <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" mode="outlined" style={[styles.input, styles.flex1]} />
              </View>

              <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 10 }]}>Health & Diet Information</Text>
              
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={gender} onValueChange={setGender}>
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>

              <Text style={styles.label}>Diet Type</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={dietType} onValueChange={setDietType}>
                  <Picker.Item label="Vegetarian" value="vegetarian" />
                  <Picker.Item label="Non-Vegetarian" value="non-vegetarian" />
                  <Picker.Item label="Eggetarian" value="eggetarian" />
                </Picker>
              </View>

              <Text style={styles.label}>Health Conditions</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={healthConditions} onValueChange={setHealthConditions}>
                  <Picker.Item label="None" value="none" />
                  <Picker.Item label="Diabetes" value="diabetes" />
                  <Picker.Item label="High Blood Pressure" value="high blood pressure" />
                  <Picker.Item label="Underweight" value="underweight" />
                  <Picker.Item label="Overweight" value="overweight" />
                </Picker>
              </View>

              <Text style={styles.label}>Food Allergies</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={allergies} onValueChange={setAllergies}>
                  <Picker.Item label="None" value="none" />
                  <Picker.Item label="Peanut Allergy" value="peanut" />
                  <Picker.Item label="Dairy Allergy" value="dairy" />
                  <Picker.Item label="Gluten Allergy" value="gluten" />
                  <Picker.Item label="Seafood Allergy" value="seafood" />
                </Picker>
              </View>

              <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 10 }]}>Authentication</Text>
              <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
              <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />

              {!!error && <HelperText type="error" visible={true}>{error}</HelperText>}

              <Button 
                mode="contained" 
                onPress={handleRegister} 
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={{ paddingVertical: 8 }}
              >
                Create Account
              </Button>
            </Card.Content>
          </Card>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  title: { fontWeight: 'bold', color: '#333' },
  card: { borderRadius: 16, elevation: 4 },
  sectionTitle: { color: '#6200ee', fontWeight: 'bold', marginBottom: 10 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  label: { fontSize: 14, color: '#555', marginTop: 8, marginBottom: 4, marginLeft: 4 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  button: { marginTop: 15, borderRadius: 8 },
});
