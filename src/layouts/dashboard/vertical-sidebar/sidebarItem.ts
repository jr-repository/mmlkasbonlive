// Lokasi: src/layouts/dashboard/vertical-sidebar/sidebarItem.ts
import {
    LayoutDashboardIcon,
    ClipboardListIcon,
    WalletIcon,
    FileInvoiceIcon,
    ArrowDownCircleIcon,
    ArrowsLeftRightIcon,
    ChartBarIcon,
    UsersIcon,
    SettingsIcon
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
    { header: 'Main Menu' },
    {
        title: 'Dashboard',
        icon: LayoutDashboardIcon,
        to: '/'
    },
    {
        title: 'Job Order',
        icon: ClipboardListIcon,
        to: '/job-order'
    },
    {
        title: 'Kasbon & Biaya',
        icon: WalletIcon,
        to: '/kasbon'
    },
    {
        title: 'Sales Invoice',
        icon: FileInvoiceIcon,
        to: '/invoice'
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
    {
        title: 'Laporan',
        icon: ChartBarIcon,
        to: '/laporan'
    },    
    {
        title: 'Rekonsiliasi Bank',
        icon: ArrowsLeftRightIcon,
        to: '/rekon'
    },
    { header: 'Admin' },
    {
        title: 'Manajemen User',
        icon: UsersIcon,
        to: '/users'
    },
    {
        title: 'Konfigurasi Sistem',
        icon: SettingsIcon,
        to: '/settings'
    }
];

export default sidebarItem;