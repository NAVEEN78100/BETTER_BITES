import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ManagerLayout from '../../components/ManagerLayout';
import { db } from '../../src/firebase/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

interface FeedbackItem {
  id: string;
  studentId: string;
  rating: number;
  category: string;
  comment: string;
  timestamp: any;
}

type FilterType = 'All' | 'Poor' | 'Average' | 'Excellent';

const FILTERS: FilterType[] = ['All', 'Poor', 'Average', 'Excellent'];

const filterRanges: Record<FilterType, [number, number]> = {
  All: [1, 5], Poor: [1, 2], Average: [3, 3], Excellent: [4, 5],
};

const filterTheme: Record<FilterType, { bg: string; active: string; text: string }> = {
  All:       { bg: '#F3F4F6', active: '#111827', text: '#374151' },
  Poor:      { bg: '#FEE2E2', active: '#EF4444', text: '#EF4444' },
  Average:   { bg: '#FEF3C7', active: '#D97706', text: '#D97706' },
  Excellent: { bg: '#D1FAE5', active: '#10B981', text: '#10B981' },
};

export default function FeedbackReview() {
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'feedback'), orderBy('timestamp', 'desc')));
        setFeedbackList(snap.docs.map(d => ({
          id: d.id,
          studentId: d.data().studentId ?? '—',
          rating:    d.data().rating ?? 0,
          category:  d.data().category ?? '—',
          comment:   d.data().comment ?? '',
          timestamp: d.data().timestamp,
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const [min, max] = filterRanges[activeFilter];
    return feedbackList.filter(f => f.rating >= min && f.rating <= max);
  }, [feedbackList, activeFilter]);

  const avgRating = feedbackList.length
    ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
    : '0';

  return (
    <ManagerLayout title="Feedback Review">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* Stats Bar */}
        <MotiView
          from={{ opacity: 0, translateY: -14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.statsBar}
        >
          {[
            { num: feedbackList.length, label: 'Total Reviews', color: '#111827' },
            { num: avgRating,            label: 'Avg Rating',    color: '#F59E0B' },
            { num: feedbackList.filter(f => f.rating >= 4).length, label: 'Excellent', color: '#10B981' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </MotiView>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            const t = filterTheme[filter];
            return (
              <Pressable key={filter} onPress={() => setActiveFilter(filter)}>
                <MotiView
                  animate={{ backgroundColor: isActive ? t.active : t.bg, scale: isActive ? 1.06 : 1 }}
                  transition={{ type: 'timing', duration: 150 }}
                  style={styles.filterChip}
                >
                  <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : t.text }]}>
                    {filter}
                  </Text>
                </MotiView>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="message-off-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Feedback</Text>
            <Text style={styles.emptySub}>No feedback matches this filter.</Text>
          </View>
        ) : (
          filtered.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateX: -30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: index * 80 + 100, damping: 16 }}
              style={styles.feedbackCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account" size={20} color="#6366F1" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.studentId}>
                    {item.studentId.length > 16 ? item.studentId.substring(0, 16) + '…' : item.studentId}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(s => (
                    <MaterialCommunityIcons
                      key={s}
                      name={item.rating >= s ? 'star' : 'star-outline'}
                      size={16}
                      color={item.rating >= s ? '#FFB800' : '#E5E7EB'}
                    />
                  ))}
                </View>
              </View>

              {item.comment ? (
                <View style={styles.commentBox}>
                  <MaterialCommunityIcons name="format-quote-open" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
                  <Text style={styles.commentText}>{item.comment}</Text>
                </View>
              ) : null}

              {item.timestamp?.toDate && (
                <Text style={styles.timestampText}>
                  {item.timestamp.toDate().toLocaleString('en-US', {
                    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              )}
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
  statsBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  divider: { width: 1, height: 34, backgroundColor: '#F3F4F6' },
  filtersRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#374151', marginTop: 18 },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
  feedbackCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  studentId: { fontSize: 13, fontWeight: '700', color: '#111827' },
  categoryBadge: {
    backgroundColor: '#FFF0E5', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginTop: 4, alignSelf: 'flex-start',
  },
  categoryText: { fontSize: 11, fontWeight: '700', color: '#FF7A00' },
  starsRow: { flexDirection: 'row', gap: 2 },
  commentBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB',
    borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  commentText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  timestampText: { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
});
