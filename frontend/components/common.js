import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, Platform
} from 'react-native';

export const colors = {
  primary: '#1A56DB',
  success: '#0E9F6E',
  danger: '#F05252',
  warning: '#E3A008',
  bg: '#F3F4F6',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textLight: '#6B7280',
  white: '#FFFFFF',
};

export const Btn = ({ title, onPress, color = colors.primary, loading, style, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading || disabled}
    style={[styles.btn, { backgroundColor: color }, style, (loading || disabled) && { opacity: 0.6 }]}
  >
    {loading
      ? <ActivityIndicator color="#fff" />
      : <Text style={styles.btnText}>{title}</Text>
    }
  </TouchableOpacity>
);

export const Input = ({ label, error, ...props }) => (
  <View style={{ marginBottom: 14 }}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, error && { borderColor: colors.danger }]}
      placeholderTextColor={colors.textLight}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const RoleBadge = ({ role }) => {
  const map = {
    admin: { label: 'Admin', color: '#7C3AED' },
    gestionnaire: { label: 'Gestionnaire', color: colors.primary },
    magasinier: { label: 'Magasinier', color: colors.success },
  };
  const r = map[role] || map.magasinier;
  return (
    <View style={[styles.badge, { backgroundColor: r.color + '20', borderColor: r.color }]}>
      <Text style={[styles.badgeText, { color: r.color }]}>{r.label}</Text>
    </View>
  );
};

export const LoadingView = () => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export const EmptyView = ({ message = 'Aucun élément trouvé' }) => (
  <View style={styles.center}>
    <Text style={{ fontSize: 40 }}>📭</Text>
    <Text style={[styles.label, { marginTop: 8 }]}>{message}</Text>
  </View>
);

export const confirmDelete = (title, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`Supprimer "${title}" ?`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert('Confirmer', `Supprimer "${title}" ?`, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
  ]);
};

// 📊 Composants de Tableau Modernes
export const SearchBar = ({ value, onChangeText, placeholder = '🔍 Rechercher...' }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={colors.textLight}
    />
  </View>
);

export const FilterBar = ({ filters, activeFilter, onFilterChange, style }) => (
  <View style={[styles.filterBar, style]}>
    {filters.map((filter) => (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterButton,
          activeFilter === filter.id && styles.filterButtonActive,
        ]}
        onPress={() => onFilterChange(filter.id)}
      >
        <Text
          style={[
            styles.filterButtonText,
            activeFilter === filter.id && styles.filterButtonTextActive,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const TableHeader = ({ columns, sortBy, sortOrder, onSort }) => (
  <View style={styles.tableHeader}>
    {columns.map((col) => (
      <TouchableOpacity
        key={col.key}
        style={[styles.headerCell, { flex: col.flex }]}
        onPress={() => col.sortable !== false && onSort(col.key)}
        disabled={col.sortable === false}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>{col.label}</Text>
          {col.sortable !== false && sortBy === col.key && (
            <Text style={styles.sortIcon}>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
          )}
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

export const TableRow = ({ item, columns, children, style }) => (
  <View style={[styles.tableRow, style]}>
    {children}
  </View>
);

export const TableCell = ({ children, flex = 1, style }) => (
  <View style={[styles.tableCell, { flex }]}>
    {typeof children === 'string' ? (
      <Text style={styles.cellText} numberOfLines={2}>{children}</Text>
    ) : (
      children
    )}
  </View>
);

export const Pagination = ({ page, totalPages, total, loading, onPrevious, onNext }) => (
  <View style={styles.pagination}>
    <TouchableOpacity
      style={[styles.paginationBtn, page <= 1 && styles.paginationBtnDisabled]}
      onPress={onPrevious}
      disabled={page <= 1 || loading}
    >
      <Text style={styles.paginationBtnText}>← Précédent</Text>
    </TouchableOpacity>

    <View style={styles.pageInfo}>
      <Text style={styles.pageInfoText}>
        <Text style={styles.pageNumber}>{page}</Text>
        <Text style={styles.pageText}> / </Text>
        <Text style={styles.pageNumber}>{totalPages}</Text>
      </Text>
      <Text style={styles.totalInfo}>({total} total)</Text>
    </View>

    <TouchableOpacity
      style={[styles.paginationBtn, page >= totalPages && styles.paginationBtnDisabled]}
      onPress={onNext}
      disabled={page >= totalPages || loading}
    >
      <Text style={styles.paginationBtnText}>Suivant →</Text>
    </TouchableOpacity>
  </View>
);

export const StatusBadge = ({ status, variant = 'default' }) => {
  const variants = {
    danger: { bg: '#FEE2E2', text: colors.danger, label: '⚠️ Danger' },
    warning: { bg: '#FEF3C7', text: colors.warning, label: '⚠️ Attention' },
    success: { bg: '#ECFDF5', text: colors.success, label: '✓ Actif' },
    normal: { bg: '#E0E7FF', text: colors.primary, label: '○ Normal' },
    default: { bg: colors.bg, text: colors.text, label: status },
  };
  const v = variants[variant] || variants.default;
  return (
    <View style={[styles.statusBadge, { backgroundColor: v.bg }]}>
      <Text style={[styles.statusBadgeText, { color: v.text }]}>
        {variant === 'default' ? v.label : v.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    padding: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, padding: 12, fontSize: 15,
    color: colors.text, backgroundColor: colors.white,
  },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 14,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  badge: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  // 📊 Styles des Tableaux Modernes
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
  },
  filterBar: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerCell: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  sortIcon: {
    fontSize: 12,
    marginLeft: 4,
    color: colors.primary,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  tableCell: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paginationBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  paginationBtnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  paginationBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  pageInfo: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  pageInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  pageNumber: {
    color: colors.primary,
    fontWeight: '700',
  },
  pageText: {
    color: colors.textLight,
  },
  totalInfo: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
