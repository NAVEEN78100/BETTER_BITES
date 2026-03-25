import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, IconButton, TextInput, Button } from 'react-native-paper';
import { MotiView } from 'moti';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../src/firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ManagerManagement() {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'manager'));
      const querySnapshot = await getDocs(q);
      const managerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManagers(managerList);
    } catch (error) {
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleAddManager = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setAdding(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const managerData = {
        uid: user.uid,
        name,
        email,
        role: 'manager',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), managerData);
      
      setManagers(prev => [...prev, { id: user.uid, ...managerData }]);
      setModalVisible(false);
      setName('');
      setEmail('');
      setPassword('');
      Alert.alert('Success', 'Manager added successfully!');
    } catch (error: any) {
      console.error('Error adding manager:', error);
      Alert.alert('Error', error.message || 'Failed to add manager.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (managerId: string, managerName: string) => {
    Alert.alert(
      'Remove Manager',
      `Are you sure you want to remove ${managerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', managerId));
              setManagers(prev => prev.filter(m => m.id !== managerId));
            } catch (error) {
              console.error('Error removing manager:', error);
              Alert.alert('Error', 'Failed to remove manager.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 100 }}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="shield-account" size={30} color="#FF7A00" />
            </View>
            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>MESS MANAGER</Text>
              </View>
            </View>
          </View>
          <IconButton 
            icon="delete-outline" 
            iconColor="#FF3B30" 
            size={24} 
            onPress={() => handleRemove(item.id, item.name)} 
            style={styles.deleteBtn}
          />
        </Card.Content>
      </Card>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Mess Managers</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={managers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchManagers}
        ListEmptyComponent={<Text style={styles.emptyText}>No managers found.</Text>}
      />

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: 'spring' }}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Manager</Text>
              <IconButton icon="close" iconColor="#6B7280" onPress={() => setModalVisible(false)} />
            </View>

            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { onSurfaceVariant: '#6B7280', primary: '#FF7A00' } }}
              textColor="#111111"
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              theme={{ colors: { onSurfaceVariant: '#6B7280', primary: '#FF7A00' } }}
              textColor="#111111"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              theme={{ colors: { onSurfaceVariant: '#6B7280', primary: '#FF7A00' } }}
              textColor="#111111"
            />

            <Button 
              mode="contained" 
              onPress={handleAddManager} 
              loading={adding} 
              disabled={adding}
              buttonColor="#FF7A00"
              style={styles.submitBtn}
            >
              Save Manager
            </Button>
          </MotiView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    color: '#111111',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#FF7A00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#FF7A00',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#111111',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
  badge: {
    backgroundColor: 'rgba(17, 17, 17, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F9FAFB',
    marginBottom: 15,
  },
  submitBtn: {
    marginTop: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
});
