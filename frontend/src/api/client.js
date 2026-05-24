// This is the Axios HTTP client for the dashboard
// It automatically adds the JWT token to every request
// and handles 401 errors by redirecting to login

import axios from 'axios'

const apiClient = axios.create({
    baseURL: '/api',  // Vite proxy forwards this to FastAPI on port 8000
    timeout: 15000,   // 15 second timeout
    headers: { 'Content-Type': 'application/json' },
})

// Before every request: attach the JWT token from localStorage
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('supervisor_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// After every response: if 401 (token expired), clear storage and reload
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('supervisor_token')
            localStorage.removeItem('supervisor_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default apiClient