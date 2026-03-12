import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Pressable,
  ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withRepeat, withSequence, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import StudentLayout from '../components/StudentLayout';
import { auth, db } from '../src/firebase/firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// ─── Shimmer Skeleton ──────────────────────────────────────────────────────────
function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true }}
      style={[skeletonStyles.card, { height }]}
    >
      <View style={skeletonStyles.line} />
      <View style={[skeletonStyles.line, { width: '60%', marginTop: 10 }]} />
    </MotiView>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = '₹' }: { target: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <Text style={styles.walletBalance}>{prefix}{display.toLocaleString('en-IN')}</Text>;
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
const FAB_ITEMS = [
  { label: 'Give Feedback', icon: 'message-star-outline', route: '/feedback', color: '#F59E0B' },
  { label: 'Sick Leave',    icon: 'medical-bag',          route: '/sickleave', color: '#EF4444' },
];

function StudentFAB() {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);

  const toggleFAB = () => {
    setOpen(prev => {
      rotation.value = withSpring(prev ? 0 : 1, { damping: 14 });
      return !prev;
    });
  };

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 45], Extrapolation.CLAMP)}deg` }],
  }));

  return (
    <View style={fabStyles.container} pointerEvents="box-none">
      <AnimatePresence>
        {open && FAB_ITEMS.map((item, i) => (
          <MotiView
            key={item.label}
            from={{ opacity: 0, translateY: 16, scale: 0.7 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            exit={{ opacity: 0, translateY: 16, scale: 0.7 }}
            transition={{ type: 'spring', delay: i * 70, damping: 16 }}
            style={fabStyles.itemRow}
          >
            <Pressable
              style={fabStyles.labelPill}
              onPress={() => { setOpen(false); router.push(item.route as any); }}
            >
              <Text style={fabStyles.labelText}>{item.label}</Text>
            </Pressable>
            <Pressable
              style={[fabStyles.miniBtn, { backgroundColor: item.color }]}
              onPress={() => { setOpen(false); router.push(item.route as any); }}
            >
              <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFF" />
            </Pressable>
          </MotiView>
        ))}
      </AnimatePresence>
      <Pressable onPress={toggleFAB} style={fabStyles.fab}>
        <Animated.View style={fabIconStyle}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── Quick Action Card (2×2 Grid) ────────────────────────────────────────────
const CARD_SIZE = (width - 48) / 2; // 16 padding each side + 16 gap

function ActionCard({ icon, label, onPress, color, bg }: {
  icon: string; label: string;
  onPress: () => void; color: string; bg: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={{ width: CARD_SIZE }}
    >
      <MotiView
        animate={{ scale: pressed ? 0.93 : 1 }}
        transition={{ type: 'spring', damping: 14 }}
        style={[styles.actionCard, { elevation: pressed ? 1 : 5 }]}
      >
        <View style={[styles.actionIconContainer, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon as any} size={30} color={color} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </MotiView>
    </Pressable>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [menuToday, setMenuToday] = useState<{ type: string; item: string }[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Parallax
  const scrollY = useSharedValue(0);
  const headerParallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 100], [0, -20], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, 80], [1, 0.85], Extrapolation.CLAMP),
  }));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  };

  // Pulse for wallet card
  const walletPulse = useSharedValue(1);
  useEffect(() => {
    walletPulse.value = withRepeat(
      withSequence(withTiming(1.015, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1, true
    );
  }, []);
  const walletPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: walletPulse.value }],
  }));

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) setUserData(userDoc.data());

        const menuDoc = await getDoc(doc(db, 'menus', 'today'));
        if (menuDoc.exists()) {
          const d = menuDoc.data();
          setMenuToday([
            { type: 'Breakfast', item: d.breakfast || 'Not set' },
            { type: 'Lunch',     item: d.lunch     || 'Not set' },
            { type: 'Dinner',    item: d.dinner    || 'Not set' },
          ]);
        } else {
          setMenuToday([
            { type: 'Breakfast', item: 'Idli + Sambar' },
            { type: 'Lunch',     item: 'Rice + Sambar' },
            { type: 'Dinner',    item: 'Chapati + Kurma' },
          ]);
        }

        const annSnap = await getDocs(collection(db, 'announcements'));
        setAnnouncements(
          !annSnap.empty
            ? annSnap.docs.map(d => d.data().message as string)
            : [
                'Mess Closed Tomorrow: Lunch will not be served.',
                'New Menu Item: Paneer Butter Masala for Friday!',
                'Reminder: Pay mess dues by end of the week.',
              ]
        );
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const weight = userData?.weight ?? 70;
  const calorieTarget = weight * 30;
  const proteinTarget = weight * 2;

  return (
    <StudentLayout title="Dashboard">
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* ── Greeting Header with parallax ── */}
          <Animated.View style={[styles.greetingContainer, headerParallaxStyle]}>
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, delay: 0 }}
            >
              <Text style={styles.greetingText}>
                Hello {loading ? '...' : userData?.name ?? 'Student'} 👋
              </Text>
              <Text style={styles.greetingSubtext}>Welcome back to Better Bites!</Text>
            </MotiView>
          </Animated.View>

          {/* ── Health Card ── */}
          {loading ? (
            <SkeletonCard height={140} />
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 200, damping: 16 }}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBg}>
                    <MaterialCommunityIcons name="heart-pulse" size={22} color="#EF4444" />
                  </View>
                  <Text style={styles.cardTitle}>Health Analytics</Text>
                </View>
                <View style={styles.healthContent}>
                  <View style={{ flex: 1.2, paddingRight: 16 }}>
                    {[
                      { label: 'Carbs 50%', scale: 0.5, color: '#FFB266', delay: 300 },
                      { label: 'Protein 30%', scale: 0.3, color: '#FF7A00', delay: 420 },
                      { label: 'Fats 20%', scale: 0.2, color: '#EF4444', delay: 540 },
                    ].map(bar => (
                      <View key={bar.label} style={{ marginBottom: 12 }}>
                        <Text style={styles.barLabel}>{bar.label}</Text>
                        <View style={styles.barTrack}>
                          <MotiView
                            from={{ scaleX: 0 }}
                            animate={{ scaleX: bar.scale }}
                            transition={{ type: 'timing', duration: 1000, delay: bar.delay }}
                            style={[styles.barFill, { backgroundColor: bar.color, transformOrigin: 'left' as any }]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Calories</Text>
                      <Text style={styles.statValue}>{calorieTarget} kcal</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Protein</Text>
                      <Text style={styles.statValue}>{proteinTarget}g</Text>
                    </View>
                  </View>
                </View>
              </View>
            </MotiView>
          )}

          {/* ── Today's Menu Card ── */}
          {loading ? (
            <SkeletonCard height={160} />
          ) : (
            <MotiView
              from={{ opacity: 0, translateX: 60 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: 350, damping: 16 }}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconBg, { backgroundColor: '#D1FAE5' }]}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#10B981" />
                  </View>
                  <Text style={styles.cardTitle}>Today's Menu</Text>
                </View>
                {menuToday.map((meal, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, translateX: 20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'spring', delay: 500 + i * 100, damping: 18 }}
                    style={styles.menuRow}
                  >
                    <Text style={styles.menuType}>{meal.type}</Text>
                    <Text style={styles.menuItem} numberOfLines={1}>{meal.item}</Text>
                  </MotiView>
                ))}
              </View>
            </MotiView>
          )}

          {/* ── Wallet Card ── */}
          {loading ? (
            <SkeletonCard height={130} />
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 500, damping: 14 }}
            >
              <Pressable onPress={() => router.push('/wallet')}>
                {({ pressed }) => (
                  <MotiView
                    animate={{ scale: pressed ? 0.97 : 1 }}
                    transition={{ type: 'spring', damping: 14 }}
                  >
                    <Animated.View style={[styles.walletCard, walletPulseStyle]}>
                      <View style={styles.walletHeader}>
                        <View>
                          <Text style={styles.walletLabel}>Wallet Balance</Text>
                          <AnimatedCounter target={userData?.walletBalance ?? 0} />
                        </View>
                        <MotiView
                          from={{ rotate: '-20deg', scale: 0.7 }}
                          animate={{ rotate: '0deg', scale: 1 }}
                          transition={{ type: 'spring', delay: 600 }}
                        >
                          <MaterialCommunityIcons name="wallet" size={44} color="#FF7A00" />
                        </MotiView>
                      </View>
                      <View style={styles.walletFooter}>
                        <Text style={styles.walletFooterText}>Tap to view transactions</Text>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#10B981" />
                      </View>
                    </Animated.View>
                  </MotiView>
                )}
              </Pressable>
            </MotiView>
          )}

          {/* ── Quick Actions ── */}
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 650, damping: 14 }}
            style={styles.sectionContainer}
          >
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.gridContainer}>
              {[
                { icon: 'food-outline',         label: 'View Menu',    route: '/menu',      color: '#10B981', bg: '#D1FAE5' },
                { icon: 'message-star-outline', label: 'Give Feedback', route: '/feedback',  color: '#F59E0B', bg: '#FEF3C7' },
                { icon: 'medical-bag',          label: 'Sick Leave',   route: '/sickleave', color: '#EF4444', bg: '#FEE2E2' },
                { icon: 'account-outline',      label: 'My Profile',   route: '/profile',   color: '#6366F1', bg: '#EEF2FF' },
              ].map((a, i) => (
                <MotiView
                  key={a.label}
                  from={{ opacity: 0, translateY: 24, scale: 0.88 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{ type: 'spring', delay: 700 + i * 90, damping: 14 }}
                >
                  <ActionCard
                    {...a}
                    onPress={() => router.push(a.route as any)}
                  />
                </MotiView>
              ))}
            </View>
          </MotiView>

          {/* ── Announcements ── */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', delay: 950, duration: 500 }}
            style={[styles.sectionContainer, { marginBottom: 100 }]}
          >
            <Text style={styles.sectionTitle}>Announcements</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width * 0.78 + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {announcements.map((ann, i) => (
                <MotiView
                  key={i}
                  from={{ opacity: 0, translateX: 30 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', delay: 1000 + i * 120, damping: 16 }}
                  style={styles.announcementCard}
                >
                  <View style={styles.announcementHeader}>
                    <MaterialCommunityIcons name="bullhorn-outline" size={18} color="#FF7A00" />
                    <Text style={styles.announcementTitle}>Notice</Text>
                  </View>
                  <Text style={styles.announcementBody}>{ann}</Text>
                </MotiView>
              ))}
            </ScrollView>
          </MotiView>
        </ScrollView>

        {/* Floating Action Button */}
        <StudentFAB />
      </View>
    </StudentLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  greetingContainer: { marginBottom: 24, marginTop: 8 },
  greetingText: { fontSize: 28, fontWeight: '800', color: '#111827' },
  greetingSubtext: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconBg: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  healthContent: { flexDirection: 'row', alignItems: 'center' },
  barLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  barTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  statRow: { marginBottom: 10 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  statValue: { fontSize: 17, fontWeight: '800', color: '#FF7A00' },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  menuType: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
  menuItem: { fontSize: 15, fontWeight: '700', color: '#111827', maxWidth: '55%', textAlign: 'right' },
  walletCard: {
    backgroundColor: '#111827', borderRadius: 24, padding: 24, marginBottom: 16,
    elevation: 8, shadowColor: '#FF7A00', shadowOpacity: 0.15,
    shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletLabel: { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  walletBalance: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  walletFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1F2937', padding: 12, borderRadius: 10,
  },
  walletFooterText: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  sectionContainer: { marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 14 },
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', gap: 16,
  },
  actionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingVertical: 22, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  actionIconContainer: {
    width: 62, height: 62, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#111827', textAlign: 'center' },
  announcementCard: {
    width: width * 0.78, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16,
    marginRight: 16, borderLeftWidth: 4, borderLeftColor: '#F59E0B',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  announcementHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  announcementTitle: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  announcementBody: { fontSize: 14, color: '#92400E', lineHeight: 20 },
});

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F4F6', borderRadius: 20, padding: 20, marginBottom: 16,
    justifyContent: 'center',
  },
  line: {
    height: 14, backgroundColor: '#E5E7EB', borderRadius: 7, width: '80%',
  },
});

const fabStyles = StyleSheet.create({
  container: { position: 'absolute', right: 20, bottom: 28, alignItems: 'flex-end' },
  fab: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: '#FF7A00',
    alignItems: 'center', justifyContent: 'center', elevation: 8,
    shadowColor: '#FF7A00', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  labelPill: {
    backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  labelText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  miniBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
});
