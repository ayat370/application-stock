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

  // ✅ date as string for Web compatibility (YYYY-MM-DD)
  const [dateExpiration, setDateExpiration] = useState(
    lot?.dateExpiration
      ? new Date(lot.dateExpiration).toISOString().split('T')[0]
      : ''
  );

  const [produitId, setProduitId] = useState(lot?.produit?._id || '');
  const [produitNom, setProduitNom] = useState(lot?.produit?.nom || '');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/produits');
      setProducts(res.data.produits || []);
    } catch (e) {
      console.error(e);
    }
  };

  const selectProduct = (product) => {
    setProduitId(product._id);
    setProduitNom(product.nom);
    setErrors({ ...errors, produit: null });
    setModalVisible(false);
  };

  const validateLotForm = () => {
    const validationErrors = {};
    if (!idlot.trim()) validationErrors.idlot = 'L’identifiant du lot est obligatoire';
    if (!quantite.trim()) validationErrors.quantite = 'La quantité est obligatoire';
    else if (isNaN(Number(quantite)) || Number(quantite) < 0) validationErrors.quantite = 'Entrez un nombre valide';
    if (!produitId.trim()) validationErrors.produit = 'Le produit est obligatoire';
    return validationErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateLotForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const body = {
        idlot,
        quantite: Number(quantite),
        produit: produitId,
        dateExpiration: dateExpiration ? new Date(dateExpiration).toISOString() : null,
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
          onChangeText={(value) => { setIdlot(value); if (errors.idlot) setErrors({ ...errors, idlot: null }); }}
          error={errors.idlot}
        />

        <Input
          label="Quantité *"
          placeholder="Ex: 100"
          value={quantite}
          onChangeText={(value) => { setQuantite(value); if (errors.quantite) setErrors({ ...errors, quantite: null }); }}
          keyboardType="numeric"
          error={errors.quantite}
        />

        {/* 📅 DATE INPUT - Web compatible */}
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Date d'expiration</Text>

          {Platform.OS === 'web' ? (
            // HTML date input for Web
            <input
              type="date"
              value={dateExpiration}
              onChange={(e) => setDateExpiration(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: 10,
                backgroundColor: colors.white,
                fontSize: 16,
                borderStyle: 'solid',
                outline: 'none',
              }}
              min={new Date().toISOString().split('T')[0]}
            />
          ) : (
            // TextInput for mobile
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={dateExpiration}
              onChangeText={setDateExpiration}
              keyboardType="numeric"
            />
          )}

          <Text style={styles.dateHint}>
            {Platform.OS === 'web'
              ? 'Utilisez le calendrier ou saisissez YYYY-MM-DD'
              : 'Exemple: 2026-12-31'
            }
          </Text>
        </View>

        {/* PRODUIT */}
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Produit *</Text>

          <TouchableOpacity
            style={[styles.productSelector, errors.produit && { borderColor: colors.danger }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: produitNom ? colors.text : colors.textLight }}>
              {produitNom || 'Sélectionner un produit'}
            </Text>
          </TouchableOpacity>
          {errors.produit && <Text style={styles.errorText}>{errors.produit}</Text>}
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