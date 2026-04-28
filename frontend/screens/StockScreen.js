import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { colors, LoadingView, EmptyView, SearchBar, FilterBar, TableHeader, Pagination } from '../components/common';

const { width } = Dimensions.get('window');

export default function StockScreen() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('produit');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState(''); // 'low', 'expired', 'normal'

  const limit = 10;

  const fetchStock = async (q = search, p = page, sBy = sortBy, sOrder = sortOrder, status = filterStatus) => {
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
        filteredLots = filteredLots.filter(lot => {
          const isLow = lot.quantite < 10;
          const isExpired = lot.dateExpiration && new Date(lot.dateExpiration) < new Date();
          
          if (status === 'low') return isLow && !isExpired;
          if (status === 'expired') return isExpired;
          if (status === 'normal') return !isLow && !isExpired;
          return true;
        });
      }
      
      setLots(filteredLots);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { 
      console.log(e.message); 
      setLots([]);
      setTotalPages(1);
      setTotal(0);
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchStock(); }, []));

  const isLow = (quantite) => quantite < 10;
  const isExpired = (date) => date && new Date(date) < new Date();

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
    fetchStock(search, 1, field, newOrder, filterStatus);
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    setPage(1);
    fetchStock(search, 1, sortBy, sortOrder, status);
  };

  const handleSearch = (q) => {
    setSearch(q);
    setPage(1);
    fetchStock(q, 1, sortBy, sortOrder, filterStatus);
  };

  const renderHeader = () => {
    const columns = [
      { key: 'produit', label: 'Produit', flex: 2 },
      { key: 'idlot', label: 'N° Lot', flex: 1 },
      { key: 'quantite', label: 'Quantité', flex: 1 },
      { key: 'statut', label: 'Statut', flex: 1.5, sortable: false },
    ];
    return <TableHeader columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />;
  };

  const renderItem = ({ item }) => {
    const low = isLow(item.quantite);
    const expired = isExpired(item.dateExpiration);
    
    return (
      <View style={[styles.tableRow, expired && { backgroundColor: '#FEF2F2' }, low && !expired && { backgroundColor: '#FFF8E1' }]}>
        <View style={[styles.tableCell, { flex: 2 }]}>
          <Text style={styles.cellText} numberOfLines={2}>{item.produit?.nom || 'Inconnu'}</Text>
          <Text style={styles.cellSubText}>{item.produit?.codebarre}</Text>
        </View>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <Text style={styles.cellText}>#{item.idlot}</Text>
        </View>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <View style={[styles.qtyBadge, { backgroundColor: low ? colors.danger + '20' : colors.success + '20' }]}>
            <Text style={[styles.qty, { color: low ? colors.danger : colors.success }]}>{item.quantite}</Text>
          </View>
        </View>
        <View style={[styles.tableCell, { flex: 1.5 }]}>
          {expired && <Text style={styles.statusTag}>🔴 Expiré</Text>}
          {low && !expired && <Text style={styles.statusTag}>⚠️ Stock bas</Text>}
          {!low && !expired && <Text style={styles.statusTag}>✓ Normal</Text>}
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
      onPrevious={() => { if (page > 1) { setPage(page - 1); fetchStock(search, page - 1, sortBy, sortOrder, filterStatus); } }}
      onNext={() => { if (page < totalPages) { setPage(page + 1); fetchStock(search, page + 1, sortBy, sortOrder, filterStatus); } }}
    />
  );

  if (loading) return <LoadingView />;

  const filterOptions = [
    { id: '', label: 'Tous' },
    { id: 'normal', label: '✓ Normal' },
    { id: 'low', label: '⚠️ Stock bas' },
    { id: 'expired', label: '🔴 Expiré' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Inventaire</Text>
        <Text style={styles.headerSubtitle}>Vue d'ensemble des stocks</Text>
      </View>
      
      <SearchBar 
        value={search} 
        onChangeText={handleSearch}
        placeholder="🔍 Filtrer par produit ou lot..."
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
            ListEmptyComponent={<EmptyView message="Aucun stock trouvé" />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStock(search, page, sortBy, sortOrder, filterStatus); }} />}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
      
      {renderPagination()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 6,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textLight, marginTop: 6 },
  tableWrapper: { flex: 1, marginTop: 12 },
  table: {
    minWidth: width,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  tableRow: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.bg, minHeight: 64 },
  tableCell: { paddingVertical: 16, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center' },
  cellText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  cellSubText: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  qtyBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, alignSelf: 'flex-start' },
  qty: { fontSize: 14, fontWeight: '700' },
  statusTag: { fontSize: 13, fontWeight: '600', color: colors.text },
});
