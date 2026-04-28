import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Modal, FlatList, TouchableOpacity, Text } from 'react-native';
import api from '../services/api';
import { Input, Btn, colors } from '../components/common';

export default function ProduitFormScreen({ route, navigation }) {
  const produit = route.params?.produit;
  const isEdit = !!produit?._id;

  const [nom, setNom] = useState(produit?.nom || '');
  const [description, setDescription] = useState(produit?.description || '');
  const [codebarre, setCodebarre] = useState(produit?.codebarre || '');
  const [emplacementId, setEmplacementId] = useState(produit?.emplacement?._id || '');
  const [emplacementNom, setEmplacementNom] = useState(produit?.emplacement?.nomemplacement || '');
  const [emplacements, setEmplacements] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    api.get('/emplacements').then(r => setEmplacements(r.data)).catch(() => {});
    if (route.params?.scannedCode) setCodebarre(route.params.scannedCode);
  }, []);

  const selectEmplacement = (emplacement) => {
    setEmplacementId(emplacement._id);
    setEmplacementNom(emplacement.nomemplacement);
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    const validationErrors = {};
    if (!nom.trim()) validationErrors.nom = 'Le nom du produit est obligatoire';
    if (!codebarre.trim()) validationErrors.codebarre = 'Le code-barres est obligatoire';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const body = { nom, description, codebarre, emplacement: emplacementId || undefined };
      console.log('Envoi données produit:', body);
      if (isEdit) await api.put(`/produits/${produit._id}`, body);
      else await api.post('/produits', body);
      navigation.goBack();
    } catch (e) {
      console.error('Erreur API produit:', e);
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Input
          label="Nom du produit *"
          placeholder="Ex: rinomicine 10 sobres"
          value={nom}
          onChangeText={(value) => { setNom(value); if (errors.nom) setErrors({ ...errors, nom: null }); }}
          error={errors.nom}
        />
        <Input label="Description" placeholder="Description optionnelle" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        <Input
          label="Code-barres *"
          placeholder="Ex: 123456789012"
          value={codebarre}
          onChangeText={(value) => { setCodebarre(value); if (errors.codebarre) setErrors({ ...errors, codebarre: null }); }}
          keyboardType="numeric"
          error={errors.codebarre}
        />

        {/* Sélection emplacement */}
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Emplacement (optionnel)</Text>
          <TouchableOpacity style={styles.productSelector} onPress={() => setModalVisible(true)}>
            <Text style={{ color: emplacementNom ? colors.text : colors.textLight }}>
              {emplacementNom || 'Sélectionner un emplacement'}
            </Text>
          </TouchableOpacity>
        </View>

        <Btn
          title={isEdit ? '💾 Enregistrer' : '➕ Ajouter le produit'}
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

      {/* Modal de sélection d'emplacement */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un emplacement</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ fontSize: 24, color: colors.textLight }}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={emplacements}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.emplacementItem} onPress={() => selectEmplacement(item)}>
                <Text style={styles.emplacementName}>{item.nomemplacement}</Text>
                {item.zone && <Text style={styles.emplacementCode}>Zone: {item.zone}</Text>}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun emplacement trouvé</Text>}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 10 },
  productSelector: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.card,
  },
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emplacementItem: {
    backgroundColor: colors.card,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emplacementName: { fontSize: 16, fontWeight: '700', color: colors.text },
  emplacementCode: { fontSize: 14, color: colors.textLight, marginTop: 6 },
});
