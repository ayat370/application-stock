import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, Card, LoadingView, EmptyView } from '../components/common';
import api from '../services/api';

export default function DashboardScreen({ navigation }) {
  const { user, isAdmin, isGestionnaire } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/rapports/stats/dashboard');
      setStats(res.data);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const lowStockRatio = useMemo(() => {
    if (!stats) return 0;
    return stats.totalProduits ? Math.round((stats.lowStockProduits / stats.totalProduits) * 100) : 0;
  }, [stats]);

  const expiredRatio = useMemo(() => {
    if (!stats) return 0;
    return stats.totalLots ? Math.round((stats.expiredLots / stats.totalLots) * 100) : 0;
  }, [stats]);

  useEffect(() => { fetchStats(); }, []);

  const StatCard = ({ emoji, label, value, color }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statCardHeader}>
        <Text style={styles.statEmoji}>{emoji}</Text>
        <Text style={[styles.statLabel, styles.statLabelCard]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value ?? '...'}</Text>
    </Card>
  );

  const TableRow = ({ title, subtitle, right }) => (
    <View style={styles.tableRow}>
      <View style={styles.tableText}>
        <Text style={styles.tableTitle}>{title}</Text>
        {subtitle ? <Text style={styles.tableSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.tableRight}>{right}</Text>
    </View>
  );

  const MenuBtn = ({ emoji, label, screen, restricted }) => {
    if (restricted && !isGestionnaire) return null;
    return (
      <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate(screen)}>
        <Text style={styles.menuEmoji}>{emoji}</Text>
        <Text style={styles.menuLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingView />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />}
    >
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.nom} 👋</Text>
          <Text style={styles.subGreeting}>Bienvenue dans votre tableau de bord</Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Indicateurs clés</Text>
      <View style={styles.statsGrid}>
        <StatCard emoji="📦" label="Produits" value={stats?.totalProduits} color={colors.primary} />
        <StatCard emoji="🗂️" label="Lots" value={stats?.totalLots} color={colors.success} />
        <StatCard emoji="📍" label="Emplacements" value={stats?.totalEmplacements} color="#F59E0B" />
        <StatCard emoji="🔢" label="Stock total" value={stats?.quantiteTotal} color="#8B5CF6" />
        <StatCard emoji="⚠️" label="Stock faible" value={stats?.lowStockProduits} color="#EF4444" />
        <StatCard emoji="⏰" label="Lots expirés" value={stats?.expiredLots} color="#F97316" />
      </View>

      <Text style={styles.sectionTitle}>Aperçu des alertes</Text>
      <Card style={styles.insightCard}>
        <Text style={styles.insightLabel}>Produits en dessous du seuil</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${lowStockRatio}%`, backgroundColor: '#EF4444' }]} />
        </View>
        <Text style={styles.barText}>{lowStockRatio}% des produits sont à surveiller</Text>
      </Card>
      <Card style={styles.insightCard}>
        <Text style={styles.insightLabel}>Lots expirés</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${expiredRatio}%`, backgroundColor: '#F97316' }]} />
        </View>
        <Text style={styles.barText}>{expiredRatio}% des lots ont dépassé la date d’expiration</Text>
      </Card>

      <Text style={styles.sectionTitle}>Lots à stock faible</Text>
      <Card style={styles.tableCard}>
        {stats.lowStockLots && stats.lowStockLots.length > 0 ? (
          stats.lowStockLots.map((lot) => (
            <TableRow
              key={lot.idLot}
              title={`${lot.produit} (${lot.codebarre})`}
              subtitle={`Lot ${lot.idLot}`}
              right={`${lot.quantite} unités`}
            />
          ))
        ) : (
          <EmptyView message="Aucun lot en stock faible" />
        )}
      </Card>

      <Text style={styles.sectionTitle}>Lots expirés récemment</Text>
      <Card style={styles.tableCard}>
        {stats.expiredLotsList && stats.expiredLotsList.length > 0 ? (
          stats.expiredLotsList.map((lot) => (
            <TableRow
              key={lot.idLot}
              title={`${lot.produit} (${lot.codebarre})`}
              subtitle={`Expiry ${new Date(lot.dateExpiration).toLocaleDateString('fr-FR')}`}
              right={`${lot.quantite}`}
            />
          ))
        ) : (
          <EmptyView message="Aucun lot expiré" />
        )}
      </Card>

      <Text style={styles.sectionTitle}>Raccourcis</Text>
      <View style={styles.menuGrid}>
        <MenuBtn emoji="📦" label="Produits" screen="Produits" />
        <MenuBtn emoji="🗂️" label="Lots" screen="Lots" />
        <MenuBtn emoji="📊" label="Stock" screen="Stock" />
        <MenuBtn emoji="📷" label="Scanner" screen="Scanner" />
        <MenuBtn emoji="📍" label="Emplacements" screen="EmplacementsScreen" restricted />
        <MenuBtn emoji="📋" label="Rapports" screen="Rapports" restricted />
        {isAdmin && <MenuBtn emoji="👥" label="Utilisateurs" screen="Users" />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  page: { paddingBottom: 30 },
  heroCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, margin: 16, borderRadius: 20, backgroundColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.16)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16 },
  heroBadgeText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  statCard: {
    width: '48%', margin: '1%', paddingHorizontal: 16, paddingVertical: 22,
    borderRadius: 18, justifyContent: 'space-between', backgroundColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08,
    shadowRadius: 12, elevation: 4,
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statEmoji: { fontSize: 24 },
  statLabelCard: { fontSize: 12, color: colors.textLight, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 32, fontWeight: '800' },
  insightCard: { marginHorizontal: 16, padding: 18, borderRadius: 18, backgroundColor: colors.white, marginBottom: 14 },
  insightLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: colors.text },
  barContainer: { width: '100%', height: 10, borderRadius: 999, backgroundColor: '#E5E7EB', overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 999 },
  barText: { color: colors.textLight, fontSize: 12 },
  tableCard: { marginHorizontal: 16, padding: 0, borderRadius: 18, backgroundColor: colors.white, marginBottom: 18 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  tableText: { flex: 1, paddingRight: 10 },
  tableTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  tableSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  tableRight: { fontSize: 14, fontWeight: '700', color: colors.primary },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 30 },
  menuBtn: {
    width: '29%', margin: '2%', backgroundColor: colors.white,
    borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  menuEmoji: { fontSize: 26, marginBottom: 8 },
  menuLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
