import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../src/firebase/firebaseConfig';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withRepeat, 
  withSequence, 
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    let totalDuration = 1000;
    let incrementTime = Math.max(10, Math.abs(Math.floor(totalDuration / end)));
    
    let timer = setInterval(() => {
      start += Math.ceil(end / 20) || 1; 
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setDisplayValue(start);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <Text style={styles.statValue}>{displayValue}</Text>;
};

const ShimmerSkeleton = () => {
  return (
    <MotiView
      transition={{ type: 'timing', duration: 1500, loop: true }}
      from={{ opacity: 0.3 }}
      animate={{ opacity: 0.8 }}
      style={styles.skeletonCard}
    />
  );
};

const StatCard = ({ title, value, icon, delay, loading }: any) => {
  const scale = useSharedValue(1);
  const idleY = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      idleY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 2500 }),
          withTiming(0, { duration: 2500 })
        ),
        -1, true
      );
    }, delay + 500);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: idleY.value }],
  }));

  if (loading) {
    return (
      <View style={{ width: '48%', marginBottom: 15 }}>
        <ShimmerSkeleton />
      </View>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay }}
      style={{ width: '48%', marginBottom: 15 }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon} size={28} color="#FF7A00" />
          </View>
          <AnimatedCounter value={value} />
          <Text style={styles.statTitle}>{title}</Text>
          <View style={styles.progressBarContainer}>
            <MotiView 
              from={{ width: '0%' }} 
              animate={{ width: '100%' }} 
              transition={{ type: 'timing', duration: 1500, delay: delay + 200 }} 
              style={styles.progressBar} 
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </MotiView>
  );
};

const QuickActionCard = ({ title, icon, route, delay }: any) => {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, delay }}
      style={{ width: '23%', aspectRatio: 1, marginBottom: 10 }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(route)}
        onPressIn={() => { scale.value = withSpring(0.9); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={{ flex: 1 }}
      >
        <Animated.View style={[styles.actionCard, animatedStyle]}>
          <MaterialCommunityIcons name={icon} size={26} color="#FFFFFF" />
          <Text style={styles.actionTitle} numberOfLines={2}>{title}</Text>
        </Animated.View>
      </TouchableOpacity>
    </MotiView>
  );
};

const ExpandableFAB = () => {
  const router = useRouter();
  const isOpen = useSharedValue(false);
  const rotation = useSharedValue(0);

  const toggle = () => {
    isOpen.value = !isOpen.value;
    rotation.value = withSpring(isOpen.value ? 45 : 0);
  };

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const action1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(isOpen.value ? -70 : 0) }, { scale: withSpring(isOpen.value ? 1 : 0) }],
    opacity: withTiming(isOpen.value ? 1 : 0),
    position: 'absolute'
  }));

  const action2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(isOpen.value ? -130 : 0) }, { scale: withSpring(isOpen.value ? 1 : 0) }],
    opacity: withTiming(isOpen.value ? 1 : 0),
    position: 'absolute'
  }));

  const action3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(isOpen.value ? -190 : 0) }, { scale: withSpring(isOpen.value ? 1 : 0) }],
    opacity: withTiming(isOpen.value ? 1 : 0),
    position: 'absolute'
  }));

  return (
    <View style={styles.fabContainer}>
        <Animated.View style={[styles.fabAction, action3Style]}>
          <TouchableOpacity onPress={() => { toggle(); router.push('/admin/activity-logs'); }} style={styles.fabSubBtn}>
            <MaterialCommunityIcons name="history" size={24} color="#FF7A00" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.fabAction, action2Style]}>
          <TouchableOpacity onPress={() => { toggle(); router.push('/admin/announcement-center'); }} style={styles.fabSubBtn}>
            <MaterialCommunityIcons name="bullhorn" size={24} color="#FF7A00" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.fabAction, action1Style]}>
          <TouchableOpacity onPress={() => { toggle(); router.push('/admin/manager-management'); }} style={styles.fabSubBtn}>
            <MaterialCommunityIcons name="account-plus" size={24} color="#FF7A00" />
          </TouchableOpacity>
        </Animated.View>

      <TouchableOpacity activeOpacity={0.8} onPress={toggle}>
        <Animated.View style={[styles.fabMain, fabStyle]}>
          <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    managers: 0,
    feedbacks: 0,
    pendingLeaves: 0,
  });

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    // Parallax effect: Header translates downward at half the scroll speed
    const translateY = interpolate(scrollY.value, [0, 300], [0, 150], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }],
    };
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const managersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'manager')));
        const feedbackSnap = await getDocs(collection(db, 'feedback'));
        const leaveSnap = await getDocs(query(collection(db, 'sickleave'), where('status', '==', 'pending')));

        setStats({ 
          students: studentSnap.size, 
          managers: managersSnap.size, 
          feedbacks: feedbackSnap.size, 
          pendingLeaves: leaveSnap.size, 
        });
        setTimeout(() => setLoading(false), 600); // slight delay for smooth shimmer effect
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        onScroll={scrollHandler} 
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <MotiView
            from={{ opacity: 0, translateY: -25 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={styles.headerTitleRow}
          >
            <MaterialCommunityIcons name="shield-crown" size={36} color="#FF7A00" />
            <View style={{ marginLeft: 15 }}>
              <Text variant="headlineMedium" style={styles.headerTitle}>Command Center</Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>System Overview & Quick Actions</Text>
            </View>
          </MotiView>
          <MotiView
            from={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
            style={styles.gradientStrip}
          />
        </Animated.View>

        <View style={styles.grid}>
          <StatCard title="Total Students" value={stats.students} icon="account-tie" delay={0} loading={loading} />
          <StatCard title="Active Managers" value={stats.managers} icon="shield-account" delay={120} loading={loading} />
          <StatCard title="Feedback Received" value={stats.feedbacks} icon="star-face" delay={240} loading={loading} />
          <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon="clock-alert-outline" delay={360} loading={loading} />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 500 }}
        >
          <Text style={styles.sectionTitle}>Operations Panel</Text>
          <View style={styles.actionGrid}>
            <QuickActionCard title="AI Forecast" icon="brain" route="/admin/food-demand-prediction" delay={500} />
            <QuickActionCard title="Broadcast" icon="bullhorn" route="/admin/announcement-center" delay={600} />
            <QuickActionCard title="Add Manager" icon="account-plus" route="/admin/manager-management" delay={700} />
            <QuickActionCard title="Live Logs" icon="history" route="/admin/activity-logs" delay={800} />
          </View>
        </MotiView>
        
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <ExpandableFAB />
    </View>
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
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: 10,
    zIndex: -1, 
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#111111',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#6B7280',
    marginTop: 2,
  },
  gradientStrip: {
    height: 4,
    backgroundColor: '#FF7A00',
    marginTop: 15,
    borderRadius: 2,
    shadowColor: '#FF7A00',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 1,
  },
  skeletonCard: {
    backgroundColor: '#FFF4EB',
    borderRadius: 18,
    height: 160,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#111111',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#FFE9D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    color: '#FF7A00',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 5,
  },
  statTitle: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF7A00',
    borderRadius: 2,
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionCard: {
    backgroundColor: '#FF7A00',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderWidth: 3,
    borderColor: '#111111',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMain: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7A00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  fabAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#111111',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  fabSubBtn: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
