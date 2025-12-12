import { defineStore } from 'pinia';
import { router } from '@/router';
import { authService } from '@/services/auth.service';

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        user: JSON.parse(localStorage.getItem('acc_user') || 'null'),
        token: localStorage.getItem('acc_token') || null,
        returnUrl: null as string | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        userData: (state) => state.user,
        isAdmin: (state) => state.user?.role === 'admin',
        // Helper untuk cek permission di komponen
        hasAccess: (state) => (menuKey: string) => {
            if (state.user?.role === 'admin') return true; // Admin akses semua
            return state.user?.permissions?.includes(menuKey);
        }
    },
    actions: {
        async login(username: string, password: string) {
            const res = await authService.login(username, password);
            
            if (res.success) {
                this.user = res.user;
                this.token = "logged_in"; 

                localStorage.setItem('acc_user', JSON.stringify(this.user));
                localStorage.setItem('acc_token', this.token);

                router.push(this.returnUrl || '/');
                return { success: true };
            } else {
                return { success: false, message: res.message };
            }
        },

        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('acc_user');
            localStorage.removeItem('acc_token');
            router.push('/auth/login');
        }
    }
});