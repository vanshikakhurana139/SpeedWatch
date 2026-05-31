import apiClient from './client';
import { API_CONFIG } from '../config/api';

export const sosApi = {
    // Send emergency alert with current location
    sendSOS: async (sosData) => {
        const response = await apiClient.post(
            API_CONFIG.ENDPOINTS.SOS,
            sosData
        );
        return response.data;
    },
};
