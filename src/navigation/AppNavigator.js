import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import StudentRegisterScreen from '../screens/StudentRegisterScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import StudentDashboard from '../screens/StudentDashboard';
import ManagerDashboard from '../screens/ManagerDashboard';
import AdminDashboard from '../screens/AdminDashboard';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="StudentRegisterScreen" component={StudentRegisterScreen} />
      <Stack.Screen name="AdminLoginScreen" component={AdminLoginScreen} />
      <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    </Stack.Navigator>
  );
}
