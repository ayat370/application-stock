import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { colors, Card, LoadingView, EmptyView, Btn } from '../components/common';

export default function RapportsScreen() {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchRapports = async () => {
    try {
      const res = await api.get('/rapports');
      console.log('📊 API Response Rapports:', res.data);
      setRapports(res.data.rapports || []);
      console.log('✅ Rapports loaded:', res.data.rapports?.length || 0);
    } catch (e) { 
      console.error('❌ Erreur fetchRapports:', e);
      Alert.alert('Erreur', e.message); 
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchRapports(); }, []));

  const generer = async (type) => {
    console.log(`📋 Génération rapport: ${type}`);
    setGenerating(true);
    try {
      const res = await api.post('/rapports/generer', { type });
      console.log(`✅ Rapport ${type} généré:`, res.data);
      Alert.alert('✅ Succès', `Rapport ${type} généré`);
      await fetchRapports();
    } catch (e) {
      console.error(`❌ Erreur génération ${type}:`, e);
      Alert.alert('Erreur', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async (rapport) => {
    try {
      const response = await api.get(`/rapports/${rapport._id}/pdf`, { responseType: 'blob' });
      
      if (Platform.OS === 'web') {
        // Pour le web, créer un lien de téléchargement
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-${rapport.type}-${rapport._id}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        Alert.alert('✅ Succès', 'PDF téléchargé');
      } else {
        // Pour iOS/Android avec Expo
        const filename = `${FileSystem.documentDirectory}rapport-${rapport.type}-${rapport._id}.pdf`;
        const blob = response.data;
        
        // Convertir le blob en base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            resolve(result.includes('base64,') ? result.split(',')[1] : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        await FileSystem.writeAsStringAsync(filename, base64, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(filename);
        Alert.alert('✅ Succès', 'PDF partagé');
      }
    } catch (e) {
      console.log('PDF ERROR:', e);
      Alert.alert('Erreur téléchargement PDF', e.message);
    }
  };

  const renderBilan = (data) => (
    <View style={styles.bilanGrid}>
      <View style={styles.bilanItem}><Text style={styles.bilanVal}>{data.totalProduits}</Text><Text style={styles.bilanKey}>Produits</Text></View>
      <View style={styles.bilanItem}><Text style={styles.bilanVal}>{data.totalLots}</Text><Text style={styles.bilanKey}>Lots</Text></View>
      <View style={styles.bilanItem}><Text style={styles.bilanVal}>{data.totalEmplacements}</Text><Text style={styles.bilanKey}>Emplacements</Text></View>
      <View style={styles.bilanItem}><Text style={styles.bilanVal}>{data.quantiteTotal}</Text><Text style={styles.bilanKey}>Qté totale</Text></View>
    </View>
  );

  const renderItem = ({ item }) => (
    <Card>
      <View style={styles.rapportHeader}>
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'bilan' ? '#8B5CF620' : '#1A56DB20' }]}>
          <Text style={[styles.typeText, { color: item.type === 'bilan' ? '#8B5CF6' : colors.primary }]}>
            {item.type === 'bilan' ? '📊 Bilan' : '📋 Inventaire'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => downloadPDF(item)} style={styles.pdfBtn}>
          <Text style={styles.pdfText}>📄 PDF</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.rapportDate}>{new Date(item.dategeneration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      {item.generePar && <Text style={styles.generePar}>Par: {item.generePar.nom}</Text>}
      {item.type === 'bilan' && item.data && renderBilan(item.data)}
      {item.type === 'inventaire' && item.data && (
        <Text style={styles.inventaireResume}>
          {item.data.totalProduits} produits • {item.data.totalLots} lots
        </Text>
      )}
    </Card>
  );

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Rapports</Text>
        <Text style={styles.headerSubtitle}>Génération et téléchargement des rapports</Text>
      </View>
      
      <View style={styles.generateRow}>
        <Btn title="📋 Inventaire" onPress={() => generer('inventaire')} loading={generating} style={{ flex: 1, marginRight: 6 }} />
        <Btn title="📊 Bilan" onPress={() => generer('bilan')} loading={generating} color="#8B5CF6" style={{ flex: 1, marginLeft: 6 }} />
      </View>
      
      <FlatList
        data={rapports}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
        ListEmptyComponent={<EmptyView message="Aucun rapport généré" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRapports(); }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  generateRow: { flexDirection: 'row', padding: 12, gap: 8 },
  rapportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  typeText: { fontWeight: '700', fontSize: 14 },
  pdfBtn: { backgroundColor: colors.success, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pdfText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  rapportDate: { fontSize: 12, color: colors.textLight, marginBottom: 6 },
  generePar: { fontSize: 12, color: colors.textLight, marginBottom: 8, fontStyle: 'italic' },
  bilanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  bilanItem: { backgroundColor: colors.bg, borderRadius: 12, padding: 12, minWidth: '45%', flex: 1, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  bilanVal: { fontSize: 26, fontWeight: '800', color: colors.primary },
  bilanKey: { fontSize: 11, color: colors.textLight, fontWeight: '600', marginTop: 4 },
  inventaireResume: { fontSize: 13, color: colors.textLight, marginTop: 8, fontWeight: '500', backgroundColor: colors.bg, padding: 8, borderRadius: 6 },
});
