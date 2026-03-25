import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, IconButton, Searchbar } from 'react-native-paper';
import { MotiView } from 'moti';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../src/firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId));
              setUsers(prev => prev.filter(u => u.id !== userId));
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user.');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', delay: index * 100 }}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.name}>{item.name || 'Unknown User'}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.badges}>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="food-apple" size={14} color="#FF7A00" />
                  <Text style={styles.badgeText}>{item.dietType || 'N/A'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: 'rgba(255, 159, 69, 0.15)' }]}>
                  <MaterialCommunityIcons name="cake" size={14} color="#111111" />
                  <Text style={[styles.badgeText, { color: '#111111' }]}>{item.age ? `${item.age} yrs` : 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            <IconButton icon="eye" iconColor="#FF7A00" size={20} onPress={() => {}} />
            <IconButton icon="delete" iconColor="#FF3B30" size={20} onPress={() => handleDelete(item.id, item.name)} />
          </View>
        </Card.Content>
      </Card>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.headerTitle}>User Management</Text>
      <Searchbar
        placeholder="Search Students"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={{ color: '#111111' }}
        iconColor="#6B7280"
        placeholderTextColor="#6B7280"
      />
      
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchUsers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    color: '#111111',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7A00',
    elevation: 3,
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FF7A00',
    fontSize: 20,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
  },
  name: {
    color: '#111111',
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 5,
  },
  badges: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    color: '#FF7A00',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
  },
});
