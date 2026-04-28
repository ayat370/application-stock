import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Alert, ScrollView, Dimensions, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, Card, LoadingView, EmptyView, SearchBar, FilterBar, TableHeader, TableCell, Pagination } from '../components/common';

const { width } = Dimensions.get('window');

export default function MouvementsScreen({ navigation }) {
  const { user } = useAuth();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const canWrite = user?.role !== 'magasinier';
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [stats, setStats] = useState(null);

  const limit = 10;
  const types = ['entrée', 'sortie', 'transfert'];
  const typeColors = {
    'entrée': '#4CAF50',
    'sortie': '#FF6B6B',
    'transfert': '#2196F3'
  };

  const fetchMouvements = async (p = page, fType = filterType) => {
    try {
      setLoading(true);
      const params = { page: p, limit, sortBy: 'dateMouvement', sortOrder: 'desc' };
      if (fType) params.type = fType;

      const res = await api.get('/mouvements', { params });
      setMouvements(res.data.mouvements || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (error) {
      console.error('❌ Erreur:', error.message);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/mouvements/stats/parType');
      setStats(res.data);
    } catch (error) {
      console.error('❌ Erreur stats:', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMouvements(1, filterType);
      fetchStats();
      setPage(1);
    }, [filterType])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMouvements(1, filterType).then(() => setRefreshing(false));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTypeChange = (type) => {
    setFilterType(filterType === type ? '' : type);
    setPage(1);
  };

  const renderMouvement = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('MouvementDetail', { id: item._id })}
      style={styles.mouvementCard}
    >
      <View style={styles.mouvementRow}>
        <View style={[styles.typeBadge, { backgroundColor: typeColors[item.type] }]}>
          <Text style={styles.typeBadgeText}>{item.type[0].toUpperCase()}</Text>
        </View>
        <View style={styles.mouvementInfo}>
          <Text style={styles.produitName}>{item.produit?.nom || 'N/A'}</Text>
          {item.correctionType === 'correction' && (
            <View style={styles.correctionBadge}>
              <Text style={styles.correctionBadgeText}>Correction</Text>
            </View>
          )}
          <Text style={styles.quantiteText}>{item.quantite} unités</Text>
        </View>
        <View style={styles.mouvementDate}>
          <Text style={styles.dateText}>{formatDate(item.dateMouvement)}</Text>
          <Text style={styles.userText}>{item.utilisateur?.nom}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !mouvements.length) return <LoadingView />;

  return (
    <View style={styles.container}>
      {/* Boutons d'action */}
      <View style={styles.actionBar}>
        {canWrite && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.entryBtn]}
              onPress={() => navigation.navigate('MouvementForm', { type: 'entrée' })}
            >
              <Text style={styles.actionBtnText}>⬇️ Entrée</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.exitBtn]}
              onPress={() => navigation.navigate('MouvementForm', { type: 'sortie' })}
            >
              <Text style={styles.actionBtnText}>⬆️ Sortie</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.transferBtn]}
              onPress={() => navigation.navigate('MouvementForm', { type: 'transfert' })}
            >
              <Text style={styles.actionBtnText}>↔ Transfert</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.stockBtn]}
          onPress={() => navigation.navigate('Stock')}
        >
          <Text style={styles.actionBtnText}>📦 Stock</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {types.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              filterType === type && styles.filterChipActive
            ]}
            onPress={() => handleTypeChange(type)}
          >
            <Text style={[
              styles.filterChipText,
              filterType === type && styles.filterChipTextActive
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des mouvements */}
      <FlatList
        data={mouvements}
        renderItem={renderMouvement}
        keyExtractor={(item) => item._id}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<EmptyView message="Aucun mouvement trouvé" />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        style={styles.list}
        contentContainerStyle={mouvements.length === 0 ? styles.listEmpty : null}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            setPage(newPage);
            fetchMouvements(newPage, filterType);
          }}
        />
      )}

      {/* Modal Stats */}
      <Modal visible={statsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.statsModal}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Statistiques</Text>
              <TouchableOpacity onPress={() => setStatsVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.statsContent}>
              {stats && stats.map((stat, idx) => (
                <View key={idx} style={styles.statItem}>
                  <View style={[styles.statBadge, { backgroundColor: typeColors[stat._id] }]}>
                    <Text style={styles.statLabel}>{stat._id}</Text>
                  </View>
                  <View style={styles.statValues}>
                    <Text style={styles.statValue}>Opérations: <Text style={styles.statValueBold}>{stat.count}</Text></Text>
                    <Text style={styles.statValue}>Total: <Text style={styles.statValueBold}>{stat.totalQuantite}</Text></Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 5,
  },
  actionBtn: {
    minWidth: 110,
    width: '30%',
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  actionBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  entryBtn: {
    backgroundColor: colors.success,
  },
  exitBtn: {
    backgroundColor: colors.danger,
  },
  transferBtn: {
    backgroundColor: colors.primary,
  },
  stockBtn: {
    backgroundColor: colors.info,
  },
  filterScroll: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  list: {
    flex: 1,
    padding: 14,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mouvementCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },
  mouvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  typeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  correctionBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  correctionBadgeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  mouvementInfo: {
    flex: 1,
  },
  produitName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  quantiteText: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
  },
  mouvementDate: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
  },
  userText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  statsModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    fontSize: 24,
    color: colors.textLight,
  },
  statsContent: {
    padding: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    gap: 12,
  },
  statBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  statValues: {
    flex: 1,
  },
  statValue: {
    fontSize: 13,
    color: colors.textLight,
    marginVertical: 2,
  },
  statValueBold: {
    fontWeight: 'bold',
    color: colors.text,
  },
});
