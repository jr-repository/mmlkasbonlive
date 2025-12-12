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
    'Kasbon & Biaya': 'kasbon',
    'Sales Invoice': 'invoice',
    'Penerimaan Lain': 'penerimaan',
    'Transfer Bank': 'transfer',
    'Laporan': 'laporan',
    'Rekonsiliasi Bank': 'rekon',
    'Manajemen User': 'users',
    'Konfigurasi Sistem': 'settings'
};

// Filter Menu Logic
const filteredMenu = computed(() => {
    // Jika Admin, tampilkan semua
    if (authStore.isAdmin) return sidebarMenu.value;

    const userPerms = authStore.userData?.permissions || [];
    
    return sidebarMenu.value.map(group => {
        // Clone group
        const newGroup = { ...group };
        
        // Filter children jika ada (item menu asli ada di children karena struktur NavGroup)
        if (newGroup.children) {
            // Kita anggap item level 1 yang punya 'to' adalah menu
            // Struktur sidebarItem.ts saat ini: { header: 'Main' }, { title: 'Dashboard', to: '/' } ...
            // Tapi sidebarItem.ts yang Anda upload adalah FLAT ARRAY yang dicampur header dan item
            // Logic Vuetify sidebar loop-nya: v-for item in sidebarMenu
            
            // KARENA STRUKTUR `sidebarItem.ts` adalah Array Campuran (Header & Item), kita filter Array utamanya.
            return null; // Dummy return, logic sesungguhnya di bawah (karena sidebarMenu adalah array flat)
        }
        return newGroup;
    });
});

// Logic Filter Flat Array Sidebar
const displayedItems = computed(() => {
    if (authStore.isAdmin) return sidebarMenu.value;
    
    const userPerms = authStore.userData?.permissions || [];

    return sidebarMenu.value.filter(item => {
        // Selalu tampilkan Header
        if (item.header) return true;

        // Cek Title
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