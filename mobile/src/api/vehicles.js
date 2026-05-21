import apiClient from './client';
import { API_CONFIG } from '../config/api';

export const vehiclesApi = {
    // Get list of vehicles assigned to driver
    getVehicles: async () => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.VEHICLES);
        return response.data;
    },
};