import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  Platform
} from 'react-native';

import api from '../services/api';
import { Input, Btn, colors } from '../components/common';

export default function LotFormScreen({ route, navigation }) {

  const lot = route.params?.lot;
  const isEdit = !!lot?._id;

  const [idlot, setIdlot] = useState(lot?.idlot || '');
  const [quantite, setQuantite] = useState(lot?.quantite?.toString() || '');

  // ✅ date simple string (YYYY-MM-DD)
  const [dateExpiration, setDateExpiration] = useState(
    lot?.dateExpiration
      ? new Date(lot.dateExpiration).toISOString().split('T')[0]
      : ''
  );

  const [produitId, setProduitId] = useState(lot?.produit?._id || '');
  const [produitNom, setProduitNom] = useState(lot?.produit?.nom || '');

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/produits');
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const selectProduct = (product) => {
    setProduitId(product._id);
    setProduitNom(product.nom);
    setModalVisible(false);
  };

  const handleSubmit = async () => {

    if (!idlot.trim() || !quantite || !produitId.trim()) {
      return Alert.alert('Erreur', 'ID lot, quantité et produit sont obligatoires');
    }

    setLoading(true);

    try {
      const body = {
        idlot,
        quantite: Number(quantite),
        produit: produitId,
        dateExpiration: dateExpiration || null,
      };

      if (isEdit) {
        await api.put(`/lots/${lot._id}`, body);
      } else {
        await api.post('/lots', body);
      }

      navigation.goBack();

    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      <View style={styles.form}>

        <Input
          label="ID du lot *"
          placeholder="Ex: LOT-2024-001"
          value={idlot}
          onChangeText={setIdlot}
        />

        <Input
          label="Quantité *"
          placeholder="Ex: 100"
          value={quantite}
          onChangeText={setQuantite}
          keyboardType="numeric"
        />

        {/* 📅 SIMPLE DATE INPUT (WEB + MOBILE) */}
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Date d'expiration</Text>

          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            value={dateExpiration}
            onChangeText={setDateExpiration}
            keyboardType="numeric"
          />

          <Text style={styles.dateHint}>
            Exemple: 2026-12-31
          </Text>
        </View>

        {/* PRODUIT */}
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Produit *</Text>

          <TouchableOpacity
            style={styles.productSelector}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: produitNom ? colors.text : colors.textLight }}>
              {produitNom || 'Sélectionner un produit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BUTTON */}
        <Btn
          title={isEdit ? '💾 Enregistrer' : '➕ Créer le lot'}
          onPress={handleSubmit}
          loading={loading}
        />

        <Btn
          title="Annuler"
          onPress={() => navigation.goBack()}
          color={colors.textLight}
          style={{ marginTop: 8 }}
        />

      </View>

      {/* MODAL PRODUITS */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un produit</Text>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ fontSize: 24, color: colors.textLight }}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={products}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => selectProduct(item)}
              >
                <Text style={styles.productName}>{item.nom}</Text>
                <Text style={styles.productCode}>Code: {item.codebarre}</Text>
              </TouchableOpacity>
            )}
          />

        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 16 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6
  },

  dateInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white,
  },

  dateHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4
  },

  productSelector: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white,
  },

  modalContainer: { flex: 1, backgroundColor: colors.bg },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  modalTitle: { fontSize: 18, fontWeight: '700' },

  productItem: {
    backgroundColor: colors.white,
    padding: 16,
    margin: 8,
    borderRadius: 10,
  },

  productName: { fontSize: 16, fontWeight: '600' },
  productCode: { fontSize: 14, color: colors.textLight, marginTop: 4 },
});