// Geofencing 
import apiClient from './client';
import { API_CONFIG } from '../config/api';

export const geofencesApi = {
    // Get all active geofence zones
    getGeofences: async () => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.GEOFENCES);
        return response.data;
    },
    // Create a new geofence zone
    createGeofence: async (zoneData) => {
        // Expected zoneData includes name, zone_type, speed_limit, coordinates
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.GEOFENCES, zoneData);
        return response.data;
    },
    // Delete an existing geofence zone by ID
    deleteGeofence: async (zoneId) => {
        const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.GEOFENCES}/${zoneId}`);
        return response.data;
    },
};