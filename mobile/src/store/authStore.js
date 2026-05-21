import { create } from 'zustand';
import { authApi } from '../api/auth';

export const useAuthStore = create((set, get) => ({
    // State
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // Actions
    login: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
            const data = await authApi.login(phone, password);
            set({
                user: {
                    id: data.user_id,
                    name: data.name,
                    role: data.role,
                },
                isAuthenticated: true,
                isLoading: false,
            });
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.detail || 'Login failed',
                isLoading: false,
            });
            return false;
        }
    },

    logout: async () => {
        await authApi.logout();
        set({
            user: null,
            isAuthenticated: false,
            error: null,
        });
    },

    checkAuth: async () => {
        try {
            const isAuth = await authApi.isAuthenticated();
            if (isAuth) {
                const profile = await authApi.getProfile();
                set({
                    user: profile,
                    isAuthenticated: true,
                });
            }
        } catch (error) {
            set({ isAuthenticated: false });
        }
    },

    clearError: () => set({ error: null }),
}));