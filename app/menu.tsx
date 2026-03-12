import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable,
} from 'react-native';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import StudentLayout from '../components/StudentLayout';
import { db } from '../src/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const mealConfig = [
  { key: 'breakfast', type: 'Breakfast', icon: 'coffee-outline', time: '07:30 – 09:00 AM', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'lunch',     type: 'Lunch',     icon: 'rice',           time: '12:30 – 02:00 PM', color: '#10B981', bg: '#D1FAE5' },
  { key: 'snacks',    type: 'Snacks',    icon: 'cookie-outline', time: '04:30 – 05:30 PM', color: '#F97316', bg: '#FFEDD5' },
  { key: 'dinner',    type: 'Dinner',    icon: 'weather-night',  time: '07:30 – 09:00 PM', color: '#6366F1', bg: '#EEF2FF' },
];

function SkeletonCard() {
  return (
    <MotiView
      from={{ opacity: 0.4 }} animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true }}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '50%', marginTop: 10 }]} />
    </MotiView>
  );
}

function MealCard({ meal, items, index }: {
  meal: typeof mealConfig[0]; items: string[]; index: number;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 150 + 200, damping: 18, stiffness: 90 }}
    >
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <MotiView
          animate={{ scale: pressed ? 0.97 : 1 }}
          transition={{ type: 'spring', damping: 14 }}
          style={[styles.mealCard, { elevation: pressed ? 2 : 5, borderLeftColor: meal.color }]}
        >
          {/* Header */}
          <View style={styles.mealHeader}>
            <View style={[styles.mealIconBg, { backgroundColor: meal.bg }]}>
              <MaterialCommunityIcons name={meal.icon as any} size={26} color={meal.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.mealTitle}>{meal.type}</Text>
              <View style={styles.timeRow}>
                <MaterialCommunityIcons name="clock-outline" size={13} color="#9CA3AF" />
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
            </View>
            <View style={[styles.countBadge, { backgroundColor: meal.bg }]}>
              <Text style={[styles.countText, { color: meal.color }]}>{items.length}</Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.itemsContainer}>
            {items.map((item, i) => (
              <MotiView
                key={i}
                from={{ opacity: 0, translateX: 12 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', delay: index * 150 + i * 60 + 400, duration: 300 }}
                style={styles.itemRow}
              >
                <View style={[styles.itemDot, { backgroundColor: meal.color }]} />
                <Text style={styles.itemText}>{item}</Text>
              </MotiView>
            ))}
          </View>
        </MotiView>
      </Pressable>
    </MotiView>
  );
}

export default function MenuScreen() {
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<Record<string, string[]>>({});

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'menus', 'today'));
        const parsed: Record<string, string[]> = {};
        if (snap.exists()) {
          const d = snap.data();
          mealConfig.forEach(({ key }) => {
            const val = d[key];
            if (Array.isArray(val)) parsed[key] = val;
            else if (typeof val === 'string' && val.trim()) parsed[key] = val.split(',').map(s => s.trim());
            else parsed[key] = ['Not set'];
          });
        } else {
          Object.assign(parsed, {
            breakfast: ['Idli', 'Sambar', 'Coconut Chutney', 'Tea'],
            lunch:     ['Rice', 'Sambar', 'Rasam', 'Poriyal', 'Buttermilk'],
            snacks:    ['Samosa', 'Tea'],
            dinner:    ['Chapati', 'Kurma', 'Dal Fry', 'Banana'],
          });
        }
        setMenuData(parsed);
      } catch (e) {
        setMenuData({
          breakfast: ['Idli', 'Sambar', 'Tea'],
          lunch:     ['Rice', 'Sambar', 'Buttermilk'],
          snacks:    ['Samosa', 'Tea'],
          dinner:    ['Chapati', 'Dal Fry'],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <StudentLayout title="Today's Menu">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header Banner */}
        <MotiView
          from={{ opacity: 0, translateY: -16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16 }}
          style={styles.headerBanner}
        >
          <View>
            <Text style={styles.dateText}>{today}</Text>
            <Text style={styles.messText}>Mess 1 — Vegetarian</Text>
          </View>
          <MotiView
            from={{ rotate: '-20deg', scale: 0.7 }}
            animate={{ rotate: '0deg', scale: 1 }}
            transition={{ type: 'spring', delay: 300 }}
          >
            <MaterialCommunityIcons name="silverware-fork-knife" size={38} color="#FF7A00" />
          </MotiView>
        </MotiView>

        {loading
          ? mealConfig.map((_, i) => <SkeletonCard key={i} />)
          : mealConfig.map((meal, i) => (
              <MealCard
                key={meal.key}
                meal={meal}
                items={menuData[meal.key] ?? ['Not set']}
                index={i}
              />
            ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerBanner: {
    backgroundColor: '#111827', borderRadius: 20, padding: 20, marginBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  dateText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  messText: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  mealCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 16,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
    borderLeftWidth: 5, overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12,
  },
  mealIconBg: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  mealTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  mealTime: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  countBadge: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontSize: 14, fontWeight: '900' },
  itemsContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  itemDot: { width: 7, height: 7, borderRadius: 4, marginRight: 12 },
  itemText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  skeletonCard: {
    backgroundColor: '#F3F4F6', borderRadius: 18, padding: 20,
    marginBottom: 16, height: 130, justifyContent: 'center',
  },
  skeletonLine: { height: 14, backgroundColor: '#E5E7EB', borderRadius: 7, width: '80%' },
});
