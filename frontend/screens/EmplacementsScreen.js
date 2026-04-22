import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, Card, LoadingView, EmptyView, confirmDelete } from '../components/common';

const zoneColors = { rayon: '#3B82F6', depot: '#8B5CF6', etagere: '#0E9F6E' };

export default function EmplacementsScreen({ navigation }) {
  const { canWrite, canDelete } = useAuth();
  const [emplacements, setEmplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmplacements = async () => {
    try {
      const res = await api.get('/emplacements');
      setEmplacements(res.data);
    } catch (e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchEmplacements(); }, []));

  const handleDelete = (id, nom) => {
    confirmDelete(nom, async () => {
      try {
        await api.delete(`/emplacements/${id}`);
        setEmplacements(e => e.filter(x => x._id !== id));
      } catch (e) { Alert.alert('Erreur', e.message); }
    });
  };

  const renderItem = ({ item }) => {
    const zoneColor = zoneColors[item.zone] || colors.primary;
    return (
      <Card>
        <View style={styles.row}>
          <View style={[styles.zoneBadge, { backgroundColor: zoneColor + '20', borderColor: zoneColor }]}>
            <Text style={[styles.zoneText, { color: zoneColor }]}>{item.zone?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{item.nomemplacement}</Text>
            <Text style={styles.boites}>📦 {item.nbboite} boîtes</Text>
          </View>
          <View style={styles.actions}>
            {canWrite && (
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EmplacementForm', { emplacement: item })}>
                <Text>✏️</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.nomemplacement)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      <FlatList
        data={emplacements}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={<EmptyView message="Aucun emplacement trouvé" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEmplacements(); }} />}
      />
      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('EmplacementForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center' },
  zoneBadge: { borderWidth: 1.5, borderRadius: 8, padding: 8, minWidth: 60, alignItems: 'center' },
  zoneText: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  boites: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 56 },
});
