import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button } from 'react-native-paper';

import StudentLayout from '../components/StudentLayout';
import { auth, db } from '../src/firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Full Day'];

export default function SickLeaveScreen() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState('Full Day');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid ?? 'anonymous';
      await addDoc(collection(db, 'sickleave'), {
        studentId: uid,
        date,
        mealType: selectedMeal,
        reason,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReason('');
        setSelectedMeal('Full Day');
      }, 3000);
    } catch (e) {
      console.error('Sick leave submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentLayout title="Request Sick Leave">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        <AnimatePresence>
          {submitted ? (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={styles.successContainer}
            >
              <MotiView
                from={{ translateY: -20 }}
                animate={{ translateY: 0 }}
                transition={{ type: 'spring', damping: 10, mass: 1 }}
              >
                <MaterialCommunityIcons name="medical-bag" size={80} color="#FF7A00" />
              </MotiView>
              <Text style={styles.successTitle}>Request Sent</Text>
              <Text style={styles.successSubtext}>Your sick leave request has been sent for approval.</Text>
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -20 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Card style={styles.card}>
                
                {/* Information Header */}
                <MotiView
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: 200 }}
                  style={styles.infoBanner}
                >
                  <MaterialCommunityIcons name="information-outline" size={24} color="#D97706" />
                  <Text style={styles.infoText}>
                    Applying for sick leave ensures a special light meal (e.g., Idli, Bread, Milk) is prepared for you.
                  </Text>
                </MotiView>

                {/* 1. Date Field */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 400 }}
                  style={styles.fieldContainer}
                >
                  <Text style={styles.label}>Select Date</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </MotiView>

                {/* 2. Meal Type */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 600 }}
                  style={styles.fieldContainer}
                >
                  <Text style={styles.label}>Meal Type</Text>
                  <View style={styles.chipsContainer}>
                    {mealTypes.map((meal) => {
                      const isSelected = selectedMeal === meal;
                      return (
                        <Pressable key={meal} onPress={() => setSelectedMeal(meal)}>
                          <MotiView
                            animate={{
                              backgroundColor: isSelected ? '#FF7A00' : '#F3F4F6',
                              scale: isSelected ? 1.05 : 1,
                            }}
                            transition={{ type: 'timing', duration: 150 }}
                            style={[
                              styles.chip,
                              isSelected && styles.chipActive
                            ]}
                          >
                            <Text style={[
                              styles.chipText,
                              isSelected && styles.chipTextActive
                            ]}>
                              {meal}
                            </Text>
                          </MotiView>
                        </Pressable>
                      );
                    })}
                  </View>
                </MotiView>

                {/* 3. Reason Field */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 800 }}
                  style={styles.fieldContainer}
                >
                  <Text style={styles.label}>Reason for Sick Leave</Text>
                  <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 12 }]}>
                    <MaterialCommunityIcons name="text-box-outline" size={24} color="#9CA3AF" style={[styles.inputIcon, {marginTop: 2}]} />
                    <TextInput
                      style={[styles.textInput, { minHeight: 80 }]}
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Fever, Cold, Stomach ache..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </MotiView>

                {/* 4. Submit Button */}
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1000 }}
                  style={{ marginTop: 24 }}
                >
                  <Button
                    mode="contained"
                    style={styles.submitBtn}
                    labelStyle={styles.submitBtnLabel}
                    onPress={handleSubmit}
                    disabled={!reason.trim() || submitting}
                    loading={submitting}
                  >
                    Submit Request
                  </Button>
                </MotiView>

              </Card>
            </MotiView>
          )}
        </AnimatePresence>

      </ScrollView>
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    minHeight: 48,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  chipActive: {
    backgroundColor: '#FF7A00',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#FF7A00',
    paddingVertical: 8,
    borderRadius: 16,
  },
  submitBtnLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 24,
  },
  successSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  }
});
