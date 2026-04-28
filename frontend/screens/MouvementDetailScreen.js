import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { colors } from '../components/common';

export default function MouvementDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { canWrite } = useAuth();
  const [mouvement, setMouvement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [annulerLoading, setAnnulerLoading] = useState(false);

  useEffect(() => {
    fetchMouvement();
  }, [id]);

  const fetchMouvement = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/mouvements/${id}`);
      setMouvement(res.data);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const executeAnnulation = async () => {
    try {
      setAnnulerLoading(true);
      console.log('📤 Envoi de l\'annulation pour ID:', id);
      const response = await api.post(`/mouvements/${id}/annuler`);
      console.log('✅ Réponse d\'annulation:', response.data);
      Alert.alert('Succès', 'Mouvement annulé et correction enregistrée');
      setTimeout(() => navigation.goBack(), 500);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'annuler le mouvement');
    } finally {
      setAnnulerLoading(false);
    }
  };

  const handleAnnuler = () => {
    console.log('🔄 handleAnnuler called with id:', id);

    const title = 'Confirmation';
    const message = 'Voulez-vous annuler ce mouvement ? Une correction sera créée pour préserver l\'historique.';

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) executeAnnulation();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        onPress: executeAnnulation,
        style: 'destructive'
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!mouvement) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Mouvement non trouvé</Text>
      </View>
    );
  }

  const typeColors = {
    'entrée': '#4CAF50',
    'sortie': '#FF6B6B',
    'transfert': '#2196F3'
  };

  const typeLabels = {
    'entrée': '📥 Entrée',
    'sortie': '📤 Sortie',
    'transfert': '↔️ Transfert'
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* En-tête avec type */}
        <View style={[styles.header, { backgroundColor: typeColors[mouvement.type] }]}>
          <Text style={styles.typeLabel}>{typeLabels[mouvement.type]}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{mouvement.statut}</Text>
          </View>
        </View>

        {/* Informations principales */}
        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produit</Text>
            <Text style={styles.productName}>{mouvement.produit?.nom}</Text>
            <Text style={styles.productCode}>{mouvement.produit?.codebarre}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantité</Text>
            <Text style={styles.quantityBig}>{mouvement.quantite}</Text>
            <Text style={styles.quantityUnit}>unités</Text>
          </View>
        </View>

        {/* Lot */}
        {mouvement.lot && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lot</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Lot:</Text>
              <Text style={styles.detailValue}>{mouvement.lot?.idlot}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantité Lot:</Text>
              <Text style={styles.detailValue}>{mouvement.lot?.quantite}</Text>
            </View>
            {mouvement.lot?.dateExpiration && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expiration:</Text>
                <Text style={styles.detailValue}>
                  {new Date(mouvement.lot.dateExpiration).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Emplacements */}
        {(mouvement.emplacementSource || mouvement.emplacementDestinaire) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Emplacements</Text>
            {mouvement.emplacementSource && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📍 Source:</Text>
                <Text style={styles.detailValue}>
                  {mouvement.emplacementSource?.nomemplacement} ({mouvement.emplacementSource?.zone})
                </Text>
              </View>
            )}
            {mouvement.emplacementDestinaire && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📍 Destinataire:</Text>
                <Text style={styles.detailValue}>
                  {mouvement.emplacementDestinaire?.nomemplacement} ({mouvement.emplacementDestinaire?.zone})
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Date et Utilisateur */}
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(mouvement.dateMouvement)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Utilisateur:</Text>
            <Text style={styles.detailValue}>{mouvement.utilisateur?.nom}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{mouvement.utilisateur?.email}</Text>
          </View>
        </View>

        {/* Description */}
        {mouvement.description && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{mouvement.description}</Text>
          </View>
        )}

        {mouvement.correctionType === 'correction' && mouvement.originalMouvement && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Correction</Text>
            <Text style={styles.detailValue}>Correction du mouvement {mouvement.originalMouvement._id}</Text>
            <Text style={styles.detailValue}>Type original : {mouvement.originalMouvement.type}</Text>
          </View>
        )}

        {mouvement.annulePar && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Annulé par</Text>
            <Text style={styles.detailValue}>Mouvement {mouvement.annulePar._id}</Text>
            <Text style={styles.detailValue}>Type de correction : {mouvement.annulePar.type}</Text>
          </View>
        )}

        {/* Référence */}
        {mouvement.reference && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Référence</Text>
            <Text style={styles.referenceText}>{mouvement.reference}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Audit</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Créé le:</Text>
            <Text style={styles.detailValue}>{formatDate(mouvement.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mis à jour le:</Text>
            <Text style={styles.detailValue}>{formatDate(mouvement.updatedAt)}</Text>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionBar}>
          {canWrite && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('MouvementForm', {
                type: mouvement.type,
                mouvementId: id
              })}
            >
              <Text style={styles.actionBtnText}>✏️ Modifier les détails</Text>
            </TouchableOpacity>
          )}
          {canWrite && mouvement.correctionType !== 'correction' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn, annulerLoading && styles.disabledBtn]}
              onPress={handleAnnuler}
              disabled={annulerLoading}
            >
              <Text style={styles.actionBtnText}>
                {annulerLoading ? '⏳ Annulation en cours...' : '↩️ Annuler mouvement'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    padding: 15
  },
  header: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  typeLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary
  },
  section: {
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  productCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15
  },
  quantityBig: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary
  },
  quantityUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    flex: 1
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    textAlign: 'right'
  },
  descriptionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20
  },
  referenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.danger
  },
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    marginBottom: 20
  },
  actionBtn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  editBtn: {
    backgroundColor: colors.primary
  },
  deleteBtn: {
    backgroundColor: colors.danger
  },
  cancelBtn: {
    backgroundColor: '#d54d5d'
  },
  disabledBtn: {
    opacity: 0.6
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15
  }
});
