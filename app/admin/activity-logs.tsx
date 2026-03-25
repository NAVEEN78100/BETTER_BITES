import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiView } from 'moti';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../src/firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching logs:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getIconForAction = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('announcement')) return { icon: 'bullhorn', color: '#FF7A00' };
    if (act.includes('feedback')) return { icon: 'message-star', color: '#111111' };
    if (act.includes('leave')) return { icon: 'medical-bag', color: '#FF3B30' };
    if (act.includes('menu')) return { icon: 'food', color: '#32D74B' };
    if (act.includes('manager')) return { icon: 'shield-account', color: '#111111' };
    if (act.includes('student')) return { icon: 'account-plus', color: '#FF7A00' };
    return { icon: 'information', color: '#6B7280' };
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const { icon, color } = getIconForAction(item.action || '');
    
    let timeString = 'Just now';
    if (item.timestamp && item.timestamp.toDate) {
      const date = item.timestamp.toDate();
      timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                   ' - ' + date.toLocaleDateString();
    }

    return (
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: Math.min(index * 100, 1000) }}
        style={styles.timelineItem}
      >
        <View style={styles.timelineLineContainer}>
          <View style={[styles.timelineDot, { backgroundColor: color }]}>
            <MaterialCommunityIcons name={icon as any} size={14} color="#FFF" />
          </View>
          {index !== logs.length - 1 && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.timelineContent}>
          <View style={styles.contentHeader}>
            <Text style={styles.actionText}>{item.action}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.userRole?.toUpperCase() || 'SYSTEM'}</Text>
            </View>
          </View>
          <Text style={styles.timeText}>{timeString}</Text>
        </View>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.headerTitle}>Activity Monitor</Text>
      <Text style={styles.headerSubtitle}>Real-time system event logs</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No activity logs recorded yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  listContainer: {
    paddingBottom: 40,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLineContainer: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#111111',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  timelineLine: {
    position: 'absolute',
    top: 32,
    width: 2,
    height: '100%',
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginLeft: 10,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#FF7A00',
    borderWidth: 1,
    borderTopColor: '#F3F4F6',
    borderRightColor: '#F3F4F6',
    borderBottomColor: '#F3F4F6',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actionText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  timeText: {
    color: '#6B7280',
    fontSize: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    color: '#FF7A00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});
