import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, SafeAreaView,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');

interface ManagerLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function ManagerLayout({ children, title }: ManagerLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard',      icon: 'view-dashboard-outline', route: '/manager/manager-dashboard' },
    { name: 'Menu Management', icon: 'silverware-fork-knife',  route: '/manager/menu-management' },
    { name: 'Leave Requests', icon: 'medical-bag',            route: '/manager/leave-requests' },
    { name: 'Feedback',       icon: 'message-star-outline',   route: '/manager/feedback-review' },
    { name: 'Announcements',  icon: 'bullhorn-outline',        route: '/manager/announcement-management' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => setIsDrawerOpen(true)} style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>BETTER BITES</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name="shield-account" size={22} color="#FF7A00" />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setIsDrawerOpen(false)} />
          </MotiView>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <MotiView
            from={{ translateX: -width * 0.78 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: -width * 0.78 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            style={styles.drawer}
          >
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerIconWrapper}>
                <MaterialCommunityIcons name="shield-account" size={36} color="#FF7A00" />
              </View>
              <Text style={styles.drawerBrand}>BETTER BITES</Text>
              <Text style={styles.drawerRole}>Manager Portal</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.drawerMenu}>
              {menuItems.map((item, index) => {
                const isActive = pathname === item.route;
                return (
                  <MotiView
                    key={index}
                    from={{ opacity: 0, translateX: -24 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: index * 80 + 100 }}
                    style={{ marginBottom: 6 }}
                  >
                    <Pressable
                      style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                      onPress={() => {
                        setIsDrawerOpen(false);
                        setTimeout(() => router.push(item.route as any), 180);
                      }}
                    >
                      <View style={[styles.drawerIconBg, isActive && { backgroundColor: '#FF7A00' }]}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={isActive ? '#FFFFFF' : '#4B5563'}
                        />
                      </View>
                      <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                        {item.name}
                      </Text>
                      {isActive && (
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#FF7A00" />
                      )}
                    </Pressable>
                  </MotiView>
                );
              })}

              <View style={{ flex: 1 }} />

              {/* Logout */}
              <MotiView
                from={{ opacity: 0, translateX: -24 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: menuItems.length * 80 + 100 }}
              >
                <Pressable
                  style={styles.drawerItem}
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.replace('/'); // Go to main login screen
                  }}
                >
                  <View style={[styles.drawerIconBg, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                  </View>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#111827',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  menuButton: { padding: 4 },
  headerCenter: { alignItems: 'center' },
  headerBrand: { fontSize: 10, fontWeight: '700', color: '#FF7A00', letterSpacing: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: width * 0.78,
    backgroundColor: '#FFFFFF',
    zIndex: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 6, height: 0 },
  },
  drawerHeader: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#111827',
    alignItems: 'flex-start',
  },
  drawerIconWrapper: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  drawerBrand: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  drawerRole: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginTop: 2 },
  drawerMenu: { flex: 1, padding: 20 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  drawerItemActive: { backgroundColor: '#FFF0E5' },
  drawerIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  drawerItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
  drawerItemTextActive: { color: '#FF7A00' },
});
