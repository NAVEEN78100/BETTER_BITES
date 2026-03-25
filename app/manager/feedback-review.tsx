import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

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
  sentiment?: string;
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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<any>(null);

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

  const analyzeFeedbackLocally = (list: string[]) => {
    let positive = 0;
    let negative = 0;

    let foodStats: Record<string, { pos: number; neg: number }> = {};

    list.forEach(text => {
      if (!text) return;
      const lower = text.toLowerCase();
      const isPositive = lower.includes("good") || lower.includes("tasty") || lower.includes("nice");
      const isNegative = lower.includes("bad") || lower.includes("salty") || lower.includes("worst");
      const foods = ["idli", "sambar", "rice", "chapati", "paneer", "upma"];

      foods.forEach(food => {
        if (lower.includes(food)) {
          if (!foodStats[food]) {
            foodStats[food] = { pos: 0, neg: 0 };
          }
          if (isPositive) {
            foodStats[food].pos++;
            positive++;
          }
          if (isNegative) {
            foodStats[food].neg++;
            negative++;
          }
        }
      });
    });

    let mostLoved = "None";
    let mostCriticized = "None";

    let maxPos = 0;
    let maxNeg = 0;

    Object.keys(foodStats).forEach(food => {
      if (foodStats[food].pos > maxPos) {
        maxPos = foodStats[food].pos;
        mostLoved = food.charAt(0).toUpperCase() + food.slice(1);
      }
      if (foodStats[food].neg > maxNeg) {
        maxNeg = foodStats[food].neg;
        mostCriticized = food.charAt(0).toUpperCase() + food.slice(1);
      }
    });

    const positivity = (positive + negative > 0) ? Math.round((positive / (positive + negative)) * 100) : 0;

    return {
      positivity,
      mostLoved,
      mostCriticized,
      suggestions: [
        `Repeat ${mostLoved}`,
        `Improve or remove ${mostCriticized}`
      ]
    };
  };

  const handleAnalyzeFeedback = async () => {
    setIsAnalyzing(true);
    setInsights(null);

    try {
      // 1. Fetch all feedback from Firestore
      const snapshot = await getDocs(collection(db, "feedback"));
      const rawComments = snapshot.docs.map(doc => doc.data().comment || '');
      const validComments = rawComments.filter(c => c.trim().length > 0);

      // If no feedback exists
      if (validComments.length === 0) {
        Alert.alert("No feedback available");
        setIsAnalyzing(false);
        return;
      }

      let result;
      let apiSuccess = false;

      // Add artificial delay for the loader effect since we often rely on fallback locally
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Try Calling API
      try {
        const response = await fetch("http://10.0.2.2:5000/analyze-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: validComments })
        });
        if (!response.ok) throw new Error("API failed");
        result = await response.json();
        apiSuccess = true;
      } catch (error) {
        console.log(error);
        Alert.alert("AI analysis failed. Showing fallback insights.");
      }

      const finalResult = apiSuccess ? result : analyzeFeedbackLocally(validComments);
      setInsights(finalResult);

    } catch (error) {
      console.log(error);
      Alert.alert("An error occurred fetching feedbacks.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ManagerLayout title="Feedback Review">
      <View style={{ flex: 1 }}>
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

        {/* AI Analyze Button */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 200, damping: 14 }}
        >
          <Pressable onPress={handleAnalyzeFeedback} disabled={isAnalyzing}>
            {({ pressed }) => (
              <MotiView
                animate={{ scale: pressed ? 0.95 : 1, opacity: isAnalyzing ? 0.7 : 1 }}
                transition={{ type: 'spring', damping: 15 }}
                style={styles.aiButton}
              >
                <MaterialCommunityIcons name="brain" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.aiButtonLabel}>
                  {isAnalyzing ? 'Analyzing Sentiments...' : 'Analyze Feedback with AI Model'}
                </Text>
              </MotiView>
            )}
          </Pressable>
        </MotiView>

        {/* AI Insights Card */}
        <AnimatePresence>
          {insights && (
            <MotiView
              from={{ opacity: 0, scale: 0.95, translateY: 10 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, translateY: 10 }}
              transition={{ type: 'spring', damping: 16 }}
              style={styles.insightsCard}
            >
              <View style={styles.insightsHeader}>
                <Text style={styles.insightsTitle}>✨ AI Insights</Text>
                <View style={styles.sentimentBadge}>
                  <Text style={styles.sentimentBadgeText}>{insights.positivity}% Positivity</Text>
                </View>
              </View>

              <View style={styles.foodRow}>
                <View style={[styles.foodBox, { borderColor: '#10B98122', backgroundColor: '#10B98111' }]}>
                  <Text style={styles.foodLabel}>Loved Food ❤️</Text>
                  <Text style={styles.foodValue}>{insights.mostLoved}</Text>
                </View>
                <View style={[styles.foodBox, { borderColor: '#EF444422', backgroundColor: '#EF444411' }]}>
                  <Text style={styles.foodLabel}>Criticized Food 💔</Text>
                  <Text style={styles.foodValue}>{insights.mostCriticized}</Text>
                </View>
              </View>

              <Text style={styles.insightsSubTitle}>Actionable Recommendations</Text>
              {insights.suggestions && insights.suggestions.map((action: string, i: number) => (
                <View key={i} style={styles.insightItem}>
                  <MaterialCommunityIcons name="lightbulb-on" size={16} color="#F59E0B" />
                  <Text style={styles.insightActionText}>{action}</Text>
                </View>
              ))}
            </MotiView>
          )}
        </AnimatePresence>

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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    {item.sentiment && (
                      <View style={[
                        styles.sentimentTag, 
                        { backgroundColor: item.sentiment === 'Positive' ? '#D1FAE5' : '#FEE2E2' }
                      ]}>
                        <MaterialCommunityIcons 
                          name={item.sentiment === 'Positive' ? "emoticon-happy-outline" : "emoticon-sad-outline"} 
                          size={12} 
                          color={item.sentiment === 'Positive' ? "#10B981" : "#EF4444"} 
                        />
                        <Text style={[styles.sentimentTagText, { color: item.sentiment === 'Positive' ? "#10B981" : "#EF4444" }]}>
                          {item.sentiment}
                        </Text>
                      </View>
                    )}
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
        {/* Analyzing Overlay Component */}
        <AnimatePresence>
          {isAnalyzing && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.loadingOverlay}
            >
              <LottieView
                source={require('../../assets/spinner.json')}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
              <Text style={styles.loadingText}>Analyzing Feedbacks via ML model...</Text>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
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
  aiButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6366F1', // deep indigo suitable for AI
    borderRadius: 14, paddingVertical: 14, elevation: 6,
    shadowColor: '#6366F1', shadowOpacity: 0.8, shadowRadius: 15, shadowOffset: { width: 0, height: 6 },
    marginBottom: 20
  },
  aiButtonLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  insightsCard: {
    backgroundColor: '#1E1E2E', // slightly different dark background
    borderRadius: 20, padding: 20, marginBottom: 20,
    elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    borderColor: '#333346', borderWidth: 1
  },
  insightsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  insightsTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  sentimentBadge: { backgroundColor: '#4ade8022', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sentimentBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#4ade80' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  foodBox: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, elevation: 2 },
  foodLabel: { fontSize: 13, color: '#A1A1AA', marginBottom: 6 },
  foodValue: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' },
  insightsSubTitle: { fontSize: 14, fontWeight: '700', color: '#A78BFA', marginBottom: 12 },
  insightItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  insightActionText: { flex: 1, fontSize: 14, color: '#D1D5DB', lineHeight: 20 },
  sentimentTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start',
  },
  sentimentTagText: { fontSize: 11, fontWeight: '700' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 11, 0.85)',
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 16,
  },
});
