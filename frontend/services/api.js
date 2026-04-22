import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Remplacez par votre IP locale : ex http://192.168.1.10:5000/api
const BASE_URL = 'http://localhost:5000/api'; // localhost pour web

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
  console.log('API Request - Token:', token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('API Request - Headers Authorization:', config.headers.Authorization);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Erreur réseau';
    return Promise.reject(new Error(msg));
  }
);

export default api;
