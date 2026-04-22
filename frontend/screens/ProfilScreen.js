import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { Input, Btn, Card, RoleBadge, colors } from '../components/common';
import api from '../services/api';

export default function ProfilScreen({ navigation }) {
  const { user, logout, updateProfil, isAdmin, isGestionnaire } = useAuth();
  const [nom, setNom] = useState(user?.nom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const handleUpdate = async () => {
    if (!nom.trim() || !email.trim()) return Alert.alert('Erreur', 'Nom et email obligatoires');
    setLoading(true);
    try {
      await updateProfil({ nom, email });
      Alert.alert('✅ Succès', 'Profil mis à jour');
    } catch (e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Permission d\'accès à la galerie requise');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled) {
      await uploadPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (asset) => {
    setPhotoLoading(true);
    try {
      console.log('UPLOAD PHOTO asset:', asset);

      let response;
      if (Platform.OS === 'web') {
        const res = await fetch(asset.uri);
        const blob = await res.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const photoBase64 = `data:${blob.type || 'image/jpeg'};base64,${base64}`;
        response = await api.put('/auth/profil/photo', { photoBase64 });
      } else {
        const formData = new FormData();
        console.log('UPLOAD PHOTO native uri:', asset.uri, 'type:', asset.type, 'name:', asset.fileName);
        formData.append('photo', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'profile.jpg',
        });
        response = await api.put('/auth/profil/photo', formData);
      }

      console.log('UPLOAD PHOTO response:', response.data);
      updateProfil({ profilePhoto: response.data.profilePhoto });
      Alert.alert('✅ Succès', 'Photo de profil mise à jour');
    } catch (e) {
      console.log('UPLOAD PHOTO error:', e);
      Alert.alert('Erreur', e.message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const performLogout = async () => {
    try {
      console.log('LOGOUT CLICKED');
      await logout();
      console.log('LOGOUT done, user should be null');
    } catch (e) {
      console.error('Logout failed:', e);
      Alert.alert('Erreur', 'Impossible de se déconnecter');
    }
  };

  const handleLogout = () => {
    const message = `Vous vous apprêtez à vous déconnecter. Êtes-vous sûr(e) ?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        performLogout();
      }
      return;
    }

    Alert.alert('Confirmation de déconnexion', message, [
      { text: 'Rester connecté', style: 'cancel' },
      { text: 'Me déconnecter', style: 'destructive', onPress: performLogout },
    ]);
  };

  const permissions = [
    { label: 'Consulter les données', ok: true },
    { label: 'Scanner des produits', ok: true },
    { label: 'Ajouter / Modifier produits', ok: isGestionnaire },
    { label: 'Gérer les lots', ok: isGestionnaire },
    { label: 'Gérer les emplacements', ok: isGestionnaire },
    { label: 'Générer des rapports', ok: isGestionnaire },
    { label: 'Supprimer des données', ok: isAdmin },
    { label: 'Gérer les utilisateurs', ok: isAdmin },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header profil */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {user?.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.nom?.charAt(0)?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.editIcon}>
            <Text style={styles.editIconText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.nom}</Text>
        <Text style={styles.userLogin}>@{user?.login}</Text>
        <RoleBadge role={user?.role} />
        {photoLoading && <Text style={styles.loadingText}>Chargement...</Text>}
      </View>

      <View style={styles.contentWrapper}>
        {/* Modifier profil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ Modifier mon profil</Text>
          <Card>
            <Input label="Nom complet" value={nom} onChangeText={setNom} />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Btn title="💾 Enregistrer" onPress={handleUpdate} loading={loading} />
          </Card>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Mes permissions</Text>
          <Card>
            {permissions.map((p, i) => (
              <View key={i} style={styles.permRow}>
                <Text style={[styles.permIcon, { color: p.ok ? colors.success : colors.danger }]}>{p.ok ? '✅' : '❌'}</Text>
                <Text style={[styles.permLabel, { color: p.ok ? colors.text : colors.textLight }]}>{p.label}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Liens rapides admin */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Administration</Text>
            <Btn title="👥 Gérer les utilisateurs" onPress={() => navigation.navigate('Users')} color="#7C3AED" />
            <Btn title="📍 Gérer les emplacements" onPress={() => navigation.navigate('EmplacementsScreen')} style={{ marginTop: 8 }} />
            <Btn title="📋 Voir les rapports" onPress={() => navigation.navigate('Rapports')} color={colors.success} style={{ marginTop: 8 }} />
          </View>
        )}

        {/* Déconnexion */}
        <View style={styles.section}>
          <Card style={styles.logoutCard}>
            <Text style={styles.logoutWarning}>⚠️ Zone de déconnexion</Text>
            <Text style={styles.logoutDescription}>Vous serez redirigé vers la page de connexion après déconnexion.</Text>
            <Btn title="🚪 Se déconnecter" onPress={handleLogout} color={colors.danger} style={{ marginTop: 16 }} />
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { alignItems: 'center', paddingBottom: 30 },
  header: { backgroundColor: colors.primary, alignItems: 'center', padding: 30, paddingTop: 50, width: '100%' },
  contentWrapper: { width: '90%', maxWidth: 500 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: '700' },
  editIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.success, borderRadius: 15, width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  editIconText: { fontSize: 16 },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userLogin: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  loadingText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 5 },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.bg },
  permIcon: { fontSize: 16, marginRight: 10 },
  permLabel: { fontSize: 14 },
  logoutCard: { backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: colors.danger, padding: 20 },
  logoutWarning: { fontSize: 14, fontWeight: '800', color: colors.danger, marginBottom: 8 },
  logoutDescription: { fontSize: 13, color: colors.textLight, lineHeight: 20 },
});
