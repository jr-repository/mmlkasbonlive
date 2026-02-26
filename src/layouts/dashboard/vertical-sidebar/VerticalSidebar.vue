<script setup lang="ts">
import { shallowRef, computed } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import { useAuthStore } from '@/stores/auth';
import sidebarItems from './sidebarItem';

import NavGroup from './NavGroup/NavGroup.vue';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import Logo from '../logo/LogoDark.vue';

const customizer = useCustomizerStore();
const authStore = useAuthStore();
const sidebarMenu = shallowRef(sidebarItems);

// Mapping Key Menu sesuai database
// Key sebelah KIRI harus sama persis dengan 'title' di sidebarItem.ts
// Value sebelah KANAN harus sama persis dengan 'key' di UserSettingPage.vue
const menuKeyMap: Record<string, string> = {
    'Dashboard': 'dashboard',
    'Proyek': 'proyek',
    'Job Order': 'job_order',
    'Sales Invoice (AR)': 'invoice', 
    'Tagihan Vendor (AP)': 'bill',   
    'Kasbon & Biaya': 'kasbon',
    'Penerimaan Lain': 'penerimaan',
    'Transfer Bank': 'transfer',
    'Laporan': 'laporan',
    'Aktivitas User': 'laporan', 
    'Rekonsiliasi Bank': 'rekon',    
    'Setting Pajak': 'master_tax',   
    'Manajemen User': 'users',
    'Setting Approver': 'approver_settings', 
    'Konfigurasi Sistem': 'settings',
    'Profile Setting': 'profile_settings',
    
    // --- TAMBAHAN MAPPING PAYROLL ---
    'Payroll System': 'payroll_system' 
};

// Logic Filter Flat Array Sidebar
const displayedItems = computed(() => {
    // Admin selalu melihat semua menu
    if (authStore.isAdmin) return sidebarMenu.value;
    
    const userPerms = authStore.userData?.permissions || [];

    return sidebarMenu.value.filter(item => {
        // Selalu tampilkan Header
        if (item.header) return true;

        // Cek menu dengan submenu (Children) seperti Payroll System
        if (item.children) {
            const parentKey = menuKeyMap[item.title || ''];
            
            // Jika user punya permission 'payroll_system', tampilkan parent beserta anaknya
            if (parentKey && userPerms.includes(parentKey)) {
                return true;
            }
            // Jika tidak ada izin, sembunyikan seluruh grup
            return false;
        }

        // Cek item level 1 (Single Link)
        const key = menuKeyMap[item.title || ''];
        
        // Tampilkan Profile Setting, Dashboard default
        if (!key || key === 'dashboard' || key === 'profile_settings') return true; 
        
        return userPerms.includes(key);
    });
});

</script>

<template>
  <v-navigation-drawer
    left
    v-model="customizer.Sidebar_drawer"
    elevation="0"
    rail-width="60"
    mobile-breakpoint="lg"
    app
    class="leftSidebar"
    :rail="customizer.mini_sidebar"
    expand-on-hover
  >
    <div class="pa-5">
      <Logo />
    </div>
    
    <perfect-scrollbar class="scrollnavbar">
      <v-list aria-busy="true" aria-label="menu list">
        <template v-for="(item, i) in displayedItems" :key="i">
          <NavGroup :item="item" v-if="item.header" :key="item.title" />
          <v-divider class="my-3" v-else-if="item.divider" />
          <NavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <NavItem :item="item" v-else />
        </template>
      </v-list>
      <div class="pa-4">
      </div>
    </perfect-scrollbar>
  </v-navigation-drawer>
</template>