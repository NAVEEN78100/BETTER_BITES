import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ManagerLayout from '../../components/ManagerLayout';
import { db } from '../../src/firebase/firebaseConfig';
import {
  collection, query, where, getDocs,
  doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';

interface LeaveRequest {
  id: string;
  studentId: string;
  date: string;
  mealType: string;
  reason: string;
}

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({
  visible,
  message,
  type,
}: {
  visible: boolean;
  message: string;
  type: 'approve' | 'reject';
}) {
  const color = type === 'approve' ? '#10B981' : '#EF4444';
  const icon  = type === 'approve' ? 'check-circle' : 'close-circle';

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -20 }}
          transition={{ type: 'timing', duration: 300 }}
          style={[styles.toast, { borderLeftColor: color }]}
        >
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
          <Text style={[styles.toastText, { color }]}>{message}</Text>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

// ─── Leave Card ───────────────────────────────────────────────────────────────
function LeaveCard({
  item,
  index,
  onAction,
}: {
  item: LeaveRequest;
  index: number;
  onAction: (id: string, action: 'approved' | 'rejected') => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePress = async (action: 'approved' | 'rejected') => {
    if (processing) return;
    setProcessing(true);
    await onAction(item.id, action);
    setDone(true);
  };

  return (
    <AnimatePresence>
      {!done && (
        <MotiView
          from={{ opacity: 0, translateX: -40 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: 60, scale: 0.9 }}
          transition={{ type: 'spring', delay: index * 100, damping: 16 }}
          style={styles.card}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={22} color="#6366F1" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.studentId} numberOfLines={1}>
                {item.studentId.length > 16
                  ? item.studentId.substring(0, 16) + '…'
                  : item.studentId}
              </Text>
              <View style={styles.pillRow}>
                <View style={styles.pill}>
                  <MaterialCommunityIcons name="calendar" size={12} color="#6B7280" />
                  <Text style={styles.pillText}>{item.date}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: '#EEF2FF' }]}>
                  <MaterialCommunityIcons name="food-fork-drink" size={12} color="#6366F1" />
                  <Text style={[styles.pillText, { color: '#6366F1' }]}>{item.mealType}</Text>
                </View>
              </View>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.reasonBox}>
            <MaterialCommunityIcons
              name="text-box-outline"
              size={16}
              color="#9CA3AF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>

          {/* Action Buttons */}
          {processing ? (
            <ActivityIndicator color="#FF7A00" style={{ marginTop: 8 }} />
          ) : (
            <View style={styles.btnRow}>
              <Btn
                label="Approve"
                icon="check-circle-outline"
                color="#10B981"
                bg="#D1FAE5"
                onPress={() => handlePress('approved')}
              />
              <Btn
                label="Reject"
                icon="close-circle-outline"
                color="#EF4444"
                bg="#FEE2E2"
                onPress={() => handlePress('rejected')}
              />
            </View>
          )}
        </MotiView>
      )}
    </AnimatePresence>
  );
}

function Btn({
  label, icon, color, bg, onPress,
}: {
  label: string; icon: string; color: string; bg: string; onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={{ flex: 1, marginHorizontal: 4 }}
    >
      <MotiView
        animate={{ scale: pressed ? 0.93 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
        style={[styles.btn, { backgroundColor: bg }]}
      >
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
        <Text style={[styles.btnText, { color }]}>{label}</Text>
      </MotiView>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LeaveRequests() {
  const [loading, setLoading]   = useState(true);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [toast, setToast]       = useState<{
    visible: boolean; message: string; type: 'approve' | 'reject';
  }>({ visible: false, message: '', type: 'approve' });

  const showToast = (message: string, type: 'approve' | 'reject') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'sickleave'), where('status', '==', 'pending'))
        );
        setRequests(
          snap.docs.map(d => ({
            id:        d.id,
            studentId: d.data().studentId ?? '—',
            date:      d.data().date      ?? '—',
            mealType:  d.data().mealType  ?? '—',
            reason:    d.data().reason    ?? '—',
          }))
        );
      } catch (e) {
        console.error('Leave fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAction = useCallback(
    async (id: string, action: 'approved' | 'rejected') => {
      try {
        await updateDoc(doc(db, 'sickleave', id), {
          status: action,
          processedAt: serverTimestamp(),
        });
        showToast(
          action === 'approved' ? 'Leave request approved ✓' : 'Leave request rejected',
          action === 'approved' ? 'approve' : 'reject',
        );
      } catch (e) {
        console.error('Leave update error:', e);
      }
    },
    []
  );

  return (
    <ManagerLayout title="Leave Requests">
      <View style={{ flex: 1 }}>
        {/* Toast */}
        <View style={styles.toastWrapper} pointerEvents="none">
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 450 }}
            style={styles.headerCard}
          >
            <MaterialCommunityIcons name="medical-bag" size={30} color="#EF4444" />
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.headerTitle}>Sick Leave Requests</Text>
              <Text style={styles.headerSub}>
                {loading ? '…' : `${requests.length} pending approval`}
              </Text>
            </View>
          </MotiView>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF7A00"
              style={{ marginTop: 40 }}
            />
          ) : requests.length === 0 ? (
            <MotiView
              from={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.emptyState}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={64}
                color="#D1D5DB"
              />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>No pending sick leave requests.</Text>
            </MotiView>
          ) : (
            requests.map((req, index) => (
              <LeaveCard
                key={req.id}
                item={req}
                index={index}
                onAction={handleAction}
              />
            ))
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

  toastWrapper: {
    position: 'absolute',
    top: 12, left: 16, right: 16,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14,
    borderLeftWidth: 4, elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  toastText: { flex: 1, fontSize: 14, fontWeight: '700' },

  headerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF0E5', padding: 18, borderRadius: 16,
    marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#EF4444',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#374151', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  studentId: { fontSize: 14, fontWeight: '700', color: '#111827' },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  pillText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  pendingBadge: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
  },
  pendingText: { fontSize: 12, fontWeight: '700', color: '#B45309' },

  reasonBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  reasonText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },

  btnRow: { flexDirection: 'row', marginHorizontal: -4 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  btnText: { fontSize: 14, fontWeight: '700' },
});
