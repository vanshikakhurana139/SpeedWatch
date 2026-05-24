import apiClient from './client'

export const reportsApi = {
    getDailyReport: async (date) => {
        const response = await apiClient.get('/reports/daily', { params: { date } })
        return response.data
    },

    downloadDailyPdf: async (date) => {
        const response = await apiClient.post(
            '/reports/daily/pdf',
            { date },
            { responseType: 'blob' }  // Important: tells axios this is a file download
        )
        return response.data
    },
}