import apiClient from './client'

export const vehiclesApi = {
    getVehicles: async () => {
        const response = await apiClient.get('/vehicles/')
        return response.data
    },
}
