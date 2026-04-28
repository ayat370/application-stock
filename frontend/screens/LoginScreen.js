import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Animated, Easing, TextInput, Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Input, Btn, colors } from '../components/common';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [mdp, setMdp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!loginId.trim()) {
      newErrors.loginId = 'L\'identifiant est requis';
    }
    if (!mdp.trim()) {
      newErrors.mdp = 'Le mot de passe est requis';
    } else if (mdp.length < 4) {
      newErrors.mdp = 'Le mot de passe doit contenir au moins 4 caractères';
    }
    return newErrors;
  };

  const handleLogin = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    setServerError('');

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await login(loginId.trim(), mdp);
    } catch (err) {
      setServerError(err.message || 'Erreur de connexion');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.background}>
        <View style={styles.overlay} />
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>📦</Text>
                <View style={styles.logoGlow} />
              </View>
              <Text style={styles.title}>StockApp</Text>
              <Text style={styles.subtitle}>Plateforme de gestion de stock intelligente</Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
              <Text style={styles.formTitle}>Connexion à votre compte</Text>
              
              {/* Message d'erreur serveur */}
              {serverError ? (
                <Animated.View style={[styles.errorBox, { opacity: fadeAnim }]}>
                  <Text style={styles.errorBoxText}>⚠️ {serverError}</Text>
                </Animated.View>
              ) : null}

              {/* Champ Identifiant */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Identifiant</Text>
                <View style={[styles.inputWrapper, errors.loginId && styles.inputError]}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    placeholder="Votre login"
                    value={loginId}
                    onChangeText={(text) => { setLoginId(text); if (errors.loginId) setErrors({ ...errors, loginId: null }); }}
                    style={styles.inputField}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                {errors.loginId && <Text style={styles.errorText}>{errors.loginId}</Text>}
              </View>

              {/* Champ Mot de passe */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={[styles.inputWrapper, errors.mdp && styles.inputError]}>
                  <Text style={styles.inputIcon}>🔐</Text>
                  <TextInput
                    placeholder="Votre mot de passe"
                    value={mdp}
                    onChangeText={(text) => { setMdp(text); if (errors.mdp) setErrors({ ...errors, mdp: null }); }}
                    secureTextEntry={!showPassword}
                    style={styles.inputField}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.textLight}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Text style={styles.showIcon}>{showPassword ? '👁️' : '🚫'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.mdp && <Text style={styles.errorText}>{errors.mdp}</Text>}
              </View>

              {/* Bouton connexion */}
              <Btn
                title={loading ? '⏳ Connexion...' : 'Se connecter'}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.submitBtn}
              />
            </View>

            {/* Footer */}
            <Text style={styles.footer}>© 2026 StockApp • Gestion intelligente</Text>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#E9EFF8',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: height,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 18,
  },
  logo: {
    fontSize: 84,
    textAlign: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 56,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#102A43',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 30,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    maxWidth: 520,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 28,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    shadowColor: '#b91c1c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  errorBoxText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    height: 56,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
    color: colors.textLight,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  eyeButton: {
    padding: 8,
  },
  showIcon: {
    fontSize: 18,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
    marginLeft: 4,
  },
  submitBtn: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  footer: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 32,
    fontSize: 13,
    fontWeight: '500',
  },
});
