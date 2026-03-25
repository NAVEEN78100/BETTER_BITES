import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import LottieView from 'lottie-react-native';

import { auth, db } from '../src/firebase/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function StudentLayout({ children, title }: StudentLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    const user = auth.currentUser;
    // Don't setup listener if no user
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort with newest on top
      notifs.sort((a, b) => {
        const tA = a.timestamp?.toMillis?.() || 0;
        const tB = b.timestamp?.toMillis?.() || 0;
        return tB - tA;
      });

      setNotifications(notifs);

      // Check for new notifications to show toast
      if (!initialLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (!data.read) {
              setToastMessage(data.title);
              setTimeout(() => setToastMessage(null), 3000);
            }
          }
        });
      } else {
        initialLoad.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRead = async (id: string, read: boolean) => {
    if (!read) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        console.error('Error marking as read', error);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const menuItems = [
    { name: 'Dashboard', icon: 'view-dashboard-outline', route: '/dashboard' },
    { name: 'Menu', icon: 'food-outline', route: '/menu' },
    { name: 'Wallet', icon: 'wallet-outline', route: '/wallet' },
    { name: 'Feedback', icon: 'message-star-outline', route: '/feedback' },
    { name: 'Sick Leave', icon: 'medical-bag', route: '/sickleave' },
    { name: 'Profile', icon: 'account-outline', route: '/profile' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={toggleDrawer} style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={28} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable onPress={() => setShowPanel(true)} style={styles.bellButton}>
          {unreadCount > 0 ? (
            <MotiView
               from={{ scale: 1 }}
               animate={{ scale: [1, 1.2, 1] }}
               transition={{ type: 'timing', duration: 1500, loop: true }}
            >
              <MaterialCommunityIcons name="bell-ring-outline" size={26} color="#FF7A00" />
            </MotiView>
          ) : (
            <MaterialCommunityIcons name="bell-outline" size={26} color="#111827" />
          )}
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
          >
            <Pressable style={styles.overlayClickArea} onPress={toggleDrawer} />
          </MotiView>
        )}
      </AnimatePresence>

      {/* Animated Drawer Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <MotiView
            from={{ translateX: -width * 0.75 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: -width * 0.75 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={styles.drawer}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerBrand}>BETTER BITES</Text>
            </View>

            <View style={styles.drawerMenu}>
              {menuItems.map((item, index) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: index * 100 + 100 }}
                  style={{ marginBottom: 16 }}
                >
                  <Pressable
                    style={[
                      styles.drawerItem,
                      pathname === item.route && styles.drawerItemActive
                    ]}
                    onPress={() => {
                      setIsDrawerOpen(false);
                      // Adding a tiny timeout so drawer closes before changing route
                      setTimeout(() => {
                        router.push(item.route as any);
                      }, 200);
                    }}
                  >
                    <MaterialCommunityIcons 
                      name={item.icon as any} 
                      size={24} 
                      color={pathname === item.route ? '#FF7A00' : '#4B5563'} 
                    />
                    <Text style={[
                      styles.drawerItemText,
                      pathname === item.route && styles.drawerItemTextActive
                    ]}>
                      {item.name}
                    </Text>
                  </Pressable>
                </MotiView>
              ))}

              <View style={styles.spacer} />

              <MotiView
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: menuItems.length * 100 + 100 }}
                  style={{ marginBottom: 16 }}
              >
                  <Pressable
                    style={styles.drawerItem}
                    onPress={() => {
                        setIsDrawerOpen(false);
                        router.replace('/'); // Go to main login screen
                    }}
                  >
                    <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
                    <Text style={[styles.drawerItemText, { color: '#EF4444' }]}>Logout</Text>
                  </Pressable>
              </MotiView>
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showPanel && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.panelOverlay}
          >
            <Pressable style={styles.overlayClickArea} onPress={() => setShowPanel(false)} />
            <MotiView
              from={{ translateY: -height, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: -height, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              style={styles.notificationPanel}
            >
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Notifications</Text>
                <Pressable onPress={() => setShowPanel(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#111827" />
                </Pressable>
              </View>
              <ScrollView style={styles.panelList} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyNotifs}>No notifications yet.</Text>
                ) : (
                  notifications.map((n, i) => (
                    <MotiView
                      key={n.id}
                      from={{ opacity: 0, translateX: 50 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: i * 50 + 100 }}
                    >
                      <Pressable 
                        style={[styles.notifCard, !n.read && styles.notifCardUnread]} 
                        onPress={() => handleRead(n.id, n.read)}
                      >
                        <MaterialCommunityIcons 
                          name={n.healthyMeal ? "food-outline" : (n.status === 'rejected' ? "close-circle-outline" : "information-outline")} 
                          size={24} 
                          color={!n.read ? "#FF7A00" : "#6B7280"} 
                          style={{ marginRight: 12 }} 
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.notifTitle, !n.read && styles.notifTitleUnread]}>{n.title}</Text>
                          <Text style={styles.notifMessage}>{n.message}</Text>
                          {n.healthyMeal && (
                            <Text style={styles.specialMealText}>Healthy Meal: {n.healthyMeal}</Text>
                          )}
                          <Text style={styles.notifTime}>
                            {n.timestamp?.toDate ? n.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </Text>
                        </View>
                        {!n.read && <View style={styles.unreadDot} />}
                      </Pressable>
                    </MotiView>
                  ))
                )}
              </ScrollView>
            </MotiView>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Toast Overlay */}
      <AnimatePresence>
        {toastMessage && (
          <MotiView
            from={{ translateY: -100, opacity: 0 }}
            animate={{ translateY: 50, opacity: 1 }}
            exit={{ translateY: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 14 }}
            style={styles.toastContainer}
          >
            <LottieView
              source={require('../assets/checkmark.json')}
              autoPlay
              loop={false}
              style={{ width: 40, height: 40 }}
            />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </MotiView>
        )}
      </AnimatePresence>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  overlayClickArea: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.75,
    backgroundColor: '#FFFFFF',
    zIndex: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 0 },
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFF0E5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD9B3',
  },
  drawerBrand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF7A00',
    letterSpacing: 1,
  },
  drawerMenu: {
    padding: 24,
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  drawerItemActive: {
    backgroundColor: '#FFF0E5',
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 16,
  },
  drawerItemTextActive: {
    color: '#FF7A00',
  },
  spacer: {
    flex: 1,
  },
  bellButton: {
    padding: 8,
    position: 'relative',
    marginRight: -8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 30,
    flexDirection: 'column',
  },
  notificationPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  panelList: {
    flexGrow: 0,
  },
  emptyNotifs: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
    fontSize: 15,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  notifCardUnread: {
    backgroundColor: '#FFF0E5',
    borderColor: '#FFD9B3',
    borderWidth: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 2,
  },
  notifTitleUnread: {
    color: '#FF7A00',
    fontWeight: '800',
  },
  notifMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  specialMealText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 4,
  },
  notifTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF7A00',
    marginLeft: 10,
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingRight: 16,
    paddingLeft: 4,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 999,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 4,
  },
});
