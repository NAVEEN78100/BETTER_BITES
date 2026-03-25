import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CartesianChart, Bar, PolarChart, Pie, Line } from 'victory-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../src/firebase/firebaseConfig';

const { width } = Dimensions.get('window');

export default function SystemAnalytics() {
  const [loading, setLoading] = useState(true);
  
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [mealData, setMealData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const feedbackSnap = await getDocs(collection(db, 'feedback'));
        const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        let breakfast = 0;
        let lunch = 0;
        let dinner = 0;

        feedbackSnap.forEach(doc => {
          const data = doc.data();
          if (data.rating >= 1 && data.rating <= 5) {
            ratings[data.rating as keyof typeof ratings]++;
          }
          const fbText = (data.comment || data.description || '').toLowerCase();
          if (fbText.includes('breakfast')) breakfast++;
          if (fbText.includes('lunch')) lunch++;
          if (fbText.includes('dinner')) dinner++;
        });

        setFeedbackData([
          { rating: '1★', count: ratings[1] },
          { rating: '2★', count: ratings[2] },
          { rating: '3★', count: ratings[3] },
          { rating: '4★', count: ratings[4] },
          { rating: '5★', count: ratings[5] },
        ]);

        const totalMealsMatches = breakfast + lunch + dinner || 1;
        setMealData([
          { label: 'Breakfast', value: Math.max(breakfast, 1), color: '#FF7A00' },
          { label: 'Lunch', value: Math.max(lunch, 1), color: '#111111' },
          { label: 'Dinner', value: Math.max(dinner, 1), color: '#9CA3AF' },
        ]);

        const leaveSnap = await getDocs(collection(db, 'sickleave'));
        const leaveDates: Record<string, number> = {};
        
        leaveSnap.forEach(doc => {
          const data = doc.data();
          if (data.date) {
            const dateStr = typeof data.date === 'string' ? data.date.split('T')[0] : new Date(data.date.seconds * 1000).toISOString().split('T')[0];
            leaveDates[dateStr] = (leaveDates[dateStr] || 0) + 1;
          }
        });

        const sortedLeaves = Object.keys(leaveDates).sort().map((date, idx) => ({
          day: idx + 1,
          dateLabel: date.slice(-5),
          count: leaveDates[date]
        }));
        
        setLeaveData(sortedLeaves.length > 0 ? sortedLeaves : [
          { day: 1, dateLabel: 'Mon', count: 2 },
          { day: 2, dateLabel: 'Tue', count: 5 },
          { day: 3, dateLabel: 'Wed', count: 1 }
        ]);

        const txnSnap = await getDocs(collection(db, 'transactions'));
        let totalDebit = 0;
        let totalCredit = 0;
        
        txnSnap.forEach(doc => {
          const data = doc.data();
          if (data.type === 'debit') totalDebit += (data.amount || 0);
          if (data.type === 'credit') totalCredit += (data.amount || 0);
        });

        setWalletData([
          { type: 'Debit', amount: totalDebit || 500, color: '#FF3B30' },
          { type: 'Credit', amount: totalCredit || 1500, color: '#FF7A00' }
        ]);

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={styles.header}
      >
        <Text variant="headlineMedium" style={styles.headerTitle}>System Analytics</Text>
        <Text style={styles.headerSubtitle}>Real-time system insights & metrics</Text>
      </MotiView>

      {/* Feedback Distribution */}
      <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 100 }}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="star-circle" size={24} color="#FF7A00" />
              <Text style={styles.cardTitle}>Feedback Rating</Text>
            </View>
            <View style={{ height: 220, marginTop: 10 }}>
              {feedbackData.length > 0 && (
                <CartesianChart 
                  data={feedbackData} 
                  xKey="rating" 
                  yKeys={["count"]}
                  domainPadding={{ left: 20, right: 20, top: 10, bottom: 10 }}
                  domain={{ y: [0, Math.max(5, ...feedbackData.map(d => d.count))] }}
                >
                  {({ points, chartBounds }) => (
                    <Bar
                      chartBounds={chartBounds}
                      points={points.count}
                      color="#FF7A00"
                      roundedCorners={{ topLeft: 6, topRight: 6 }}
                      barWidth={25}
                    />
                  )}
                </CartesianChart>
              )}
            </View>
          </Card.Content>
        </Card>
      </MotiView>

      {/* Leave Requests Trend */}
      <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 250 }}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="#111111" />
              <Text style={styles.cardTitle}>Sick Leave Trends</Text>
            </View>
            <View style={{ height: 220, marginTop: 10 }}>
              {leaveData.length > 0 && (
                <CartesianChart 
                  data={leaveData} 
                  xKey="day" 
                  yKeys={["count"]}
                  domainPadding={{ left: 20, right: 20, top: 10, bottom: 10 }}
                  domain={{ y: [0, Math.max(5, ...leaveData.map(d => d.count))] }}
                >
                  {({ points }) => (
                    <Line
                      points={points.count}
                      color="#111111"
                      strokeWidth={3}
                      animate={{ type: 'timing', duration: 1500 }}
                    />
                  )}
                </CartesianChart>
              )}
            </View>
          </Card.Content>
        </Card>
      </MotiView>

      {/* Meal Popularity */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
        <MotiView style={{ width: '48%' }} from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 400 }}>
          <Card style={[styles.card, { marginBottom: 0 }]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="food-turkey" size={20} color="#FF7A00" />
                <Text style={styles.cardTitle}>Meals</Text>
              </View>
              <View style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
                {mealData.length > 0 && (
                  <PolarChart data={mealData} labelKey="label" valueKey="value" colorKey="color">
                    <Pie.Chart innerRadius={25} />
                  </PolarChart>
                )}
              </View>
            </Card.Content>
          </Card>
        </MotiView>

        {/* Wallet Usage Pie */}
        <MotiView style={{ width: '48%' }} from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 500 }}>
          <Card style={[styles.card, { marginBottom: 0 }]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="wallet" size={20} color="#FF7A00" />
                <Text style={styles.cardTitle}>Wallet</Text>
              </View>
              <View style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
                {walletData.length > 0 && (
                  <PolarChart data={walletData} labelKey="type" valueKey="amount" colorKey="color">
                    <Pie.Chart innerRadius={25} />
                  </PolarChart>
                )}
              </View>
            </Card.Content>
          </Card>
        </MotiView>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#111111',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
