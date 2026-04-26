import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { Input, Btn, colors, Card } from '../components/common';

const ZONES = ['rayon', 'depot', 'etagere'];

export default function EmplacementFormScreen({ route, navigation }) {
  const emp = route.params?.emplacement;
  const isEdit = !!emp?._id;

  const [nomemplacement, setNomemplacement] = useState(emp?.nomemplacement || '');
  const [zone, setZone] = useState(emp?.zone || 'rayon');
  const [nbboite, setNbboite] = useState(emp?.nbboite?.toString() || '0');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const validationErrors = {};
    if (!nomemplacement.trim()) validationErrors.nomemplacement = 'Le nom de l’emplacement est obligatoire';
    if (!zone) validationErrors.zone = 'La zone est obligatoire';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const body = { nomemplacement, zone, nbboite: Number(nbboite) };
      if (isEdit) await api.put(`/emplacements/${emp._id}`, body);
      else await api.post('/emplacements', body);
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
          label="Nom de l'emplacement *"
          placeholder="Ex: Rayon A1"
          value={nomemplacement}
          onChangeText={(value) => { setNomemplacement(value); if (errors.nomemplacement) setErrors({ ...errors, nomemplacement: null }); }}
          error={errors.nomemplacement}
        />
        
        <Text style={styles.label}>Zone *</Text>
        <View style={styles.zoneRow}>
          {ZONES.map(z => (
            <TouchableOpacity
              key={z}
              style={[styles.zoneBtn, zone === z && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setZone(z)}
            >
              <Text style={[styles.zoneBtnText, zone === z && { color: '#fff' }]}>{z.charAt(0).toUpperCase() + z.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Nombre de boîtes" placeholder="0" value={nbboite} onChangeText={setNbboite} keyboardType="numeric" />
        <Btn title={isEdit ? '💾 Enregistrer' : '➕ Ajouter'} onPress={handleSubmit} loading={loading} />
        <Btn title="Annuler" onPress={() => navigation.goBack()} color={colors.textLight} style={{ marginTop: 8 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 8 },
  zoneRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  zoneBtn: {
    flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white,
  },
  zoneBtnText: { fontWeight: '600', color: colors.text },
});
