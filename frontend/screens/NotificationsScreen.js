import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { colors, Card, LoadingView, EmptyView, Btn } from '../components/common';

export default function NotificationsScreen({ onUpdateUnreadCount = () => {} }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);

  const updateUnreadCount = (items) => {
    const unread = items.filter((item) => !item.read).length;
    onUpdateUnreadCount(unread);
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      updateUnreadCount(res.data);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifications();
    }, [user])
  );

  const markAsRead = async (id) => {
    try {
      setMarking(true);
      await api.put(`/notifications/read/${id}`);
      setNotifications((prev) => {
        const next = prev.map((item) => (item._id === id ? { ...item, read: true } : item));
        updateUnreadCount(next);
        return next;
      });
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setMarking(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.notificationCard, !item.read && styles.unreadCard]}>
      <View style={styles.headerRow}>
        <Text style={[styles.message, !item.read && styles.unreadMessage]}>{item.message}</Text>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('fr-FR')}</Text>
      {!item.read && (
        <TouchableOpacity style={styles.readButton} onPress={() => markAsRead(item._id)} disabled={marking}>
          <Text style={styles.readButtonText}>{marking ? '...' : 'Marquer lu'}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>{notifications.filter((n) => !n.read).length} non lues</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />}
        ListEmptyComponent={<EmptyView message='Aucune notification' />}
      />
      <Btn title='Rafraîchir' onPress={() => { setRefreshing(true); loadNotifications(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: 16, borderBottomWidth: 1, borderColor: '#E5E7EB', backgroundColor: colors.white },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textLight, marginTop: 4 },
  list: { padding: 12, paddingBottom: 20 },
  notificationCard: { padding: 16, borderRadius: 16 },
  unreadCard: { borderColor: colors.primary, borderWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  message: { fontSize: 15, color: colors.text },
  unreadMessage: { fontWeight: '700' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, marginLeft: 10 },
  date: { fontSize: 12, color: colors.textLight, marginTop: 8 },
  readButton: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  readButtonText: { color: '#fff', fontWeight: '700' },
});