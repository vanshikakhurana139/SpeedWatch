import apiClient from './client'

export const authApi = {
    login: async (phone, password) => {
        const response = await apiClient.post('/auth/login', { phone, password })
        if (response.data.access_token) {
            // Store token in localStorage so it persists across page refreshes
            localStorage.setItem('supervisor_token', response.data.access_token)
            localStorage.setItem('supervisor_user', JSON.stringify({
                id: response.data.user_id,
                name: response.data.name,
                role: response.data.role,
            }))
        }
        return response.data
    },

    logout: () => {
        localStorage.removeItem('supervisor_token')
        localStorage.removeItem('supervisor_user')
    },

    getProfile: async () => {
        const response = await apiClient.get('/auth/me')
        return response.data
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('supervisor_token')
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('supervisor_user')
        return userStr ? JSON.parse(userStr) : null
    },
}