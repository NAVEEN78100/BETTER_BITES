import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

// Redirect from old route to new manager module
export default function ManagerDashboardRedirect() {
  useEffect(() => {
    router.replace('/manager/manager-dashboard');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color="#FF7A00" />
    </View>
  );
}
