import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';

import StudentLayout from '../components/StudentLayout';
import { auth, db } from '../src/firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface Transaction {
  id: string; type: 'credit' | 'debit';
  title: string; date: string; amount: number;
}

// ─── Animated balance counter ──────────────────────────────────────────────────
function AnimatedCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.max(Math.ceil(target / 50), 1);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setDisplay(target); clearInterval(t); }
      else setDisplay(v);
    }, 25);
    return () => clearInterval(t);
  }, [target]);
  return <Text style={styles.balanceAmount}>₹{display.toLocaleString('en-IN')}</Text>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TxSkeleton() {
  return (
    <MotiView
      from={{ opacity: 0.4 }} animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true }}
      style={styles.txSkeleton}
    >
      <View style={styles.txSkeletonIcon} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '45%', marginTop: 8 }]} />
      </View>
    </MotiView>
  );
}

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [pressed, setPressed] = useState(false);

  // Pulse balance card
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.018, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1, true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDocs(
          query(collection(db, 'transactions'), where('studentId', '==', uid), orderBy('timestamp', 'desc'))
        );
        let bal = 0;
        const list: Transaction[] = snap.docs.map(d => {
          const data = d.data();
          const amt = data.amount ?? 0;
          if (data.type === 'credit') bal += amt; else bal -= amt;
          let dateStr = '';
          if (data.timestamp?.toDate) {
            dateStr = data.timestamp.toDate().toLocaleString('en-US', {
              month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
            });
          } else { dateStr = data.date ?? ''; }
          return { id: d.id, type: data.type, title: data.title ?? 'Transaction', date: dateStr, amount: amt };
        });
        setTransactions(list);
        setBalance(bal);
      } catch {
        setTransactions([
          { id: '1', type: 'credit', title: 'Recharge via UPI',     date: 'Oct 14, 10:30 AM', amount: 500  },
          { id: '2', type: 'debit',  title: 'Extra Item: Omelette', date: 'Oct 13, 08:15 PM', amount: 40   },
          { id: '3', type: 'debit',  title: 'Lunch Token',          date: 'Oct 12, 12:45 PM', amount: 60   },
          { id: '4', type: 'credit', title: 'Recharge via Card',    date: 'Oct 10, 11:20 AM', amount: 1000 },
        ]);
        setBalance(1400);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <StudentLayout title="My Wallet">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* Balance Card */}
        <MotiView
          from={{ opacity: 0, translateY: -20, scale: 0.9 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', delay: 100, damping: 14 }}
        >
          <Pressable onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
            <MotiView animate={{ scale: pressed ? 0.96 : 1 }} transition={{ type: 'spring', damping: 14 }}>
              <Animated.View style={[styles.balanceCard, !pressed && pulseStyle]}>
                <View style={styles.balanceTopRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    {loading
                      ? <Text style={styles.balanceAmount}>₹ ---</Text>
                      : <AnimatedCounter target={balance} />
                    }
                  </View>
                  <MotiView
                    from={{ rotate: '-30deg', scale: 0.6 }}
                    animate={{ rotate: '0deg', scale: 1 }}
                    transition={{ type: 'spring', delay: 400, damping: 12 }}
                  >
                    <MaterialCommunityIcons name="wallet" size={44} color="#FF7A00" />
                  </MotiView>
                </View>

                {/* Decorative dots */}
                <View style={styles.dotRow}>
                  {[...Array(4)].map((_, i) => (
                    <MotiView
                      key={i}
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 300 + i * 80 }}
                      style={styles.dot}
                    />
                  ))}
                  <Text style={styles.dotLabel}>•••• 4291</Text>
                </View>

                <View style={styles.btnRow}>
                  <Button mode="contained" style={styles.rechargeBtn} labelStyle={styles.rechargeLbl} icon="plus">
                    Recharge
                  </Button>
                  <Button mode="outlined" style={styles.historyBtn} labelStyle={styles.historyLbl}>
                    History
                  </Button>
                </View>
              </Animated.View>
            </MotiView>
          </Pressable>
        </MotiView>

        {/* Transactions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {loading ? (
            [0,1,2].map(i => <TxSkeleton key={i} />)
          ) : transactions.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="receipt" size={52} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx, i) => (
              <MotiView
                key={tx.id}
                from={{ opacity: 0, translateX: 50 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', delay: i * 90 + 500, damping: 16 }}
                style={styles.txCard}
              >
                <View style={[styles.txIcon, {
                  backgroundColor: tx.type === 'credit' ? '#D1FAE5' : '#FEE2E2',
                }]}>
                  <MaterialCommunityIcons
                    name={tx.type === 'credit' ? 'arrow-down-thick' : 'arrow-up-thick'}
                    size={22}
                    color={tx.type === 'credit' ? '#10B981' : '#EF4444'}
                  />
                </View>
                <View style={styles.txDetails}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, {
                  color: tx.type === 'credit' ? '#10B981' : '#111827',
                }]}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                </Text>
              </MotiView>
            ))
          )}
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: '#111827', borderRadius: 28, padding: 24, marginBottom: 24,
    elevation: 10, shadowColor: '#FF7A00', shadowOpacity: 0.2,
    shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
  },
  balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  balanceLabel: { fontSize: 14, color: '#9CA3AF', marginBottom: 6 },
  balanceAmount: { fontSize: 44, fontWeight: '900', color: '#FFFFFF' },
  dotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4B5563' },
  dotLabel: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  btnRow: { flexDirection: 'row', gap: 10 },
  rechargeBtn: { flex: 1, backgroundColor: '#FF7A00', borderRadius: 12 },
  rechargeLbl: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  historyBtn: { flex: 1, borderColor: '#4B5563', borderRadius: 12 },
  historyLbl: { color: '#9CA3AF' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
  txCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  txIcon: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  txDetails: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  txAmount: { fontSize: 17, fontWeight: '800' },
  txSkeleton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', padding: 16, borderRadius: 18, marginBottom: 10,
  },
  txSkeletonIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E5E7EB' },
  skeletonLine: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, width: '70%' },
});
