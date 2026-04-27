import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../services/api';
import { colors, Card, Btn } from '../components/common';

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const scanLineY = useRef(new Animated.Value(-120)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (!scanned && hasPermission) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: 120,
            duration: 2500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineY, {
            toValue: -120,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    }
    return () => animationRef.current?.stop();
  }, [scanned, hasPermission, scanLineY]);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await api.get(`/produits/codebarre/${data}`);
      setProduct(res.data);
    } catch (e) {
      setProduct(null);
      Alert.alert('Produit non trouvé', `Code: ${data}\nVoulez-vous ajouter ce produit ?`, [
        { text: 'Non', onPress: () => setScanned(false) },
        { text: 'Oui', onPress: () => navigation.navigate('ProduitForm', { scannedCode: data }) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const simulateScan = async () => {
    const fakeBarcode = '8071234567894';
    setProduct(null);
    setLoading(true);

    try {
      const res = await api.get(`/produits/codebarre/${fakeBarcode}`);
      setProduct(res.data);
      setScanned(true);
    } catch (e) {
      setProduct(null);
      setScanned(false);
      Alert.alert('Produit non trouvé', `Code: ${fakeBarcode}\nVoulez-vous ajouter ce produit ?`, [
        { text: 'Non', onPress: () => {} },
        { text: 'Oui', onPress: () => navigation.navigate('ProduitForm', { scannedCode: fakeBarcode }) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setProduct(null);
  };

  if (hasPermission === null) return (
    <View style={styles.center}><Text style={styles.loaderText}>Demande de permission...</Text></View>
  );
  if (hasPermission === false) return (
    <View style={styles.center}><Text style={styles.errorText}>❌ Accès caméra refusé</Text></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.pillBadge}>
          <MaterialIcons name="qr-code-scanner" size={16} color={colors.primary} />
          <Text style={styles.pillText}>Scanner avancé</Text>
        </View>
        <Text style={styles.title}>Scan & gérer vos produits</Text>
        <Text style={styles.subtitle}>Placez le code-barres dans le cadre lumineux pour obtenir les informations instantanément.</Text>
      </View>

      {!product ? (
        <View style={styles.scannerSection}>
          <Camera
            style={styles.cameraPreview}
            onBarCodeScanned={handleBarCodeScanned}
            type={Camera.Constants.Type.back}
          />

          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.scanContainer}>
              <View style={styles.overlayLayer} />
              <View style={styles.scanFrame}>
                <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.scanHint}>Cadrez le code-barres ici</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.smartButton} onPress={simulateScan}>
              <FontAwesome5 name="magic" size={16} color={colors.white} style={styles.buttonIcon} />
              <Text style={styles.smartButtonText}>Simuler un scan</Text>
            </TouchableOpacity>
            <Text style={styles.actionNote}>Scan rapide | Résultat instantané | Interface premium</Text>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultBadge}>Résultat du scan</Text>
            <Text style={styles.resultTitle}>{loading ? 'Recherche en cours…' : 'Produit détecté'}</Text>
            <Text style={styles.resultSubtitle}>Analyse du code-barres et aperçu du produit.</Text>
          </View>

          {loading ? (
            <View style={styles.statusCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loaderText, { marginTop: 16 }]}>Recherche du produit...</Text>
            </View>
          ) : (
            <>
              <Card style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View>
                    <Text style={styles.productName}>{product.nom}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <MaterialIcons name="barcode" size={14} color={colors.primary} />
                        <Text style={styles.metaText}>{product.codebarre}</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <MaterialIcons name="location-on" size={14} color={colors.success} />
                        <Text style={styles.metaText}>{product.emplacement?.nomemplacement || 'Non localisé'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.statusBadgeCard}>
                    <Text style={styles.statusBadgeText}>En stock</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="description" size={18} color={colors.textLight} />
                  <Text style={styles.detailLabel}>Description</Text>
                </View>
                <Text style={styles.detailValue}>{product.description || 'Aucune description disponible.'}</Text>

                <View style={styles.divider} />

                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Emplacement</Text>
                    <Text style={styles.infoValue}>{product.emplacement ? `${product.emplacement.nomemplacement} • ${product.emplacement.zone}` : '—'}</Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>ID</Text>
                    <Text style={styles.infoValue}>{product._id?.slice(-8) || '—'}</Text>
                  </View>
                </View>
              </Card>

              <Btn title="Modifier ce produit" onPress={() => navigation.navigate('ProduitForm', { product })} />
            </>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={resetScan}>
            <MaterialIcons name="refresh" size={18} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Nouveau scan</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07131f',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#07131f',
  },
  loaderText: {
    color: colors.white,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
  },
  headerBar: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: '#0d1f34',
  },
  pillBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  pillText: {
    color: colors.primary,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '92%',
  },
  scannerSection: {
    flex: 1,
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanContainer: {
    alignItems: 'center',
    width: '100%',
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 20, 42, 0.5)',
    borderRadius: 32,
  },
  scanFrame: {
    width: 290,
    height: 290,
    borderRadius: 32,
    borderWidth: 1.8,
    borderColor: 'rgba(96, 165, 250, 0.95)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
  },
  scanLine: {
    position: 'absolute',
    width: '90%',
    height: 2.7,
    backgroundColor: '#60a5fa',
    borderRadius: 2,
    opacity: 0.95,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#60a5fa',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanHint: {
    marginTop: 22,
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  actionsRow: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 18,
    backgroundColor: '#07131f',
  },
  smartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    shadowColor: '#0d4fff',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 10,
  },
  smartButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  actionNote: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  resultContainer: {
    padding: 24,
    backgroundColor: '#07131f',
    paddingBottom: 40,
  },
  resultHeader: {
    marginBottom: 22,
  },
  resultBadge: {
    alignSelf: 'flex-start',
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  resultTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultSubtitle: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '92%',
  },
  statusCard: {
    marginBottom: 20,
    padding: 26,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  productCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  productName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  metaText: {
    color: '#cbd5e1',
    marginLeft: 8,
    fontSize: 13,
  },
  statusBadgeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusBadgeText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  detailValue: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
    marginVertical: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  infoCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '700',
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  actionsInline: {
    flexDirection: 'row',
    width: '100%',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  secondaryButtonText: {
    color: colors.primary,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '700',
  },
});
