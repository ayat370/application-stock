import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
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
import MouvementsScreen from '../screens/MouvementsScreen';
import MouvementFormScreen from '../screens/MouvementFormScreen';
import MouvementDetailScreen from '../screens/MouvementDetailScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const drawerIcon = (name) => ({ focused, color }) => (
  <Text style={{ fontSize: 20, color }}>{name}</Text>
);

function MainDrawer() {
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
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textLight,
        drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -16 },
        drawerContentStyle: {
          backgroundColor: colors.card,
          borderRightWidth: 1,
          borderRightColor: colors.border,
        },
        drawerItemStyle: {
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 12,
          marginVertical: 4,
          marginHorizontal: 12,
        },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerTitleAlign: 'left',
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen}
        options={{ title: 'Accueil', drawerIcon: drawerIcon('🏠') }} />
      <Drawer.Screen name="Produits" component={ProduitsScreen}
        options={{ title: 'Produits', drawerIcon: drawerIcon('📦') }} />
      <Drawer.Screen name="Lots" component={LotsScreen}
        options={{ title: 'Lots', drawerIcon: drawerIcon('🗂️') }} />
      <Drawer.Screen name="Stock" component={StockScreen}
        options={{ title: 'Stock', drawerIcon: drawerIcon('📊') }} />
      <Drawer.Screen name="Mouvements" component={MouvementsScreen}
        options={{ title: 'Mouvements', drawerIcon: drawerIcon('↔️') }} />
      {/* Onglet Notifications masqué pour les magasiniers */}
      {user?.role !== 'magasinier' && (
        <Drawer.Screen
          name="Notifications"
          options={{
            title: 'Notifications',
            drawerIcon: drawerIcon('🔔'),
            drawerLabel: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`,
          }}
        >
          {() => <NotificationsScreen onUpdateUnreadCount={setUnreadCount} />}
        </Drawer.Screen>
      )}
      <Drawer.Screen name="Profil" component={ProfilScreen}
        options={{ title: 'Profil', drawerIcon: drawerIcon('👤') }} />
    </Drawer.Navigator>
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
            <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
            <Stack.Screen name="ProduitForm" component={ProduitFormScreen} options={{ title: 'Produit' }} />
            <Stack.Screen name="LotForm" component={LotFormScreen} options={{ title: 'Lot' }} />
            <Stack.Screen name="EmplacementsScreen" component={EmplacementsScreen} options={{ title: 'Emplacements' }} />
            <Stack.Screen name="EmplacementForm" component={EmplacementFormScreen} options={{ title: 'Emplacement' }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scanner Code-Barres' }} />
            <Stack.Screen name="Rapports" component={RapportsScreen} options={{ title: 'Rapports' }} />
            <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Utilisateurs' }} />
            <Stack.Screen name="MouvementForm" component={MouvementFormScreen} options={{ title: 'Mouvement de Stock' }} />
            <Stack.Screen name="MouvementDetail" component={MouvementDetailScreen} options={{ title: 'Détails du Mouvement' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
