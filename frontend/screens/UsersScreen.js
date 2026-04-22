import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { colors, Card, LoadingView, EmptyView, RoleBadge, Btn, Input, confirmDelete } from '../components/common';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', login: '', mdp: '', role: 'magasinier', email: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchUsers(); }, []));

  const handleCreate = async () => {
    if (!form.nom || !form.login || !form.mdp || !form.email) {
      return Alert.alert('Erreur', 'Tous les champs sont obligatoires');
    }
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      setShowForm(false);
      setForm({ nom: '', login: '', mdp: '', role: 'magasinier', email: '' });
      fetchUsers();
    } catch (e) { Alert.alert('Erreur', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (id, nom) => {
    confirmDelete(nom, async () => {
      console.log('Deleting user:', id, nom);
      try {
        await api.delete(`/auth/users/${id}`);
        console.log('User deleted successfully');
        setUsers(u => u.filter(x => x._id !== id));
      } catch (e) { 
        console.error('Delete error:', e.message);
        Alert.alert('Erreur', e.message); 
      }
    });
  };

  const ROLES = ['magasinier', 'gestionnaire', 'admin'];

  const renderItem = ({ item }) => (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.nom?.charAt(0)?.toUpperCase()}</Text></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{item.nom}</Text>
          <Text style={styles.login}>@{item.login} • {item.email}</Text>
          <RoleBadge role={item.role} />
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.nom)}>
          <Text>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      {showForm ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>➕ Nouvel utilisateur</Text>
          <Input label="Nom" placeholder="Nom complet" value={form.nom} onChangeText={v => setForm(f => ({ ...f, nom: v }))} />
          <Input label="Login" placeholder="login unique" value={form.login} onChangeText={v => setForm(f => ({ ...f, login: v }))} autoCapitalize="none" />
          <Input label="Mot de passe" placeholder="Min 6 caractères" value={form.mdp} onChangeText={v => setForm(f => ({ ...f, mdp: v }))} secureTextEntry />
          <Input label="Email" placeholder="email@exemple.com" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Rôle</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setForm(f => ({ ...f, role: r }))}>
                <Text style={[styles.roleBtnText, form.role === r && { color: '#fff' }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Btn title="✅ Créer" onPress={handleCreate} loading={saving} />
          <Btn title="Annuler" onPress={() => setShowForm(false)} color={colors.textLight} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.count}>{users.length} utilisateur(s)</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={users}
            keyExtractor={i => i._id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<EmptyView message="Aucun utilisateur" />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  count: { fontSize: 14, fontWeight: '700', color: colors.textLight },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  login: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  deleteBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  formContainer: { padding: 16 },
  formTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  roleBtnText: { fontWeight: '600', color: colors.text, fontSize: 12 },
});
