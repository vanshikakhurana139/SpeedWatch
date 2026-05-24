import apiClient from './client'

export const tripsApi = {
    getTripPath: async (tripId) => {
        const response = await apiClient.get(`/trips/${tripId}/path`)
        return response.data
    },
}