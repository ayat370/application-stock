import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import api from '../services/api';
import { colors, Card, Btn } from '../components/common';

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await api.get(`/produits/codebarre/${data}`);
      setProduit(res.data);
    } catch (e) {
      Alert.alert('Produit non trouvé', `Code: ${data}\nVoulez-vous ajouter ce produit ?`, [
        { text: 'Non', onPress: () => setScanned(false) },
        { text: 'Oui', onPress: () => navigation.navigate('ProduitForm', { scannedCode: data }) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) return <View style={styles.center}><Text>Demande de permission...</Text></View>;
  if (hasPermission === false) return <View style={styles.center}><Text style={styles.errorText}>❌ Accès caméra refusé</Text></View>;

  return (
    <View style={styles.container}>
      {!scanned ? (
        <View style={{ flex: 1 }}>
          <Camera
            style={StyleSheet.absoluteFillObject}
            onBarCodeScanned={handleBarCodeScanned}
            type={Camera.Constants.Type.back}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Pointez la caméra vers un code-barres</Text>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Recherche du produit...</Text>
          ) : produit ? (
            <>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.resultTitle}>Produit trouvé !</Text>
              <Card style={{ width: '100%' }}>
                <Text style={styles.label}>Nom</Text>
                <Text style={styles.value}>{produit.nom}</Text>
                <Text style={styles.label}>Code-barres</Text>
                <Text style={styles.value}>{produit.codebarre}</Text>
                {produit.description && <>
                  <Text style={styles.label}>Description</Text>
                  <Text style={styles.value}>{produit.description}</Text>
                </>}
                {produit.emplacement && <>
                  <Text style={styles.label}>Emplacement</Text>
                  <Text style={styles.value}>📍 {produit.emplacement.nomemplacement} ({produit.emplacement.zone})</Text>
                </>}
              </Card>
              <Btn title="📝 Modifier ce produit" onPress={() => navigation.navigate('ProduitForm', { produit })} />
            </>
          ) : null}
          <Btn title="🔄 Scanner à nouveau" onPress={() => { setScanned(false); setProduit(null); }} color={colors.textLight} style={{ marginTop: 12 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: colors.danger },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 250, height: 250, borderWidth: 3, borderColor: '#fff',
    borderRadius: 16, backgroundColor: 'transparent',
  },
  scanHint: { color: '#fff', marginTop: 20, fontSize: 14, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 4 },
  resultContainer: { flexGrow: 1, backgroundColor: colors.bg, padding: 24, alignItems: 'center' },
  loadingText: { fontSize: 16, color: colors.textLight, marginTop: 40 },
  successIcon: { fontSize: 64, marginBottom: 12 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: colors.success, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textLight, marginTop: 8 },
  value: { fontSize: 15, color: colors.text, fontWeight: '500' },
});
