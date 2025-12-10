import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import PublicRoutes from './PublicRoutes';
import { useAuthStore } from '@/stores/auth';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    MainRoutes,
    PublicRoutes
  ]
});

router.beforeEach(async (to, from, next) => {
  // Daftar halaman yang bisa diakses tanpa login
  const publicPages = ['/auth/login', '/auth/register', '/auth/error'];
  
  // Menggunakan store tanpa anotasi tipe manual yang kaku
  const authStore = useAuthStore();

  // Cek apakah halaman yang dituju membutuhkan autentikasi
  const authRequired = !publicPages.includes(to.path) && to.matched.some((record) => record.meta.requiresAuth);

  // Skenario 1: Butuh Login tapi User belum ada
  if (authRequired && !authStore.user) {
    authStore.returnUrl = to.fullPath;
    return next('/auth/login');
  }

  // Skenario 2: Sudah Login tapi mencoba akses halaman Login
  if (authStore.user && to.path === '/auth/login') {
    return next('/'); // Redirect ke Dashboard
  }

  // Skenario 3: Lanjut normal
  next();
});