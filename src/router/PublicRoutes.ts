// Lokasi: src/router/PublicRoutes.ts
const PublicRoutes = {
  path: '/auth',
  component: () => import('@/layouts/blank/BlankLayout.vue'),
  meta: {
    requiresAuth: false
  },
  children: [
    {
      name: 'Authentication',
      path: 'login', // UBAH DARI '/login' MENJADI 'login'
      component: () => import('@/views/authentication/auth/LoginPage.vue') // Pastikan path komponen ini benar
    },
    {
      name: 'Register',
      path: 'register', // UBAH DARI '/register' MENJADI 'register'
      component: () => import('@/views/authentication/auth/RegisterPage.vue')
    },
    {
      name: 'Error 404',
      path: 'error', // UBAH DARI '/error' MENJADI 'error'
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    }
  ]
};

export default PublicRoutes;