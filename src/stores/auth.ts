// Lokasi: src/stores/auth.ts
import { defineStore } from 'pinia';
import { router } from '@/router';
import { authService } from '@/services/auth.service';

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        // Ambil data dari localStorage jika ada (mirip logika React lama)
        user: JSON.parse(localStorage.getItem('acc_user') || 'null'),
        token: localStorage.getItem('acc_token') || null,
        returnUrl: null as string | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        userData: (state) => state.user,
        isAdmin: (state) => state.user?.role === 'admin'
    },
    actions: {
        async login(username: string, password: string) {
            const res = await authService.login(username, password);
            
            if (res.success) {
                this.user = res.user;
                this.token = "logged_in"; // Simple flag sesuai sistem lama

                // Simpan ke LocalStorage
                localStorage.setItem('acc_user', JSON.stringify(this.user));
                localStorage.setItem('acc_token', this.token);

                // Redirect ke halaman dashboard atau halaman sebelumnya
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