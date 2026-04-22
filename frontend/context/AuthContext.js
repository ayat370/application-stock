import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

// Helper pour gérer AsyncStorage et localStorage
const StorageHelper = {
  async getItem(key) {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.log('Erreur storage getItem:', e);
      return null;
    }
  },
  async setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.log('Erreur storage setItem:', e);
    }
  },
  async removeItem(key) {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.log('Erreur storage removeItem:', e);
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const storedToken = await StorageHelper.getItem('token');
      const storedUser = await StorageHelper.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Erreur chargement user:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginId, mdp) => {
    try {
      console.log('Tentative de connexion:', loginId);
      const res = await api.post('/auth/login', { login: loginId, mdp });
      const { token, user } = res.data;
      console.log('Connexion réussie, token:', token);
      console.log('Utilisateur:', user);
      await StorageHelper.setItem('token', token);
      await StorageHelper.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      return user;
    } catch (err) {
      console.error('Erreur login:', err);
      throw err;
    }
  };

  const logout = async () => {
    console.log('AuthContext logout start');
    await StorageHelper.removeItem('token');
    await StorageHelper.removeItem('user');
    setToken(null);
    setUser(null);
    console.log('AuthContext logout complete');
  };

  const updateProfil = async (data) => {
    const res = await api.put('/auth/profil', data);
    const updatedUser = { ...user, ...res.data };
    await StorageHelper.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const isAdmin = user?.role === 'admin';
  const isGestionnaire = user?.role === 'gestionnaire' || isAdmin;
  const canWrite = isGestionnaire;
  const canDelete = isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfil, isAdmin, isGestionnaire, canWrite, canDelete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
