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
// Pastikan 'title' atau properti lain di sidebarItem.ts cocok dengan key ini
const menuKeyMap: Record<string, string> = {
    'Dashboard': 'dashboard',
    'Job Order': 'job_order',
    'Sales Invoice (AR)': 'invoice', 
    'Tagihan Vendor (AP)': 'bill',   
    'Kasbon & Biaya': 'kasbon',
    'Penerimaan Lain': 'penerimaan',
    'Transfer Bank': 'transfer',
    'Laporan': 'laporan',
    'Aktivitas User': 'laporan', // Mapping menu baru ke permission 'laporan'
    'Rekonsiliasi Bank': 'rekon',   
    'Setting Pajak': 'master_tax',   
    'Manajemen User': 'users',
    'Setting Approver': 'approver_settings', 
    'Konfigurasi Sistem': 'settings'
};

// Logic Filter Flat Array Sidebar
const displayedItems = computed(() => {
    if (authStore.isAdmin) return sidebarMenu.value;
    
    const userPerms = authStore.userData?.permissions || [];

    return sidebarMenu.value.filter(item => {
        // Selalu tampilkan Header
        if (item.header) return true;

        // Jika item punya children (seperti Rekonsiliasi Bank)
        if (item.children) {
            const parentKey = menuKeyMap[item.title || ''];
            // Tampilkan parent jika user punya hak akses ke parentKey ('rekon')
            if (parentKey && userPerms.includes(parentKey)) {
                return true;
            }
            // Jika tidak ada permission untuk parent, jangan tampilkan
            return false;
        }

        // Cek item level 1 yang biasa (tanpa children)
        const key = menuKeyMap[item.title || ''];
        if (!key) return true; // Jika tidak ada di map, anggap public (atau hide jika strict)
        
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