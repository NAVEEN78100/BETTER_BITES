import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card } from 'react-native-paper';

import ManagerLayout from '../../components/ManagerLayout';
import { db } from '../../src/firebase/firebaseConfig';
import {
  collection, addDoc, getDocs, serverTimestamp, orderBy, query,
} from 'firebase/firestore';

interface Announcement {
  id: string;
  title: string;
  message: string;
  timestamp: any;
}

export default function AnnouncementManagement() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'announcements'), orderBy('timestamp', 'desc'))
      );
      setAnnouncements(snap.docs.map(d => ({
        id:        d.id,
        title:     d.data().title ?? 'Notice',
        message:   d.data().message ?? '',
        timestamp: d.data().timestamp,
      })));
    } catch (e) {
      console.error('Announcements fetch error:', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) return;
    setPosting(true);
    try {
      const newDoc = await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        timestamp: serverTimestamp(),
      });
      // Prepend to local list instantly
      setAnnouncements(prev => [{
        id: newDoc.id,
        title: title.trim(),
        message: message.trim(),
        timestamp: null,
      }, ...prev]);
      setTitle('');
      setMessage('');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error('Post announcement error:', e);
    } finally {
      setPosting(false);
    }
  };

  const isDisabled = !title.trim() || !message.trim() || posting;

  return (
    <ManagerLayout title="Announcements">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* Success Toast */}
        <AnimatePresence>
          {showToast && (
            <MotiView
              from={{ opacity: 0, translateY: -20, scale: 0.9 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: -20, scale: 0.9 }}
              style={styles.toast}
            >
              <MaterialCommunityIcons name="bullhorn" size={22} color="#FF7A00" />
              <Text style={styles.toastText}>Announcement posted! Students will see it now.</Text>
            </MotiView>
          )}
        </AnimatePresence>

        {/* Compose Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16 }}
        >
          <Card style={styles.composeCard}>
            <View style={styles.composeHeader}>
              <MaterialCommunityIcons name="bullhorn-outline" size={26} color="#FF7A00" />
              <Text style={styles.composeTitle}>New Announcement</Text>
            </View>

            {/* Title Field */}
            <Text style={styles.fieldLabel}>Title</Text>
            <View style={[styles.inputWrapper, title.length > 0 && styles.inputFocused]}>
              <MaterialCommunityIcons name="format-title" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Mess Closed Tomorrow"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Message Field */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Message</Text>
            <View style={[styles.inputWrapper, styles.messageWrapper, message.length > 0 && styles.inputFocused]}>
              <TextInput
                style={[styles.textInput, { minHeight: 90 }]}
                placeholder="Write a detailed announcement for all students..."
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Character count */}
            <Text style={styles.charCount}>{message.length} characters</Text>

            {/* Post Button */}
            <MotiView
              animate={{ opacity: isDisabled ? 0.5 : 1 }}
              transition={{ type: 'timing', duration: 150 }}
              style={{ marginTop: 20 }}
            >
              <Button
                mode="contained"
                style={styles.postBtn}
                labelStyle={styles.postBtnLabel}
                onPress={handlePost}
                loading={posting}
                disabled={isDisabled}
                icon="send"
              >
                Post Announcement
              </Button>
            </MotiView>
          </Card>
        </MotiView>

        {/* Past Announcements */}
        <Text style={styles.sectionTitle}>Posted Announcements</Text>

        {loadingList ? (
          <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 20 }} />
        ) : announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bullhorn-outline" size={52} color="#D1D5DB" />
            <Text style={styles.emptyText}>No announcements yet.</Text>
          </View>
        ) : (
          announcements.map((ann, index) => (
            <MotiView
              key={ann.id}
              from={{ opacity: 0, translateX: 30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: index * 80 + 200, damping: 16 }}
              style={styles.annCard}
            >
              <View style={styles.annHeader}>
                <View style={styles.annIconBg}>
                  <MaterialCommunityIcons name="bullhorn" size={18} color="#FF7A00" />
                </View>
                <Text style={styles.annTitle} numberOfLines={1}>{ann.title}</Text>
                {ann.timestamp?.toDate && (
                  <Text style={styles.annTime}>
                    {ann.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  </Text>
                )}
              </View>
              <Text style={styles.annMessage}>{ann.message}</Text>
            </MotiView>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ManagerLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF0E5', padding: 14, borderRadius: 14, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: '#FF7A00',
    elevation: 4, shadowColor: '#FF7A00', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  toastText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#B45309' },
  composeCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 28,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  composeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  composeTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 4,
  },
  inputFocused: { borderColor: '#FF7A00' },
  messageWrapper: { alignItems: 'flex-start', paddingVertical: 12 },
  textInput: { flex: 1, fontSize: 15, color: '#111827' },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  postBtn: { backgroundColor: '#FF7A00', borderRadius: 14, paddingVertical: 4 },
  postBtnLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 12 },
  annCard: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: '#F59E0B',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  annHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  annIconBg: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#FFF0E5', alignItems: 'center', justifyContent: 'center',
  },
  annTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#92400E' },
  annTime: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  annMessage: { fontSize: 14, color: '#78350F', lineHeight: 20 },
});
