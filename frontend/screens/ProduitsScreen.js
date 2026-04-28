import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Alert, ScrollView, Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, Card, LoadingView, EmptyView, confirmDelete, SearchBar, FilterBar, TableHeader, TableCell, Pagination } from '../components/common';

const { width } = Dimensions.get('window');

export default function ProduitsScreen({ navigation }) {
  const { canWrite, canDelete, user } = useAuth();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterEmplacement, setFilterEmplacement] = useState('');
  const [emplacements, setEmplacements] = useState([]);

  const limit = 3;

  const fetchProduits = async (q = search, p = page, sBy = sortBy, sOrder = sortOrder, emp = filterEmplacement) => {
    try {
      const params = { 
        search: q, 
        page: p, 
        limit, 
        sortBy: sBy, 
        sortOrder: sOrder 
      };
      if (emp) params.emplacement = emp;
      
      console.log('🔍 Fetching produits with params:', params);
      const res = await api.get('/produits', { params });
      console.log('📦 API Response:', res.data);
      setProduits(res.data.produits || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
      console.log('✅ Produits loaded:', res.data.produits?.length || 0);
    } catch (e) { 
      console.error('❌ Error fetching produits:', e.message);
      Alert.alert('Erreur', e.message); 
      setProduits([]);
      setTotalPages(1);
      setTotal(0);
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchEmplacements = async () => {
    try {
      const res = await api.get('/emplacements');
      setEmplacements(res.data.emplacements || []);
    } catch (e) { 
      console.log(e.message);
      setEmplacements([]);
    }
  };

  useFocusEffect(useCallback(() => { 
    fetchEmplacements();
    fetchProduits(); 
  }, []));

  const handleDelete = (id, nom) => {
    confirmDelete(nom, async () => {
      try {
        await api.delete(`/produits/${id}`);
        fetchProduits(search, page, sortBy, sortOrder, filterEmplacement);
      } catch (e) {
        Alert.alert('Erreur', e.message);
      }
    });
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
    fetchProduits(search, 1, field, newOrder, filterEmplacement);
  };

  const handleFilter = (emp) => {
    setFilterEmplacement(emp);
    setPage(1);
    fetchProduits(search, 1, sortBy, sortOrder, emp);
  };

  const handleSearch = (q) => {
    setSearch(q);
    setPage(1);
    fetchProduits(q, 1, sortBy, sortOrder, filterEmplacement);
  };

  const renderHeader = () => {
    const columns = [
      { key: 'nom', label: 'Produit', flex: 2 },
      { key: 'codebarre', label: 'Code-barres', flex: 1.5 },
      { key: 'emplacement', label: 'Emplacement', flex: 1.5 },
      { key: 'actions', label: 'Actions', flex: 1, sortable: false },
    ];
    return <TableHeader columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />;
  };

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, { flex: 2 }]}>
        <Text style={styles.cellText} numberOfLines={2}>{item.nom}</Text>
        {item.description && <Text style={styles.cellSubText} numberOfLines={1}>{item.description}</Text>}
      </View>
      <View style={[styles.tableCell, { flex: 1.5 }]}>
        <Text style={styles.cellText}>{item.codebarre || 'N/A'}</Text>
      </View>
      <View style={[styles.tableCell, { flex: 1.5 }]}>
        <Text style={styles.cellText}>{item.emplacement?.nomemplacement || 'N/A'}</Text>
        {item.emplacement?.zone && <Text style={styles.cellSubText}>{item.emplacement.zone}</Text>}
      </View>
      <View style={[styles.tableCell, { flex: 1 }]}>
        <View style={styles.actions}>
          {canWrite && (
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ProduitForm', { produit: item })}>
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.nom)}>
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderPagination = () => (
    <Pagination 
      page={page} 
      totalPages={totalPages} 
      total={total}
      loading={loading}
      onPrevious={() => { if (page > 1) { setPage(page - 1); fetchProduits(search, page - 1, sortBy, sortOrder, filterEmplacement); } }}
      onNext={() => { if (page < totalPages) { setPage(page + 1); fetchProduits(search, page + 1, sortBy, sortOrder, filterEmplacement); } }}
    />
  );

  if (loading) return <LoadingView />;

  const filterOptions = [
    { id: '', label: 'Tous' },
    ...emplacements.map(emp => ({ id: emp._id, label: emp.nomemplacement })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Produits</Text>
        <Text style={styles.headerSubtitle}>Gestion des produits en stock</Text>
      </View>
      
      <SearchBar 
        value={search} 
        onChangeText={handleSearch}
        placeholder="🔍 Chercher par nom ou code-barres..."
      />
      
      <FilterBar 
        filters={filterOptions}
        activeFilter={filterEmplacement}
        onFilterChange={handleFilter}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableWrapper}>
        <View style={styles.table}>
          {renderHeader()}
          <FlatList
            data={produits}
            keyExtractor={i => i._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={<EmptyView message="Aucun produit trouvé" />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProduits(search, page, sortBy, sortOrder, filterEmplacement); }} />}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
      
      {renderPagination()}
      
      {canWrite && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ProduitForm', {})}>
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
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 2, borderBottomColor: colors.border },
  headerCell: { paddingVertical: 14, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center' },
  headerText: { fontSize: 13, fontWeight: '700', color: colors.text },
  tableRow: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  tableCell: { paddingVertical: 12, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center' },
  cellText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  cellSubText: { fontSize: 12, color: colors.textLight, marginTop: 2 },
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
