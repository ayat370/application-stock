import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, Card, LoadingView, EmptyView } from '../components/common';
import api from '../services/api';

const { width } = Dimensions.get('window');

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
      {/* TOPBAR */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <Text style={styles.topbarTitle}>📊 Stock Dashboard</Text>
        </View>
        <View style={styles.topbarRight}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{user?.nom?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.nom}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* HERO CARD */}
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.nom} 👋</Text>
          <Text style={styles.subGreeting}>Bienvenue dans votre tableau de bord</Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* SECTION INDICATEURS */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📈 Indicateurs clés</Text>
        <View style={styles.statsGrid}>
          <StatCard emoji="📦" label="Produits" value={stats?.totalProduits} color={colors.primary} />
          <StatCard emoji="🗂️" label="Lots" value={stats?.totalLots} color={colors.success} />
          <StatCard emoji="📍" label="Emplacements" value={stats?.totalEmplacements} color="#F59E0B" />
          <StatCard emoji="🔢" label="Stock total" value={stats?.quantiteTotal} color="#8B5CF6" />
          <StatCard emoji="⚠️" label="Stock faible" value={stats?.lowStockProduits} color="#EF4444" />
          <StatCard emoji="⏰" label="Lots expirés" value={stats?.expiredLots} color="#F97316" />
        </View>
      </View>

      {/* SECTION ALERTES */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>⚠️ Aperçu des alertes</Text>
        <View style={styles.alertsGrid}>
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
            <Text style={styles.barText}>{expiredRatio}% des lots ont dépassé la date d'expiration</Text>
          </Card>
        </View>
      </View>

      {/* SECTION TABLES */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📋 Gestion du stock</Text>
        <View style={styles.tablesGrid}>
          <View style={styles.tableSection}>
            <Text style={styles.tableHeaderTitle}>Lots à stock faible</Text>
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
          </View>
          <View style={styles.tableSection}>
            <Text style={styles.tableHeaderTitle}>Lots expirés récemment</Text>
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
          </View>
        </View>
      </View>

      {/* SECTION RACCOURCIS */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🔗 Accès rapide</Text>
        <View style={styles.menuGrid}>
          <MenuBtn emoji="📦" label="Produits" screen="Produits" />
          <MenuBtn emoji="🗂️" label="Lots" screen="Lots" />
          <MenuBtn emoji="📊" label="Stock" screen="Stock" />
          <MenuBtn emoji="📷" label="Scanner" screen="Scanner" />
          <MenuBtn emoji="↔️" label="Mouvements" screen="Mouvements" />
          <MenuBtn emoji="📍" label="Emplacements" screen="EmplacementsScreen" restricted />
          <MenuBtn emoji="📋" label="Rapports" screen="Rapports" restricted />
          {isAdmin && <MenuBtn emoji="👥" label="Utilisateurs" screen="Users" />}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  page: { paddingBottom: 28, paddingTop: 0 },
  
  /* TOPBAR */
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    paddingTop: 12,
  },
  topbarLeft: { flex: 1 },
  topbarTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  userInfo: { paddingRight: 8 },
  userName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  
  /* HERO CARD */
  heroCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, margin: 16, borderRadius: 24, backgroundColor: colors.primary,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14, shadowRadius: 26, elevation: 10,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6, lineHeight: 30 },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', maxWidth: '80%' },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18 },
  heroBadgeText: { color: '#fff', fontWeight: '700', letterSpacing: 0.4, fontSize: 12 },
  
  /* SECTIONS */
  sectionContainer: { paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 14 },
  
  /* STATS GRID */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: {
    width: '48%', paddingHorizontal: 16, paddingVertical: 18,
    borderRadius: 18, justifyContent: 'space-between', backgroundColor: colors.card,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05,
    shadowRadius: 14, elevation: 4,
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statEmoji: { fontSize: 26 },
  statLabel: { fontSize: 11, color: colors.textLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  statLabelCard: { fontSize: 10 },
  statValue: { fontSize: 32, fontWeight: '800', color: colors.text },
  
  /* ALERTS */
  alertsGrid: { gap: 12 },
  insightCard: {
    padding: 18, borderRadius: 18, backgroundColor: colors.card, 
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 3,
  },
  insightLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12, color: colors.text },
  barContainer: { width: '100%', height: 10, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 999 },
  barText: { color: colors.textLight, fontSize: 12, fontWeight: '500' },
  
  /* TABLES */
  tablesGrid: { gap: 14 },
  tableSection: { marginBottom: 4 },
  tableHeaderTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
  tableCard: { 
    padding: 0, borderRadius: 16, backgroundColor: colors.card, 
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 3,
    overflow: 'hidden',
  },
  tableRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: '#E2E8F0' 
  },
  tableText: { flex: 1, paddingRight: 8 },
  tableTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  tableSubtitle: { fontSize: 11, color: colors.textLight, marginTop: 3 },
  tableRight: { fontSize: 12, fontWeight: '700', color: colors.primary },
  
  /* MENU GRID */
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, paddingBottom: 20 },
  menuBtn: {
    width: '23%', backgroundColor: colors.card,
    borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04,
    shadowRadius: 14, elevation: 3,
  },
  menuEmoji: { fontSize: 24, marginBottom: 6 },
  menuLabel: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 15 },
});
