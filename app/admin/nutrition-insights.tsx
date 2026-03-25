import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MotiView } from 'moti';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../src/firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PolarChart, Pie } from 'victory-native';

const { width } = Dimensions.get('window');

const AnimatedRing = ({ percent, color, label }: any) => {
  const data = [
    { label: 'hit', value: percent, color: color },
    { label: 'miss', value: 100 - percent, color: '#F3F4F6' }
  ];

  return (
    <View style={styles.ringContainer}>
      <View style={{ width: 120, height: 120 }}>
        <PolarChart data={data} labelKey="label" valueKey="value" colorKey="color">
          <Pie.Chart innerRadius={40}>
            {() => null}
          </Pie.Chart>
        </PolarChart>
        <View style={styles.ringCenterText}>
          <Text style={[styles.ringPercentText, { color }]}>{Math.round(percent)}%</Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
};

export default function NutritionInsights() {
  const [loading, setLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState({
    avgBMI: 0,
    avgCalories: 0,
    nutritionScore: 0,
  });

  const [dietDistribution, setDietDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchNutritionData = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        
        let totalBMI = 0;
        let totalCalories = 0;
        let vegCount = 0;
        let nonVegCount = 0;
        let validUsers = 0;

        querySnapshot.forEach((doc) => {
          const user = doc.data();
          if (user.dietType === 'Vegetarian') vegCount++;
          else nonVegCount++;

          const weight = user.weight ? parseFloat(user.weight) : 65;
          const height = user.height ? parseFloat(user.height) : 170;

          if (weight && height) {
            const bmi = weight / Math.pow(height / 100, 2);
            totalBMI += bmi;
            totalCalories += weight * 30; // 30cals per kg
            validUsers++;
          }
        });

        const usersCount = validUsers || 1;
        const avgBMI = totalBMI / usersCount;
        const avgCalories = totalCalories / usersCount;

        // Simulated nutrition score out of 100 based on BMI being in optimal range (18.5 - 24.9)
        let score = 85; 
        if (avgBMI > 25 || avgBMI < 18.5) score -= 15;

        setNutritionData({
          avgBMI,
          avgCalories,
          nutritionScore: score,
        });

        const total = vegCount + nonVegCount || 1;
        setDietDistribution([
          { label: 'Veg', value: Math.round((vegCount/total)*100) || 50, color: '#111111' },
          { label: 'Non-veg', value: Math.round((nonVegCount/total)*100) || 50, color: '#FF7A00' }
        ]);

      } catch (error) {
        console.error('Error fetching nutrition stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNutritionData();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        style={styles.header}
      >
        <Text variant="headlineMedium" style={styles.headerTitle}>Nutrition Insights</Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>Health metrics & caloric overview</Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: 100 }}
      >
        <Card style={styles.scoreCard}>
          <Card.Content style={styles.scoreContent}>
            <View>
              <Text style={styles.scoreTitle}>Health & Nutrition{'\n'}Score</Text>
              <Text style={styles.scoreValue}>{nutritionData.nutritionScore} <Text style={styles.scoreMax}>/ 100</Text></Text>
            </View>
            <MaterialCommunityIcons name="heart-pulse" size={50} color="#FF7A00" />
          </Card.Content>
        </Card>
      </MotiView>

      <Text style={styles.sectionTitle}>Cohort Averages</Text>
      <View style={styles.ringsGrid}>
        <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 200 }} style={{ width: '48%' }}>
          <Card style={styles.smallCard}>
            <Card.Content style={styles.smallCardContent}>
              <MaterialCommunityIcons name="scale-bathroom" size={24} color="#111111" />
              <View style={styles.smallCardTextContainer}>
                <Text style={styles.smallCardValue}>{nutritionData.avgBMI.toFixed(1)}</Text>
                <Text style={styles.smallCardLabel}>Average BMI</Text>
              </View>
            </Card.Content>
          </Card>
        </MotiView>
        
        <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 350 }} style={{ width: '48%' }}>
          <Card style={styles.smallCard}>
            <Card.Content style={styles.smallCardContent}>
              <MaterialCommunityIcons name="fire" size={24} color="#FF7A00" />
              <View style={styles.smallCardTextContainer}>
                <Text style={styles.smallCardValue}>{Math.round(nutritionData.avgCalories)}</Text>
                <Text style={styles.smallCardLabel}>Avg Calories</Text>
              </View>
            </Card.Content>
          </Card>
        </MotiView>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: 600 }}
      >
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-arc" size={24} color="#FF7A00" />
              <Text style={styles.chartTitle}>Dietary Distribution</Text>
            </View>
            <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
              {dietDistribution.length > 0 && (
                <PolarChart data={dietDistribution} labelKey="label" valueKey="value" colorKey="color">
                  <Pie.Chart innerRadius={50} />
                </PolarChart>
              )}
            </View>
          </Card.Content>
        </Card>
      </MotiView>
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
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7A00',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  scoreTitle: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreValue: {
    color: '#111111',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 5,
  },
  scoreMax: {
    fontSize: 20,
    color: '#6B7280',
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ringsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  smallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  smallCardContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  smallCardTextContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  smallCardValue: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
  },
  smallCardLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 40,
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
    marginBottom: -10,
  },
  chartTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercentText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ringLabel: {
    marginTop: 5,
    color: '#6B7280',
    fontSize: 14,
  },
});
