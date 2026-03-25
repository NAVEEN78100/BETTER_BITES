import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

export default function AdminLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0B0B0B',
          elevation: 5,
          shadowOpacity: 0.3,
        },
        headerTintColor: '#FF7A00',
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 22,
          letterSpacing: 1,
          color: '#FF7A00',
        },
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: isLargeScreen ? 320 : 280,
        },
        drawerActiveBackgroundColor: '#FF7A00',
        drawerActiveTintColor: '#000000',
        drawerInactiveTintColor: '#4B5563',
        sceneStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Drawer.Screen
        name="admin-dashboard"
        options={{
          title: 'Dashboard',
          drawerLabel: 'Overview',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="user-management"
        options={{
          title: 'User Management',
          drawerLabel: 'Students',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="manager-management"
        options={{
          title: 'Mess Managers',
          drawerLabel: 'Managers',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-account" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="announcement-center"
        options={{
          title: 'Announcements',
          drawerLabel: 'Announcements',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bullhorn-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="system-analytics"
        options={{
          title: 'Analytics',
          drawerLabel: 'System Analytics',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="food-demand-prediction"
        options={{
          title: 'Demand Prediction',
          drawerLabel: 'Demand Prediction',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="brain" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="nutrition-insights"
        options={{
          title: 'Nutrition',
          drawerLabel: 'Nutrition Insights',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="activity-logs"
        options={{
          title: 'Activity Logs',
          drawerLabel: 'Activity Logs',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
