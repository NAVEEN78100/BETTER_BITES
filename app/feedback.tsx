import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button } from 'react-native-paper';

// ─── Animated Success Toast ───────────────────────────────────────────────────
function SuccessToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, translateY: -40, scale: 0.85 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          exit={{ opacity: 0, translateY: -40, scale: 0.85 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          style={toastStyles.wrapper}
        >
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 100, damping: 10 }}
          >
            <MaterialCommunityIcons name="check-circle" size={26} color="#10B981" />
          </MotiView>
          <View style={{ flex: 1 }}>
            <Text style={toastStyles.title}>Feedback Submitted! 🎉</Text>
            <Text style={toastStyles.sub}>Thank you for helping us improve.</Text>
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

import StudentLayout from '../components/StudentLayout';
import { auth, db } from '../src/firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const feedbackCategories = ['Quality', 'Taste', 'Hygiene', 'Service', 'Other'];

export default function FeedbackScreen() {
  const [rating, setRating] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !selectedCategory) return;

    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid ?? 'anonymous';
      await addDoc(collection(db, 'feedback'), {
        studentId: uid,
        rating,
        category: selectedCategory,
        comment: comments,
        timestamp: serverTimestamp(),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setSelectedCategory(null);
        setComments('');
      }, 3000);
    } catch (e) {
      console.error('Feedback submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentLayout title="Give Feedback">
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
                <MaterialCommunityIcons name="check-circle" size={80} color="#10B981" />
              </MotiView>
              <Text style={styles.successTitle}>Thank You!</Text>
              <Text style={styles.successSubtext}>Your feedback helps us improve.</Text>
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -20 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Card style={styles.card}>
                
                {/* 1. Star Rating */}
                <Text style={styles.label}>Rate your today's meal</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                    >
                      <MotiView
                        animate={{ 
                          scale: rating === star ? 1.3 : 1,
                          rotate: rating === star ? '15deg' : '0deg'
                        }}
                        transition={{ 
                          type: 'spring', 
                          damping: 8, 
                          stiffness: 200 
                        }}
                        style={styles.starIconWrapper}
                      >
                        <MaterialCommunityIcons 
                          name={rating >= star ? "star" : "star-outline"} 
                          size={46} 
                          color={rating >= star ? "#FFB800" : "#D1D5DB"} 
                        />
                      </MotiView>
                    </Pressable>
                  ))}
                </View>

                {/* 2. Feedback Category */}
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: rating > 0 ? 1 : 0.5 }}
                >
                  <Text style={[styles.label, { marginTop: 24 }]}>What did you like / dislike?</Text>
                  <View style={styles.categoryContainer}>
                    {feedbackCategories.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <Pressable key={cat} onPress={() => setSelectedCategory(cat)}>
                          <MotiView
                            animate={{
                              backgroundColor: isSelected ? '#FF7A00' : '#F3F4F6',
                              scale: isSelected ? 1.05 : 1
                            }}
                            transition={{ type: 'timing', duration: 150 }}
                            style={[
                              styles.categoryPill,
                              isSelected && styles.categoryPillActive
                            ]}
                          >
                            <Text style={[
                              styles.categoryText,
                              isSelected && styles.categoryTextActive
                            ]}>
                              {cat}
                            </Text>
                          </MotiView>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* 3. Additional Comments */}
                  <Text style={[styles.label, { marginTop: 24 }]}>Additional Comments (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Tell us more about your experience..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={4}
                      value={comments}
                      onChangeText={setComments}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* 4. Submit Button */}
                  <MotiView
                    animate={{ opacity: rating > 0 && selectedCategory ? 1 : 0.5 }}
                    style={{ marginTop: 32 }}
                  >
                    <Button
                      mode="contained"
                      style={styles.submitBtn}
                      labelStyle={styles.submitBtnLabel}
                      onPress={handleSubmit}
                      disabled={!rating || !selectedCategory || submitting}
                      loading={submitting}
                    >
                      Submit Feedback
                    </Button>
                  </MotiView>

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
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  starIconWrapper: {
    padding: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    borderColor: '#E56D00',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  textInput: {
    minHeight: 100,
    fontSize: 16,
    color: '#111827',
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
  }
});

const toastStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16,
    borderLeftWidth: 4, borderLeftColor: '#10B981',
    elevation: 8, shadowColor: '#10B981', shadowOpacity: 0.2,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
  },
  title: { fontSize: 15, fontWeight: '800', color: '#065F46' },
  sub: { fontSize: 12, color: '#6EE7B7', marginTop: 2 },
});
