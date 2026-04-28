import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_HOST = 'http://localhost:5000/api';
const BASE_URL = Platform.select({
  ios: DEFAULT_API_HOST,
  android: 'http://10.0.2.2:5000/api',
  web: DEFAULT_API_HOST,
  default: DEFAULT_API_HOST,
});

console.log('🌐 API Base URL:', BASE_URL);

const api = axios.create({ baseURL: BASE_URL });

// Helper pour gérer AsyncStorage et localStorage
const StorageHelper = {
  async getItem(key) {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        const value = localStorage.getItem(key);
        console.log('StorageHelper getItem (localStorage):', key, value);
        return value;
      }
      const value = await AsyncStorage.getItem(key);
      console.log('StorageHelper getItem (AsyncStorage):', key, value);
      return value;
    } catch (e) {
      console.log('Erreur storage getItem:', e);
      return null;
    }
  }
};

api.interceptors.request.use(async (config) => {
  const token = await StorageHelper.getItem('token');
  console.log('🔑 API Request - Token:', token ? '✅ Present' : '❌ Missing');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log('📥 API Response:', res.status, res.config.url);
    return res;
  },
  (err) => {
    const msg = err.response?.data?.message || 'Erreur réseau';
    console.error('❌ API Error:', err.response?.status, msg);
    return Promise.reject(new Error(msg));
  }
);

export default api;
