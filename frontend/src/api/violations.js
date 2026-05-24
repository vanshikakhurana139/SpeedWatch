import apiClient from './client'

export const violationsApi = {
    getViolations: async ({ limit = 50, driverId = null } = {}) => {
        const params = { limit }
        if (driverId) params.driver_id = driverId
        const response = await apiClient.get('/violations/', { params })
        return response.data
    },
}