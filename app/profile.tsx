import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';

import StudentLayout from '../components/StudentLayout';
import { auth, db } from '../src/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const calcBMI = (w: number, h: number) => (w / Math.pow(h / 100, 2)).toFixed(1);
const getBMIInfo = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#3B82F6' };
  if (bmi < 24.9) return { label: 'Normal', color: '#10B981' };
  if (bmi < 29.9) return { label: 'Overweight', color: '#F59E0B' };
  return { label: 'Obese', color: '#EF4444' };
};

function SectionCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 28 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay, damping: 16 }}
      style={styles.card}
    >
      {children}
    </MotiView>
  );
}

function InfoRow({ icon, iconColor, iconBg, label, value }: {
  icon: string; iconColor: string; iconBg: string; label: string; value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bmi, setBmi] = useState(0);
  const [bmiInfo, setBmiInfo] = useState({ label: '', color: '#10B981' });
  const [calories, setCalories] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const d = snap.data();
          setProfile(d);
          const w = d.weight ?? 70, h = d.height ?? 175;
          const b = parseFloat(calcBMI(w, h));
          setBmi(b); setBmiInfo(getBMIInfo(b)); setCalories(w * 30);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <StudentLayout title="My Profile">
        <View style={styles.loader}><ActivityIndicator size="large" color="#FF7A00" /></View>
      </StudentLayout>
    );
  }

  const initials = (profile?.name ?? 'S').substring(0, 2).toUpperCase();

  return (
    <StudentLayout title="My Profile">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* Avatar Card */}
        <MotiView
          from={{ opacity: 0, translateY: -24, scale: 0.9 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', delay: 100, damping: 14 }}
          style={styles.avatarCard}
        >
          <MotiView
            from={{ scale: 0.5, rotate: '-10deg' }}
            animate={{ scale: 1, rotate: '0deg' }}
            transition={{ type: 'spring', delay: 300, damping: 12 }}
          >
            <Avatar.Text
              size={90}
              label={initials}
              style={styles.avatar}
              labelStyle={{ fontSize: 32, fontWeight: '900', color: '#FFF' }}
            />
          </MotiView>
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 450 }}
          >
            <Text style={styles.profileName}>{profile?.name ?? '—'}</Text>
            <Text style={styles.profileEmail}>{profile?.email ?? '—'}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="school" size={14} color="#FF7A00" />
              <Text style={styles.roleText}>Hostel Resident</Text>
            </View>
          </MotiView>
        </MotiView>

        {/* BMI & Calories */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 550 }}
          style={styles.statsRow}
        >
          {/* BMI */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 600, damping: 12 }}
            style={[styles.statCard, { flex: 1, marginRight: 8 }]}
          >
            <View style={[styles.statIconBg, { backgroundColor: bmiInfo.color + '20' }]}>
              <MaterialCommunityIcons name="scale-bathroom" size={22} color={bmiInfo.color} />
            </View>
            <Text style={[styles.statValue, { color: bmiInfo.color }]}>{bmi}</Text>
            <Text style={styles.statLabel}>BMI</Text>
            <View style={[styles.bmiPill, { backgroundColor: bmiInfo.color + '20' }]}>
              <Text style={[styles.bmiPillText, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
            </View>
          </MotiView>

          {/* Calories */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 700, damping: 12 }}
            style={[styles.statCard, { flex: 1, marginLeft: 8 }]}
          >
            <View style={[styles.statIconBg, { backgroundColor: '#FFF0E5' }]}>
              <MaterialCommunityIcons name="fire" size={22} color="#FF7A00" />
            </View>
            <Text style={[styles.statValue, { color: '#FF7A00' }]}>{calories}</Text>
            <Text style={styles.statLabel}>kcal / day</Text>
            <View style={[styles.bmiPill, { backgroundColor: '#FFF0E5' }]}>
              <Text style={[styles.bmiPillText, { color: '#FF7A00' }]}>Recommended</Text>
            </View>
          </MotiView>
        </MotiView>

        {/* Personal Details */}
        <SectionCard delay={750}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="account-details" size={18} color="#FF7A00" /> Personal Details
          </Text>
          <View style={styles.detailsRow}>
            {[
              { label: 'Age',    value: `${profile?.age ?? '—'} yrs` },
              { label: 'Height', value: `${profile?.height ?? '—'} cm` },
              { label: 'Weight', value: `${profile?.weight ?? '—'} kg` },
            ].map((item, i) => (
              <MotiView
                key={i}
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 800 + i * 100 }}
                style={styles.detailBox}
              >
                <Text style={styles.detailValue}>{item.value}</Text>
                <Text style={styles.detailLabel}>{item.label}</Text>
              </MotiView>
            ))}
          </View>
        </SectionCard>

        {/* Diet & Health */}
        <SectionCard delay={900}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color="#EF4444" /> Diet {'&'} Health
          </Text>
          <InfoRow icon="food-apple-outline"   iconColor="#D97706" iconBg="#FEF3C7"
            label="Diet Type"         value={profile?.dietType ?? '—'} />
          <InfoRow icon="pill"                 iconColor="#EF4444" iconBg="#FEE2E2"
            label="Food Allergies"    value={profile?.allergies ?? 'None'} />
          <InfoRow icon="medical-bag"          iconColor="#10B981" iconBg="#D1FAE5"
            label="Health Conditions" value={profile?.healthConditions ?? 'None'} />
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarCard: {
    backgroundColor: '#111827', borderRadius: 28, padding: 28,
    alignItems: 'center', marginBottom: 20,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  avatar: { backgroundColor: '#FF7A00', marginBottom: 16 },
  profileName: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  profileEmail: { fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1F2937', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 12, alignSelf: 'center',
  },
  roleText: { fontSize: 13, fontWeight: '700', color: '#FF7A00' },
  statsRow: { flexDirection: 'row', marginBottom: 14 },
  statCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  statIconBg: {
    width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 30, fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  bmiPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8,
  },
  bmiPillText: { fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  detailBox: { alignItems: 'center' },
  detailValue: { fontSize: 22, fontWeight: '900', color: '#111827' },
  detailLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 4 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  infoIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },
});
