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
    backgroundColor: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    marginBottom: 48,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logo: {
    fontSize: 80,
    textAlign: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 28,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorBoxText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
    backgroundColor: '#fff',
    height: 56,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
    shadowColor: colors.danger,
    shadowOpacity: 0.1,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  eyeButton: {
    padding: 4,
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
    marginTop: 32,
    height: 56,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 32,
    fontSize: 13,
    fontWeight: '500',
  },
});
