import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, Card, LoadingView, EmptyView, confirmDelete, SearchBar, FilterBar, TableHeader, Pagination } from '../components/common';

const { width } = Dimensions.get('window');

export default function LotsScreen({ navigation }) {
  const { canWrite, canDelete } = useAuth();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('datecreation');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState(''); // 'expired', 'expiring', 'normal'

  const limit = 10;

  const fetchLots = async (q = search, p = page, sBy = sortBy, sOrder = sortOrder, status = filterStatus) => {
    try {
      const params = { 
        search: q, 
        page: p, 
        limit, 
        sortBy: sBy, 
        sortOrder: sOrder 
      };
      
      const res = await api.get('/lots', { params });
      let filteredLots = res.data.lots || [];
      
      // Client-side filtering for status
      if (status) {
        const now = new Date();
        filteredLots = filteredLots.filter(lot => {
          if (!lot.dateExpiration) return status === 'normal';
          const expDate = new Date(lot.dateExpiration);
          const isExpired = expDate < now;
          const isExpiring = expDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
          
          if (status === 'expired') return isExpired;
          if (status === 'expiring') return !isExpired && isExpiring;
          if (status === 'normal') return !isExpired && !isExpiring;
          return true;
        });
      }
      
      setLots(filteredLots);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { 
      Alert.alert('Erreur', e.message); 
      setLots([]);
      setTotalPages(1);
      setTotal(0);
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchLots(); }, []));

  const handleDelete = (id, idlot) => {
    confirmDelete(idlot, async () => {
      try {
        await api.delete(`/lots/${id}`);
        fetchLots(search, page, sortBy, sortOrder, filterStatus);
      } catch (e) { Alert.alert('Erreur', e.message); }
    });
  };

  const isExpired = (date) => date && new Date(date) < new Date();
  const isExpiring = (date) => {
    if (!date) return false;
    const expDate = new Date(date);
    const now = new Date();
    return expDate > now && expDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
    fetchLots(search, 1, field, newOrder, filterStatus);
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    setPage(1);
    fetchLots(search, 1, sortBy, sortOrder, status);
  };

  const handleSearch = (q) => {
    setSearch(q);
    setPage(1);
    fetchLots(q, 1, sortBy, sortOrder, filterStatus);
  };

  const renderHeader = () => {
    const columns = [
      { key: 'idlot', label: 'N° Lot', flex: 1.5 },
      { key: 'produit', label: 'Produit', flex: 2 },
      { key: 'quantite', label: 'Quantité', flex: 1 },
      { key: 'dateExpiration', label: 'Expiration', flex: 1.5 },
      { key: 'actions', label: 'Actions', flex: 1, sortable: false },
    ];
    return <TableHeader columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />;
  };

  const renderItem = ({ item }) => {
    const expired = isExpired(item.dateExpiration);
    const expiring = isExpiring(item.dateExpiration);
    
    return (
      <View style={[styles.tableRow, expired && { backgroundColor: '#FEF2F2' }, expiring && !expired && { backgroundColor: '#FFF8E1' }]}>
        <View style={[styles.tableCell, { flex: 1.5 }]}>
          <Text style={styles.cellText}>#{item.idlot}</Text>
        </View>
        <View style={[styles.tableCell, { flex: 2 }]}>
          <Text style={styles.cellText} numberOfLines={2}>{item.produit?.nom || 'Produit inconnu'}</Text>
        </View>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <Text style={styles.cellText}>{item.quantite}</Text>
        </View>
        <View style={[styles.tableCell, { flex: 1.5 }]}>
          {item.dateExpiration ? (
            <Text style={[styles.cellText, expired && { color: colors.danger, fontWeight: '700' }, expiring && !expired && { color: colors.warning, fontWeight: '700' }]}>
              {expired ? '⚠️ Expiré' : expiring ? '⚠️ Bientôt' : new Date(item.dateExpiration).toLocaleDateString('fr-FR')}
            </Text>
          ) : (
            <Text style={styles.cellText}>-</Text>
          )}
        </View>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <View style={styles.actions}>
            {canWrite && (
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('LotForm', { lot: item })}>
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.idlot)}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPagination = () => (
    <Pagination 
      page={page} 
      totalPages={totalPages} 
      total={total}
      loading={loading}
      onPrevious={() => { if (page > 1) { setPage(page - 1); fetchLots(search, page - 1, sortBy, sortOrder, filterStatus); } }}
      onNext={() => { if (page < totalPages) { setPage(page + 1); fetchLots(search, page + 1, sortBy, sortOrder, filterStatus); } }}
    />
  );

  if (loading) return <LoadingView />;

  const filterOptions = [
    { id: '', label: 'Tous' },
    { id: 'normal', label: '✓ Normal' },
    { id: 'expiring', label: '⚠️ Expire bientôt' },
    { id: 'expired', label: '🔴 Expiré' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Lots</Text>
        <Text style={styles.headerSubtitle}>Gestion des lots de produits</Text>
      </View>
      
      <SearchBar 
        value={search} 
        onChangeText={handleSearch}
        placeholder="🔍 Chercher par lot ou produit..."
      />
      
      <FilterBar 
        filters={filterOptions}
        activeFilter={filterStatus}
        onFilterChange={handleFilter}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableWrapper}>
        <View style={styles.table}>
          {renderHeader()}
          <FlatList
            data={lots}
            keyExtractor={i => i._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={<EmptyView message="Aucun lot trouvé" />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLots(search, page, sortBy, sortOrder, filterStatus); }} />}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
      
      {renderPagination()}
      
      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('LotForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  tableWrapper: { flex: 1 },
  table: { minWidth: width },
  tableRow: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  tableCell: { paddingVertical: 12, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center' },
  cellText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  actionIcon: { fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 56 },
});
