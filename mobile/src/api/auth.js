import apiClient from './client';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authApi = {
    login: async (phone, password) => {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, { phone, password });
        if (response.data.access_token) {
            await AsyncStorage.setItem('auth_token', response.data.access_token);
        }
        return response.data;
    },
    getProfile: async () => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ME);
        return response.data;
    },
    logout: async () => {
        await AsyncStorage.removeItem('auth_token');
    },
    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('auth_token');
        return !!token;
    },
};