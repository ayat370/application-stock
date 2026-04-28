import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal, FlatList
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../components/common';

export default function MouvementFormScreen({ route, navigation }) {
  const { user } = useAuth();
  const { type = 'entrée', mouvementId } = route.params || {};
  const [mouvementType, setMouvementType] = useState(type);
  const [isEditMode, setIsEditMode] = useState(!!mouvementId);

  // État du formulaire
  const [formData, setFormData] = useState({
    produit: '',
    lot: '',
    quantite: '',
    emplacementSource: '',
    emplacementDestinaire: '',
    description: '',
    reference: ''
  });

  const [produits, setProduits] = useState([]);
  const [lots, setLots] = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedEmplacementSource, setSelectedEmplacementSource] = useState(null);
  const [selectedEmplacementDestinaire, setSelectedEmplacementDestinaire] = useState(null);

  // Modals
  const [produitModalVisible, setProduitModalVisible] = useState(false);
  const [lotModalVisible, setLotModalVisible] = useState(false);
  const [emplacementSourceModalVisible, setEmplacementSourceModalVisible] = useState(false);
  const [emplacementDestinataireModalVisible, setEmplacementDestinataireModalVisible] = useState(false);


  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [produitsRes, emplacementsRes] = await Promise.all([
        api.get('/produits', { params: { limit: 100 } }),
        api.get('/emplacements', { params: { limit: 100 } })
      ]);

      setProduits(produitsRes.data.produits || []);
      setEmplacements(emplacementsRes.data.emplacements || []);

      if (isEditMode && mouvementId) {
        await fetchMouvementToEdit(mouvementId);
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMouvementToEdit = async (id) => {
    try {
      const res = await api.get(`/mouvements/${id}`);
      const data = res.data;
      setMouvementType(data.type);
      setFormData({
        produit: data.produit?._id || '',
        lot: data.lot?._id || '',
        quantite: data.quantite?.toString() || '',
        emplacementSource: data.emplacementSource?._id || '',
        emplacementDestinaire: data.emplacementDestinaire?._id || '',
        description: data.description || '',
        reference: data.reference || ''
      });
      setSelectedProduit(data.produit || null);
      setSelectedLot(data.lot || null);
      setSelectedEmplacementSource(data.emplacementSource || null);
      setSelectedEmplacementDestinaire(data.emplacementDestinaire || null);
      if (data.produit?._id) {
        await fetchLots(data.produit._id);
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const fetchLots = async (produitId) => {
    try {
      const res = await api.get(`/lots?produit=${produitId}&limit=100`);
      setLots(res.data.lots || []);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleSelectProduit = (produit) => {
    setFormData(prev => ({ ...prev, produit: produit._id, lot: '' })); // Réinitialiser le lot
    setSelectedProduit(produit);
    setSelectedLot(null); // Réinitialiser la sélection du lot
    setProduitModalVisible(false);
    fetchLots(produit._id);
  };

  const handleSelectLot = (lot) => {
    setFormData(prev => ({ ...prev, lot: lot._id }));
    setSelectedLot(lot);
    setLotModalVisible(false);
  };

  const handleSelectEmplacementSource = (emplacement) => {
    setFormData(prev => ({ ...prev, emplacementSource: emplacement._id }));
    setSelectedEmplacementSource(emplacement);
    setEmplacementSourceModalVisible(false);
  };

  const handleSelectEmplacementDestinaire = (emplacement) => {
    setFormData(prev => ({ ...prev, emplacementDestinaire: emplacement._id }));
    setSelectedEmplacementDestinaire(emplacement);
    setEmplacementDestinataireModalVisible(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (isEditMode) {
      setErrors(newErrors);
      return true;
    }

    if (!formData.produit) newErrors.produit = 'Produit requis';
    if (!formData.quantite || parseInt(formData.quantite) <= 0) {
      newErrors.quantite = 'Quantité invalide';
    }

    if (mouvementType === 'transfert') {
      if (!formData.emplacementSource) newErrors.emplacementSource = 'Emplacement source requis';
      if (!formData.emplacementDestinaire) newErrors.emplacementDestinaire = 'Emplacement destinataire requis';
    } else if (mouvementType === 'entrée') {
      if (!formData.emplacementDestinaire) newErrors.emplacementDestinaire = 'Emplacement requis';
    } else if (mouvementType === 'sortie') {
      if (!formData.emplacementSource) newErrors.emplacementSource = 'Emplacement requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      let endpoint = '';
      let payload = {
        produit: formData.produit,
        lot: formData.lot || undefined,
        quantite: parseInt(formData.quantite),
        description: formData.description,
        reference: formData.reference
      };

      if (isEditMode && mouvementId) {
        const res = await api.put(`/mouvements/${mouvementId}`, {
          description: formData.description,
          reference: formData.reference
        });
        Alert.alert('Succès', res.data.message);
        navigation.goBack();
      } else {
        if (mouvementType === 'entrée') {
          endpoint = '/mouvements/entree/create';
          payload.emplacement = formData.emplacementDestinaire;
        } else if (mouvementType === 'sortie') {
          endpoint = '/mouvements/sortie/create';
          payload.emplacement = formData.emplacementSource;
        } else if (mouvementType === 'transfert') {
          endpoint = '/mouvements/transfert/create';
          payload.emplacementSource = formData.emplacementSource;
          payload.emplacementDestinaire = formData.emplacementDestinaire;
        }

        const res = await api.post(endpoint, payload);
        Alert.alert('Succès', res.data.message);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProduitItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleSelectProduit(item)}
    >
      <View>
        <Text style={styles.modalItemTitle}>{item.nom}</Text>
        <Text style={styles.modalItemSubtitle}>{item.codebarre}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLotItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleSelectLot(item)}
    >
      <View>
        <Text style={styles.modalItemTitle}>{item.idlot}</Text>
        <Text style={styles.modalItemSubtitle}>Quantité: {item.quantite}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmplacementItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        if (emplacementSourceModalVisible) {
          handleSelectEmplacementSource(item);
        } else if (emplacementDestinataireModalVisible) {
          handleSelectEmplacementDestinaire(item);
        }
      }}
    >
      <View>
        <Text style={styles.modalItemTitle}>{item.nomemplacement}</Text>
        <Text style={styles.modalItemSubtitle}>{item.zone}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.form}>
        {/* Titre avec type */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditMode ? '✏️ Modifier le mouvement' : 
              mouvementType === 'entrée' ? '📥 Entrée de Stock' : 
              mouvementType === 'sortie' ? '📤 Sortie de Stock' : 
              '↔️ Transfert de Stock'}
          </Text>
          {isEditMode && (
            <Text style={styles.editModeText}>
              Seules la description et la référence peuvent être modifiées.
            </Text>
          )}
        </View>

        {/* Sélection Produit */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Produit *</Text>
          <TouchableOpacity
            style={[styles.input, errors.produit && styles.inputError, isEditMode && styles.inputDisabledBox]}
            onPress={() => !isEditMode && setProduitModalVisible(true)}
            disabled={isEditMode}
          >
            <Text style={styles.inputText}>
              {selectedProduit ? selectedProduit.nom : 'Sélectionner un produit'}
            </Text>
          </TouchableOpacity>
          {errors.produit && <Text style={styles.errorText}>{errors.produit}</Text>}
        </View>

        {/* Sélection Lot */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Lot</Text>
          <TouchableOpacity
            style={[styles.input, isEditMode && styles.inputDisabledBox]}
            onPress={() => !isEditMode && lots.length > 0 && setLotModalVisible(true)}
            disabled={isEditMode || lots.length === 0}
          >
            <Text style={[styles.inputText, lots.length === 0 && styles.inputDisabled]}>
              {selectedLot ? selectedLot.idlot : !selectedProduit ? '⚠️ Sélectionner d\'abord un produit' : 'Aucun lot pour ce produit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quantité */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Quantité *</Text>
          <TextInput
            style={[styles.input, errors.quantite && styles.inputError, isEditMode && styles.inputDisabledBox]}
            placeholder="0"
            keyboardType="number-pad"
            value={formData.quantite}
            onChangeText={(val) => !isEditMode && setFormData(prev => ({ ...prev, quantite: val }))}
            editable={!isEditMode}
          />
          {errors.quantite && <Text style={styles.errorText}>{errors.quantite}</Text>}
        </View>

        {/* Emplacement Source (Transfert / Sortie) */}
        {(mouvementType === 'transfert' || mouvementType === 'sortie') && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {mouvementType === 'transfert' ? 'Emplacement Source *' : 'Emplacement *'}
            </Text>
            <TouchableOpacity
              style={[styles.input, errors.emplacementSource && styles.inputError, isEditMode && styles.inputDisabledBox]}
              onPress={() => !isEditMode && setEmplacementSourceModalVisible(true)}
              disabled={isEditMode}
            >
              <Text style={styles.inputText}>
                {selectedEmplacementSource ? selectedEmplacementSource.nomemplacement : 'Sélectionner un emplacement'}
              </Text>
            </TouchableOpacity>
            {errors.emplacementSource && <Text style={styles.errorText}>{errors.emplacementSource}</Text>}
          </View>
        )}

        {/* Emplacement Destinataire (Transfert / Entrée) */}
        {(mouvementType === 'transfert' || mouvementType === 'entrée') && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {mouvementType === 'transfert' ? 'Emplacement Destinataire *' : 'Emplacement *'}
            </Text>
            <TouchableOpacity
              style={[styles.input, errors.emplacementDestinaire && styles.inputError, isEditMode && styles.inputDisabledBox]}
              onPress={() => !isEditMode && setEmplacementDestinataireModalVisible(true)}
              disabled={isEditMode}
            >
              <Text style={styles.inputText}>
                {selectedEmplacementDestinaire ? selectedEmplacementDestinaire.nomemplacement : 'Sélectionner un emplacement'}
              </Text>
            </TouchableOpacity>
            {errors.emplacementDestinaire && <Text style={styles.errorText}>{errors.emplacementDestinaire}</Text>}
          </View>
        )}

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description du mouvement..."
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(val) => setFormData(prev => ({ ...prev, description: val }))}
          />
        </View>

        {/* Référence */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Référence (Facture, Bon de commande...)</Text>
          <TextInput
            style={styles.input}
            placeholder="BL-2024-001"
            value={formData.reference}
            onChangeText={(val) => setFormData(prev => ({ ...prev, reference: val }))}
          />
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.btn, styles.btnCancel]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSubmit]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? '⏳ Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={produitModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un produit</Text>
              <TouchableOpacity onPress={() => setProduitModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={produits}
              renderItem={renderProduitItem}
              keyExtractor={(item) => item._id}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={lotModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un lot</Text>
              <TouchableOpacity onPress={() => setLotModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={lots}
              renderItem={renderLotItem}
              keyExtractor={(item) => item._id}
              style={styles.modalList}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun lot disponible</Text>}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={emplacementSourceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner l'emplacement source</Text>
              <TouchableOpacity onPress={() => setEmplacementSourceModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={emplacements}
              renderItem={renderEmplacementItem}
              keyExtractor={(item) => item._id}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={emplacementDestinataireModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner l'emplacement destinataire</Text>
              <TouchableOpacity onPress={() => setEmplacementDestinataireModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={emplacements}
              renderItem={renderEmplacementItem}
              keyExtractor={(item) => item._id}
              style={styles.modalList}
            />
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
  form: {
    padding: 22,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  formGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.white,
    fontSize: 15,
    color: colors.text,
  },
  inputText: {
    color: colors.text,
    fontSize: 15,
  },
  inputDisabled: {
    color: colors.textLight,
  },
  inputDisabledBox: {
    backgroundColor: '#F8FAFC',
  },
  editModeText: {
    marginTop: 8,
    color: colors.textLight,
    fontSize: 13,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#E2E8F0',
  },
  btnSubmit: {
    backgroundColor: colors.primary,
  },
  btnText: {
    fontWeight: '700',
    fontSize: 14,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    fontSize: 24,
    color: colors.textLight,
  },
  modalList: {
    maxHeight: '100%',
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  modalItemSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: colors.textLight,
  },
});
