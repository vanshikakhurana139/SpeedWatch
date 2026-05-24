import apiClient from './client'

export const geofencesApi = {
    getGeofences: async () => {
        const response = await apiClient.get('/geofences/')
        return response.data
    },

    createGeofence: async (data) => {
        const response = await apiClient.post('/geofences/', data)
        return response.data
    },

    updateGeofence: async (id, data) => {
        const response = await apiClient.put(`/geofences/${id}`, data)
        return response.data
    },

    deleteGeofence: async (id) => {
        const response = await apiClient.delete(`/geofences/${id}`)
        return response.data
    },
}