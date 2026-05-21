import apiClient from './client';
import { API_CONFIG } from '../config/api';

export const geofencesApi = {
    // Get all active geofence zones
    getGeofences: async () => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.GEOFENCES);
        return response.data;
    },
};