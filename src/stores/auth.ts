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
    // (Hanya bagian actions yang perlu diubah sedikit)
    actions: {
        async login(email: string, password: string) {
            const res = await authService.login(email, password);
            
            if (res.success) {
                this.user = res.user;
                // Simpan REAL token hasil generate dari backend
                this.token = res.token; 

                localStorage.setItem('acc_user', JSON.stringify(this.user));
                // acc_token sekarang isinya misal: "a1b2c3d4e5f6..."
                localStorage.setItem('acc_token', this.token as string);

                router.push(this.returnUrl || '/');
                return { success: true };
            } else {
                return Promise.reject(res.message);
            }
        },
// ... (fungsi logout dan checkSession sisanya tetap sama persis seperti sebelumnya)

        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('acc_user');
            localStorage.removeItem('acc_token');
            router.push('/auth/login');
        },

        checkSession() {
            // Jika user ada datanya dan mempunya data expired_at
            if (this.user && this.user.expired_at) {
                const now = Math.floor(Date.now() / 1000); // waktu lokal (detik)
                
                // Jika waktu sekarang melebihi waktu expired_at
                if (now > this.user.expired_at) {
                    this.logout(); // paksa logout
                    return false;
                }
                return true;
            }
            return false;
        }
    }
});