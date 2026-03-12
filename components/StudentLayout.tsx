import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, SafeAreaView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function StudentLayout({ children, title }: StudentLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

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
        <View style={{ width: 28 }} />
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
  }
});
