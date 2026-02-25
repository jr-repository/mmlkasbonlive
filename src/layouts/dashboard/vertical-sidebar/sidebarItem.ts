import {
    LayoutDashboardIcon,
    ClipboardListIcon,
    WalletIcon,
    FileInvoiceIcon,
    ArrowDownCircleIcon,
    ArrowsLeftRightIcon,
    ChartBarIcon,
    UsersIcon,
    SettingsIcon,
    ShieldCheckIcon,
    ActivityIcon,
    UserCircleIcon,
    CashIcon,   // Icon untuk Modul Payroll
    CircleIcon  // Icon untuk Submenu
} from 'vue-tabler-icons';

export interface menu {
    header?: string;
    title?: string;
    icon?: any;
    to?: string;
    chip?: string;
    chipColor?: string;
    chipVariant?: string;
    chipIcon?: string;
    children?: menu[];
    disabled?: boolean;
    type?: string;
    subCaption?: string;
    divider?: boolean;
}

const sidebarItem: menu[] = [
    // --- Kategori: Menu Utama ---
    { header: 'Menu Utama' },
    {
        title: 'Dashboard',
        icon: LayoutDashboardIcon,
        to: '/'
    },

    // --- Kategori: Transaksi Operasional & Keuangan ---
    { header: 'Transaksi' },
    {
        title: 'Job Order',
        icon: ClipboardListIcon,
        to: '/job-order'
    },
    {
        title: 'Sales Invoice (AR)', // Piutang Dagang
        icon: FileInvoiceIcon,
        to: '/invoice'
    },
    {
        title: 'Tagihan Vendor (AP)', // Hutang Dagang
        icon: FileInvoiceIcon,
        to: '/bill'
    },
    {
        title: 'Kasbon & Biaya',
        icon: WalletIcon,
        to: '/kasbon'
    },
    {
        title: 'Penerimaan Lain',
        icon: ArrowDownCircleIcon,
        to: '/penerimaan'
    },
    {
        title: 'Transfer Bank',
        icon: ArrowsLeftRightIcon,
        to: '/transfer'
    },
    
    // --- Kategori: Laporan & Analisis ---
    { header: 'Laporan & Analisis' },
    {
        title: 'Laporan',
        icon: ChartBarIcon,
        to: '/laporan'
    },
    {
        title: 'Aktivitas User',
        icon: ActivityIcon,
        to: '/report/user-activity'
    },
    {
        title: 'Rekonsiliasi Bank',
        icon: ArrowsLeftRightIcon,
        children: [
            {
                title: 'Mandiri',
                to: '/rekon'
            },
            {
                title: 'CIMB Niaga',
                to: '/rekon/cimb'
            }
        ]
    },

    // --- Kategori: Master Data ---
    { header: 'Master Data' },
    {
        title: 'Setting Pajak',
        icon: SettingsIcon, 
        to: '/master/tax'
    },

    // --- Kategori: Administrasi & Konfigurasi Sistem ---
    { header: 'Administrasi & Pengaturan' },
    {
        title: 'Profile Setting',
        icon: UserCircleIcon,
        to: '/profile-settings'
    },
    {
        title: 'Manajemen User',
        icon: UsersIcon,
        to: '/users'
    },
    {
        title: 'Setting Approver',
        icon: ShieldCheckIcon,
        to: '/approver-settings'
    },
    {
        title: 'Konfigurasi Sistem',
        icon: SettingsIcon,
        to: '/settings'
    },

    // --- MODULE PAYROLL SYSTEM ---
    // Logika tampilan akan bergantung pada key 'payroll_system' di database
    {
        title: 'Payroll System',
        icon: CashIcon, 
        to: '/payroll', // Parent Path
        children: [
            {
                title: 'Master Data Karyawan',
                icon: CircleIcon,
                to: '/payroll/master-karyawan'
            },
            {
                title: 'Komponen Gaji',
                icon: CircleIcon,
                to: '/payroll/komponen-gaji'
            },
            {
                title: 'Absensi Fingerprint',
                icon: CircleIcon,
                to: '/payroll/absensi'
            },
            {
                title: 'Setting & Proses Payroll',
                icon: CircleIcon,
                to: '/payroll/proses'
            },
            {
                title: 'Laporan & Slip Gaji',
                icon: CircleIcon,
                to: '/payroll/laporan'
            }
        ]
    },
];

export default sidebarItem;