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
        {
            name: 'Pelunasan',
            path: '/pelunasan',
            component: () => import('@/views/akuntansi/PelunasanPage.vue')
        },
        {
            name: 'Laporan',
            path: '/laporan',
            component: () => import('@/views/akuntansi/LaporanPage.vue')
        },
        // --- MODUL BARU: USER ACTIVITY REPORT ---
        {
            name: 'UserActivityReport',
            path: '/report/user-activity',
            component: () => import('@/views/laporan/UserActivityPage.vue')
        },
        // ----------------------------------------
        {
            name: 'Users',
            path: '/users',
            component: () => import('@/views/akuntansi/UserSettingPage.vue')
        },
        {
            name: 'ApproverSettings',
            path: '/approver-settings',
            component: () => import('@/views/akuntansi/ApproverSettingPage.vue')
        },
        {
            name: 'AccurateSettings',
            path: '/settings',
            component: () => import('@/views/akuntansi/AccurateSettingsPage.vue')
        },
        {
            name: 'RekonMandiri',
            path: '/rekon',
            component: () => import('@/views/rekon/RekonPage.vue')
        },
        {
            name: 'RekonCimb',
            path: '/rekon/cimb',
            component: () => import('@/views/rekon/RekonCimbPage.vue')
        },
        {
            name: 'RekonSettings',
            path: '/rekon/settings',
            component: () => import('@/views/rekon/RekonSettingsPage.vue')
        },
        {
            name: 'MasterTax',
            path: '/master/tax',
            component: () => import('@/views/akuntansi/MasterTaxPage.vue')
        },
        {
            name: 'Bill',
            path: '/bill',
            component: () => import('@/views/akuntansi/BillPage.vue')
        },
        // --- PENAMBAHAN MODUL BARU: PROFILE SETTING ---
        {
            name: 'ProfileSettings',
            path: '/profile-settings',
            component: () => import('@/views/akuntansi/ProfileSettingPage.vue')
        },
        // ------------------------------------------------
    ]
};

export default MainRoutes;