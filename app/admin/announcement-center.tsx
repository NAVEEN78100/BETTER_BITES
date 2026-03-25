import React, { useState, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

export default function AnnouncementCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [leading, setLeading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const animation = useRef<LottieView>(null);

  const handlePostAnnouncement = async () => {
    if (!title.trim() || !message.trim()) return;
    
    setLeading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        timestamp: serverTimestamp(),
      });
      
      await addDoc(collection(db, 'logs'), {
        action: 'Announcement posted',
        userRole: 'admin',
        timestamp: serverTimestamp(),
      });

      setTitle('');
      setMessage('');
      setToastVisible(true);
      
      setTimeout(() => setToastVisible(false), 3500); 
    } catch (error) {
      console.error('Error posting announcement:', error);
    } finally {
      setLeading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          style={styles.headerContainer}
        >
          <MaterialCommunityIcons name="bullhorn" size={40} color="#FF7A00" />
          <Text variant="headlineMedium" style={styles.headerTitle}>Broadcast Center</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>Send instant updates to all students</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Announcement Title"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { onSurfaceVariant: '#6B7280', primary: '#FF7A00' } }}
                textColor="#111111"
                maxLength={50}
                left={<TextInput.Icon icon="format-title" color="#6B7280" />}
              />

              <TextInput
                label="Message Content"
                value={message}
                onChangeText={setMessage}
                mode="outlined"
                multiline
                numberOfLines={6}
                style={[styles.input, { height: 120 }]}
                theme={{ colors: { onSurfaceVariant: '#6B7280', primary: '#FF7A00' } }}
                textColor="#111111"
                maxLength={500}
              />

              <Button
                mode="contained"
                onPress={handlePostAnnouncement}
                loading={leading}
                disabled={leading || !title.trim() || !message.trim()}
                style={styles.postButton}
                buttonColor="#FF7A00"
                icon="send"
              >
                Broadcast Now
              </Button>
            </Card.Content>
          </Card>
        </MotiView>
      </ScrollView>

      <AnimatePresence>
        {toastVisible && (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring' }}
            style={styles.toastOverlay}
          >
            <View style={styles.toastBox}>
              <LottieView
                autoPlay
                loop={false}
                ref={animation}
                style={{ width: 100, height: 100 }}
                source={{ uri: 'https://assets3.lottiefiles.com/packages/lf20_jbrw3hcz.json' }} 
              />
              <Text style={styles.toastText}>Broadcast Successful!</Text>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    color: '#111111',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  postButton: {
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#FF7A00',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toastOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  toastBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#111111',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    width: '70%',
  },
  toastText: {
    color: '#111111',
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
