import apiClient from './client';
import { API_CONFIG } from '../config/api';

export const tripsApi = {
    // Start a new trip
    startTrip: async (vehicleId, loadType = 'empty') => {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.START_TRIP, {
            vehicle_id: vehicleId,
            load_type: loadType,
        });
        return response.data;
    },

    // End current trip
    endTrip: async (tripId) => {
        const response = await apiClient.post(
            API_CONFIG.ENDPOINTS.END_TRIP(tripId)
        );
        return response.data;
    },

    // Update GPS position
    updatePosition: async (tripId, position) => {
        const response = await apiClient.post(
            API_CONFIG.ENDPOINTS.UPDATE_POSITION(tripId),
            position
        );
        return response.data;
    },
};