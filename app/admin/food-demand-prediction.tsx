import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MotiView } from 'moti';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../src/firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

const AnimatedCounter = ({ value, prefix = '' }: { value: number, prefix?: string }) => {
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

  return <Text style={styles.statValue}>{prefix}{displayValue}</Text>;
};

const PredictionCard = ({ title, value, icon, color, delay, prefix = '' }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500, delay }}
      style={{ width: '100%', marginBottom: 20 }}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name={icon} size={28} color={color} />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.statTitle}>{title}</Text>
            <AnimatedCounter value={value} prefix={prefix} />
          </View>
        </View>
      </Animated.View>
    </MotiView>
  );
};

export default function FoodDemandPrediction() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    leaveRequests: 0,
    expectedStudents: 0,
    predictedMeals: 0,
    estimatedCost: 0,
    averageMealCost: 35,
  });

  useEffect(() => {
    const fetchPredictionData = async () => {
      try {
        const studentSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const totalStudents = studentSnap.size;

        const dateString = new Date().toISOString().split('T')[0];
        const leaveSnap = await getDocs(query(collection(db, 'sickleave'), where('status', '==', 'Approved')));
        const leaveRequests = leaveSnap.size;

        const expectedStudents = totalStudents > 0 ? totalStudents - leaveRequests : 0;
        const predictedMeals = expectedStudents;
        const averageMealCost = 35;
        const estimatedCost = predictedMeals * averageMealCost;

        setMetrics({
          totalStudents,
          leaveRequests,
          expectedStudents,
          predictedMeals,
          estimatedCost,
          averageMealCost,
        });
      } catch (error) {
        console.error('Error fetching prediction stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictionData();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <Text variant="headlineMedium" style={styles.headerTitle}>Demand Prediction</Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>AI-assisted smart food forecasting</Text>
      </MotiView>

      <View style={styles.predictionContainer}>
        <PredictionCard 
          title="Expected Students Today" 
          value={metrics.expectedStudents} 
          icon="account-group" 
          color="#FF7A00" 
          delay={100} 
        />
        
        <PredictionCard 
          title="Predicted Meals Required" 
          value={metrics.predictedMeals} 
          icon="food-turkey" 
          color="#111111" 
          delay={250} 
        />
        
        <PredictionCard 
          title="Estimated Meal Cost" 
          value={metrics.estimatedCost} 
          icon="currency-usd" 
          color="#FF7A00" 
          delay={400} 
          prefix="₹"
        />
      </View>
      
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 600 }}
      >
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Prediction Factors</Text>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Total Registered Students</Text>
              <Text style={styles.factorValue}>{metrics.totalStudents}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Active Leave Requests</Text>
              <Text style={styles.factorValue}>{metrics.leaveRequests}</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Multiplier per Student</Text>
              <Text style={styles.factorValue}>1 Meal</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Average Meal Cost</Text>
              <Text style={styles.factorValue}>₹{metrics.averageMealCost}</Text>
            </View>
          </Card.Content>
        </Card>
      </MotiView>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  headerTitle: {
    color: '#111111',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#6B7280',
    marginBottom: 30,
  },
  predictionContainer: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  statValue: {
    color: '#111111',
    fontSize: 32,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7A00',
    elevation: 2,
  },
  infoTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  factorLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  factorValue: {
    color: '#111111',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
