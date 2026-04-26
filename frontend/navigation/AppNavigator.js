import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { colors } from '../components/common';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProduitsScreen from '../screens/ProduitsScreen';
import ProduitFormScreen from '../screens/ProduitFormScreen';
import LotsScreen from '../screens/LotsScreen';
import LotFormScreen from '../screens/LotFormScreen';
import EmplacementsScreen from '../screens/EmplacementsScreen';
import EmplacementFormScreen from '../screens/EmplacementFormScreen';
import StockScreen from '../screens/StockScreen';
import ScannerScreen from '../screens/ScannerScreen';
import RapportsScreen from '../screens/RapportsScreen';
import ProfilScreen from '../screens/ProfilScreen';
import UsersScreen from '../screens/UsersScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (name) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{name}</Text>
);

function MainTabs() {
  const { user, isAdmin, isGestionnaire } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    if (!user || user.role === 'magasinier') return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch (error) {
      console.log('Impossible de charger le badge de notifications:', error.message);
    }
  };

  useEffect(() => {
    loadUnreadCount();
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { paddingBottom: 5, height: 60 },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ title: 'Accueil', tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Produits" component={ProduitsScreen}
        options={{ title: 'Produits', tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="Lots" component={LotsScreen}
        options={{ title: 'Lots', tabBarIcon: tabIcon('🗂️') }} />
      <Tab.Screen name="Stock" component={StockScreen}
        options={{ title: 'Stock', tabBarIcon: tabIcon('📊') }} />
      {user?.role !== 'magasinier' && (
        <Tab.Screen
          name="Notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: tabIcon('🔔'),
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        >
          {() => <NotificationsScreen onUpdateUnreadCount={setUnreadCount} />}
        </Tab.Screen>
      )}
      <Tab.Screen name="Profil" component={ProfilScreen}
        options={{ title: 'Profil', tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}


export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ProduitForm" component={ProduitFormScreen} options={{ title: 'Produit' }} />
            <Stack.Screen name="LotForm" component={LotFormScreen} options={{ title: 'Lot' }} />
            <Stack.Screen name="EmplacementsScreen" component={EmplacementsScreen} options={{ title: 'Emplacements' }} />
            <Stack.Screen name="EmplacementForm" component={EmplacementFormScreen} options={{ title: 'Emplacement' }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scanner Code-Barres' }} />
            <Stack.Screen name="Rapports" component={RapportsScreen} options={{ title: 'Rapports' }} />
            <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Utilisateurs' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
