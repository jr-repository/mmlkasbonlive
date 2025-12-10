// Lokasi: src/router/MainRoutes.ts

const MainRoutes = {
    path: '/main',
    meta: {
        requiresAuth: true
    },
    redirect: '/main',
    component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
    children: [
        {
            name: 'Dashboard',
            path: '/',
            component: () => import('@/views/akuntansi/DashboardPage.vue')
        },
        {
            name: 'JobOrder',
            path: '/job-order',
            component: () => import('@/views/akuntansi/JobOrderPage.vue')
        },
        {
            name: 'Kasbon',
            path: '/kasbon',
            component: () => import('@/views/akuntansi/KasbonPage.vue')
        },
        {
            name: 'Invoice',
            path: '/invoice',
            component: () => import('@/views/akuntansi/InvoicePage.vue')
        },
        {
            name: 'Penerimaan',
            path: '/penerimaan',
            component: () => import('@/views/akuntansi/PenerimaanPage.vue')
        },
        {
            name: 'Transfer',
            path: '/transfer',
            component: () => import('@/views/akuntansi/TransferPage.vue')
        },
        // UPDATE FINAL BATCH 4
        {
            name: 'Pelunasan',
            path: '/pelunasan', // Perlu menambahkan ini ke Sidebar jika belum ada
            component: () => import('@/views/akuntansi/PelunasanPage.vue')
        },
        {
            name: 'Laporan',
            path: '/laporan',
            component: () => import('@/views/akuntansi/LaporanPage.vue')
        },
        {
            name: 'Users',
            path: '/users',
            component: () => import('@/views/akuntansi/UserSettingPage.vue')
        },
        {
            name: 'AccurateSettings',
            path: '/settings',
            component: () => import('@/views/akuntansi/AccurateSettingsPage.vue')
        },
        {
            name: 'Rekon',
            path: '/rekon',
            component: () => import('@/views/rekon/RekonPage.vue')
        },
        {
            name: 'RekonSettings',
            path: '/rekon/settings',
            component: () => import('@/views/rekon/RekonSettingsPage.vue')
        }
    ]
};

export default MainRoutes;