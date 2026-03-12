import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';

import ManagerLayout from '../../components/ManagerLayout';
import { db } from '../../src/firebase/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface Meal { key: string; label: string; icon: string; color: string; placeholder: string; }

const MEALS: Meal[] = [
  { key: 'breakfast', label: 'Breakfast',  icon: 'coffee-outline',  color: '#F59E0B', placeholder: 'e.g. Idli, Sambar, Tea' },
  { key: 'lunch',     label: 'Lunch',      icon: 'rice',            color: '#10B981', placeholder: 'e.g. Rice, Sambar, Rasam' },
  { key: 'snacks',    label: 'Snacks',     icon: 'cookie-outline',  color: '#F97316', placeholder: 'e.g. Samosa, Tea' },
  { key: 'dinner',    label: 'Dinner',     icon: 'weather-night',   color: '#6366F1', placeholder: 'e.g. Chapati, Kurma, Dal' },
];

// ─── Animated Toast ──────────────────────────────────────────────────────────
function SuccessToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, translateY: -24, scale: 0.88 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          exit={{ opacity: 0, translateY: -24, scale: 0.88 }}
          transition={{ type: 'spring', damping: 18 }}
          style={toastStyles.toast}
        >
          <MotiView
            from={{ rotate: '0deg' }}
            animate={{ rotate: '360deg' }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
          </MotiView>
          <Text style={toastStyles.text}>Today's menu updated successfully!</Text>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

// ─── Expandable Meal Card ─────────────────────────────────────────────────────
function MealCard({
  meal, value, onChange, index,
}: {
  meal: Meal; value: string; onChange: (v: string) => void; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const cardElevation = useSharedValue(3);

  const cardStyle = useAnimatedStyle(() => ({
    shadowOpacity: withTiming(expanded ? 0.12 : 0.06, { duration: 200 }),
  }));

  const toggleExpand = () => {
    setExpanded(prev => !prev);
    cardElevation.value = withSpring(expanded ? 3 : 6);
  };

  const isSet = value.trim().length > 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 28 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 120, damping: 16 }}
    >
      <Animated.View style={[cardStyles.card, cardStyle, expanded && cardStyles.cardExpanded]}>
        {/* Header Row */}
        <Pressable onPress={toggleExpand} style={cardStyles.header}>
          <View style={[cardStyles.iconBg, { backgroundColor: meal.color + '1A' }]}>
            <MaterialCommunityIcons name={meal.icon as any} size={22} color={meal.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={cardStyles.mealLabel}>{meal.label}</Text>
            {!expanded && (
              <Text style={isSet ? cardStyles.preview : cardStyles.emptyHint} numberOfLines={1}>
                {isSet ? value : 'Tap to add items…'}
              </Text>
            )}
          </View>
          <View style={cardStyles.rightRow}>
            {isSet && <View style={[cardStyles.dot, { backgroundColor: meal.color }]} />}
            <MotiView
              animate={{ rotate: expanded ? '180deg' : '0deg' }}
              transition={{ type: 'spring', damping: 14 }}
            >
              <MaterialCommunityIcons name="chevron-down" size={22} color="#9CA3AF" />
            </MotiView>
          </View>
        </Pressable>

        {/* Expandable Input */}
        <AnimatePresence>
          {expanded && (
            <MotiView
              from={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
              style={{ transformOrigin: 'top' } as any}
            >
              <View style={cardStyles.editPanel}>
                <Text style={cardStyles.hint}>Separate items with commas (e.g. Idli, Sambar, Chutney)</Text>
                <View style={[cardStyles.inputWrap, focused && { borderColor: meal.color }]}>
                  <TextInput
                    style={cardStyles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={meal.placeholder}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                  />
                </View>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </Animated.View>
    </MotiView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MenuManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [menuData, setMenuData] = useState<Record<string, string>>({
    breakfast: '', lunch: '', snacks: '', dinner: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'menus', 'today'));
        if (snap.exists()) {
          const d = snap.data();
          setMenuData({
            breakfast: Array.isArray(d.breakfast) ? d.breakfast.join(', ') : (d.breakfast ?? ''),
            lunch:     Array.isArray(d.lunch)     ? d.lunch.join(', ')     : (d.lunch ?? ''),
            snacks:    Array.isArray(d.snacks)    ? d.snacks.join(', ')    : (d.snacks ?? ''),
            dinner:    Array.isArray(d.dinner)    ? d.dinner.join(', ')    : (d.dinner ?? ''),
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'menus', 'today'), { ...menuData, updatedAt: serverTimestamp() });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <ManagerLayout title="Menu Management">
      <View style={{ flex: 1 }}>
        {/* Toast */}
        <View style={toastStyles.wrapper} pointerEvents="none">
          <SuccessToast visible={showToast} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          {/* Info Banner */}
          <MotiView
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.infoBanner}
          >
            <MaterialCommunityIcons name="information-outline" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Tap a meal card to expand and edit. Changes reflect on student screens instantly after saving.
            </Text>
          </MotiView>

          {loading ? (
            <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 40 }} />
          ) : (
            <>
              {MEALS.map((meal, i) => (
                <MealCard
                  key={meal.key}
                  meal={meal}
                  value={menuData[meal.key]}
                  onChange={val => setMenuData(prev => ({ ...prev, [meal.key]: val }))}
                  index={i}
                />
              ))}

              {/* Save Button */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 600 }}
                style={{ marginTop: 8 }}
              >
                <Button
                  mode="contained"
                  style={styles.saveBtn}
                  labelStyle={styles.saveBtnLabel}
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving}
                  icon="content-save-outline"
                >
                  Save Today's Menu
                </Button>
              </MotiView>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ManagerLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EEF2FF', padding: 14, borderRadius: 14,
    marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#6366F1',
  },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 18 },
  saveBtn: {
    backgroundColor: '#FF7A00', borderRadius: 14, paddingVertical: 4, elevation: 4,
    shadowColor: '#FF7A00', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  saveBtnLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  cardExpanded: { borderWidth: 1.5, borderColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
  },
  iconBg: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  mealLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  preview: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyHint: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: 2 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  editPanel: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#F9FAFB' },
  hint: { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  inputWrap: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  input: { fontSize: 15, color: '#111827', minHeight: 70, textAlignVertical: 'top' },
});

const toastStyles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 12, left: 16, right: 16, zIndex: 999 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ECFDF5', padding: 14, borderRadius: 14,
    borderLeftWidth: 4, borderLeftColor: '#10B981',
    elevation: 8, shadowColor: '#10B981', shadowOpacity: 0.2,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  text: { flex: 1, fontSize: 14, fontWeight: '700', color: '#065F46' },
});
