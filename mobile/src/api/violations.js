import apiClient from './client';
import { API_CONFIG } from '../config/api';

export const violationsApi = {
    // Log a speed violation
    logViolation: async (violationData) => {
        const response = await apiClient.post(
            API_CONFIG.ENDPOINTS.LOG_VIOLATION,
            violationData
        );
        return response.data;
    },

    // Get violations list
    getViolations: async (tripId) => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_VIOLATIONS, {
            params: { trip_id: tripId },
        });
        return response.data;
    },
};