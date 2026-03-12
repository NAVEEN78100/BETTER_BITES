import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withDelay, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import { router } from 'expo-router';

import ManagerLayout from '../../components/ManagerLayout';
import { db } from '../../src/firebase/firebaseConfig';
import {
  collection, getDocs, query, where, getCountFromServer,
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

// ─── FAB config ──────────────────────────────────────────────────────────────
const FAB_ACTIONS = [
  { label: 'Edit Menu',      icon: 'silverware-fork-knife', route: '/manager/menu-management',        color: '#10B981' },
  { label: 'Announcement',   icon: 'bullhorn-outline',       route: '/manager/announcement-management', color: '#6366F1' },
  { label: 'Review Feedback',icon: 'message-star-outline',  route: '/manager/feedback-review',         color: '#F59E0B' },
];

const QUICK_ACTIONS = [
  { label: 'Edit Menu',       icon: 'silverware-fork-knife', route: '/manager/menu-management',         color: '#10B981', bg: '#D1FAE5' },
  { label: 'Leave Requests',  icon: 'medical-bag',           route: '/manager/leave-requests',          color: '#6366F1', bg: '#E0E7FF' },
  { label: 'Feedback',        icon: 'message-star-outline',  route: '/manager/feedback-review',         color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Announcements',   icon: 'bullhorn-outline',       route: '/manager/announcement-management', color: '#EF4444', bg: '#FEE2E2' },
];

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
interface BarData { label: string; value: number; color: string; }

function MiniBarChart({ data, title }: { data: BarData[]; title: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <Card style={chartStyles.card}>
      <Text style={chartStyles.title}>{title}</Text>
      <View style={chartStyles.barsRow}>
        {data.map((bar, i) => {
          const pct = bar.value / maxVal;
          return (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.barValue}>{bar.value}</Text>
              <View style={chartStyles.barTrack}>
                <MotiView
                  from={{ height: 0 }}
                  animate={{ height: `${Math.max(pct * 100, 4)}%` as any }}
                  transition={{ type: 'timing', duration: 900, delay: i * 120 }}
                  style={[chartStyles.barFill, { backgroundColor: bar.color }]}
                />
              </View>
              <Text style={chartStyles.barLabel}>{bar.label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────
function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);

  const toggle = useCallback(() => {
    setOpen(prev => {
      rotation.value = withSpring(prev ? 0 : 1, { damping: 14, stiffness: 180 });
      return !prev;
    });
  }, []);

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${interpolate(rotation.value, [0, 1], [0, 45], Extrapolation.CLAMP)}deg`,
    }],
  }));

  return (
    <View style={fabStyles.container} pointerEvents="box-none">
      {/* Action Buttons */}
      <AnimatePresence>
        {open && FAB_ACTIONS.map((action, i) => (
          <MotiView
            key={action.label}
            from={{ opacity: 0, translateY: 20, scale: 0.7 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            exit={{ opacity: 0, translateY: 20, scale: 0.7 }}
            transition={{ type: 'spring', delay: i * 70, damping: 16 }}
            style={fabStyles.actionRow}
          >
            <Pressable
              onPress={() => { setOpen(false); router.push(action.route as any); }}
              style={fabStyles.labelPill}
            >
              <Text style={fabStyles.labelText}>{action.label}</Text>
            </Pressable>
            <Pressable
              onPress={() => { setOpen(false); router.push(action.route as any); }}
              style={[fabStyles.miniBtn, { backgroundColor: action.color }]}
            >
              <MaterialCommunityIcons name={action.icon as any} size={20} color="#FFF" />
            </Pressable>
          </MotiView>
        ))}
      </AnimatePresence>

      {/* Main FAB */}
      <Pressable onPress={toggle} style={fabStyles.fab}>
        <Animated.View style={fabIconStyle}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ label: string; value: string | number; icon: string; color: string; bg: string; }[]>([]);
  const [ratingChart, setRatingChart] = useState<BarData[]>([]);
  const [leaveChart, setLeaveChart] = useState<BarData[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [studentsSnap, pendingSnap, feedbackSnap, menuSnap, fbDocs, leaveDocs] =
          await Promise.all([
            getCountFromServer(collection(db, 'users')),
            getCountFromServer(query(collection(db, 'sickleave'), where('status', '==', 'pending'))),
            getCountFromServer(collection(db, 'feedback')),
            getDocs(query(collection(db, 'menus'))),
            getDocs(collection(db, 'feedback')),
            getDocs(collection(db, 'sickleave')),
          ]);

        setStats([
          { label: 'Students',      value: studentsSnap.data().count, icon: 'account-group',        color: '#6366F1', bg: '#E0E7FF' },
          { label: 'Pending Leaves',value: pendingSnap.data().count,  icon: 'medical-bag',           color: '#EF4444', bg: '#FEE2E2' },
          { label: 'Feedback',      value: feedbackSnap.data().count, icon: 'message-star-outline',  color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'Menu Status',   value: !menuSnap.empty ? '✓' : '—', icon: 'silverware-fork-knife', color: '#10B981', bg: '#D1FAE5' },
        ]);

        // Build rating distribution chart
        const ratingCounts = [1, 2, 3, 4, 5].map(r => ({
          label: `★${r}`,
          value: fbDocs.docs.filter(d => d.data().rating === r).length,
          color: r <= 2 ? '#EF4444' : r === 3 ? '#F59E0B' : '#10B981',
        }));
        setRatingChart(ratingCounts);

        // Build leave status chart
        const statuses = ['pending', 'approved', 'rejected'];
        const statusColors = ['#F59E0B', '#10B981', '#EF4444'];
        setLeaveChart(
          statuses.map((s, i) => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            value: leaveDocs.docs.filter(d => d.data().status === s).length,
            color: statusColors[i],
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ManagerLayout title="Dashboard">
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

          {/* Welcome Banner */}
          <MotiView
            from={{ opacity: 0, translateY: -16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 16 }}
            style={styles.banner}
          >
            <View>
              <Text style={styles.bannerGreeting}>Good day, Manager 👨‍🍳</Text>
              <Text style={styles.bannerSub}>Here's what's happening today</Text>
            </View>
            <MotiView
              from={{ rotate: '-15deg', scale: 0.7 }}
              animate={{ rotate: '0deg', scale: 1 }}
              transition={{ type: 'spring', delay: 300 }}
            >
              <MaterialCommunityIcons name="chef-hat" size={48} color="#FF7A00" />
            </MotiView>
          </MotiView>

          {/* Stats Grid */}
          <Text style={styles.sectionTitle}>Overview</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#FF7A00" style={{ marginVertical: 32 }} />
          ) : (
            <>
              <View style={styles.statsGrid}>
                {stats.map((stat, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, translateY: 30, scale: 0.88 }}
                    animate={{ opacity: 1, translateY: 0, scale: 1 }}
                    transition={{ type: 'spring', delay: i * 110, damping: 14 }}
                    style={{ width: '47%' }}
                  >
                    <PressableStatCard stat={stat} />
                  </MotiView>
                ))}
              </View>

              {/* Charts Row */}
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Analytics</Text>
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', delay: 550, damping: 16 }}
              >
                <MiniBarChart
                  title="📊 Feedback Ratings Distribution"
                  data={ratingChart}
                />
              </MotiView>
              <MotiView
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', delay: 700, damping: 16 }}
              >
                <MiniBarChart
                  title="🏥 Leave Request Status"
                  data={leaveChart}
                />
              </MotiView>

              {/* Quick Actions */}
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {QUICK_ACTIONS.map((action, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, translateY: 24 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', delay: i * 90 + 800, damping: 14 }}
                    style={{ width: '47%' }}
                  >
                    <ActionCard {...action} />
                  </MotiView>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <FloatingActionButton />
      </View>
    </ManagerLayout>
  );
}

// ─── Pressable Stat Card ──────────────────────────────────────────────────────
function PressableStatCard({ stat }: { stat: any }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      <MotiView
        animate={{ scale: pressed ? 0.95 : 1, translateY: pressed ? 2 : 0 }}
        transition={{ type: 'timing', duration: 120 }}
        style={[styles.statCard, { elevation: pressed ? 1 : 4 }]}
      >
        <View style={[styles.statIconBg, { backgroundColor: stat.bg }]}>
          <MaterialCommunityIcons name={stat.icon} size={26} color={stat.color} />
        </View>
        <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </MotiView>
    </Pressable>
  );
}

function ActionCard({ label, icon, route, color, bg }: any) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => router.push(route)}
    >
      <MotiView
        animate={{ scale: pressed ? 0.94 : 1 }}
        transition={{ type: 'timing', duration: 110 }}
        style={[styles.actionCard, { elevation: pressed ? 1 : 3 }]}
      >
        <View style={[styles.actionIconBg, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={30} color={color} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </MotiView>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  banner: {
    backgroundColor: '#111827', borderRadius: 20, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 28, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  bannerGreeting: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  bannerSub: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    alignItems: 'center',
  },
  statIconBg: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 4, textAlign: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  actionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  actionIconBg: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'center' },
});

const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 16 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 100 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  barTrack: {
    width: 28, height: 80, backgroundColor: '#F3F4F6', borderRadius: 8,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 6, textAlign: 'center' },
});

const fabStyles = StyleSheet.create({
  container: {
    position: 'absolute', right: 20, bottom: 28,
    alignItems: 'flex-end',
  },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#FF7A00',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#FF7A00', shadowOpacity: 0.4,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12,
  },
  labelPill: {
    backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginRight: 10, elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  labelText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  miniBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
});
