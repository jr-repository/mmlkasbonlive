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
  
  // Cek validitas sesi 1 Hari
  let isSessionValid = false;
  if (authStore.user) {
      isSessionValid = authStore.checkSession();
  }

  // Cek apakah halaman yang dituju membutuhkan autentikasi
  const authRequired = !publicPages.includes(to.path) && to.matched.some((record) => record.meta.requiresAuth);

  // Skenario 1: Butuh Login tapi User belum ada ATAU sesi 1 harinya sudah expired
  if (authRequired && (!authStore.user || !isSessionValid)) {
    authStore.returnUrl = to.fullPath;
    return next('/auth/login');
  }

  // Skenario 2: Sudah Login, Sesi Valid, tapi mencoba akses halaman Login
  if (authStore.user && isSessionValid && to.path === '/auth/login') {
    return next('/'); // Redirect ke Dashboard
  }

  // Skenario 3: Lanjut normal
  next();
});