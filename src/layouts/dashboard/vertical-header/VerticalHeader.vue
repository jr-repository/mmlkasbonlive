<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCustomizerStore } from '@/stores/customizer';
import { useAuthStore } from '@/stores/auth';
import { Menu2Icon } from 'vue-tabler-icons'; // Pengganti MenuFoldOutlined
import ProfileDD from './ProfileDD.vue';

const customizer = useCustomizerStore();
const authStore = useAuthStore();
const route = useRoute();

// --- LOGIKA DATA SAYA (Breadcrumb) ---
const routeNames: Record<string, string> = {
    'Dashboard': 'Dashboard',
    'JobOrder': 'Job Order',
    'Kasbon': 'Kasbon & Biaya',
    'Invoice': 'Sales Invoice',
    'Penerimaan': 'Penerimaan Lain',
    'Transfer': 'Transfer Bank',
    'Pelunasan': 'Pelunasan Piutang',
    'Laporan': 'Laporan Keuangan',
    'Users': 'Manajemen User',
    'AccurateSettings': 'Konfigurasi Sistem'
};
const pageTitle = computed(() => routeNames[route.name as string] || 'Halaman');

// --- LOGIKA DATA SAYA (Waktu Real-time) ---
const currentTime = ref(new Date());
let timer: any;
onMounted(() => { timer = setInterval(() => currentTime.value = new Date(), 1000); });
onUnmounted(() => { if (timer) clearInterval(timer); });

const formattedDate = computed(() => currentTime.value.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }));
const formattedTime = computed(() => currentTime.value.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));

// --- LOGIKA DATA SAYA (User) ---
const user = computed(() => authStore.userData || { name: 'User', role: 'Staff' });
</script>

<template>
  <v-app-bar elevation="0" height="60" class="bg-surface border-b">
    <v-btn
      class="text-secondary mr-3 ml-2"
      color="darkText"
      icon
      rounded="sm"
      variant="text"
      @click.stop="customizer.SET_SIDEBAR_DRAWER"
      size="small"
    >
      <Menu2Icon size="20" />
    </v-btn>

    <div class="d-none d-lg-block ml-2">
        <span class="text-caption text-grey-darken-1">App / </span>
        <span class="text-subtitle-2 font-weight-bold text-grey-darken-2">{{ pageTitle }}</span>
    </div>

    <v-spacer />

           <div class="d-flex align-center bg-green-lighten-5 px-2 py-0 rounded-pill border">
            <span class="position-relative d-flex h-2 w-2 mr-1">
              <span class="position-absolute d-inline-flex h-100 w-100 rounded-circle bg-success opacity-75 animate-ping"></span>
              <span class="position-relative d-inline-flex rounded-circle h-2 w-2 bg-success"></span>
            </span>
            <span class="text-[10px] font-weight-bold text-success">Online</span>
          </div>

    <div class="d-none d-sm-flex flex-column align-end mr-4 text-right">
        <div class="text-caption font-weight-bold">{{ formattedDate }}</div>
        <div class="text-caption text-grey" style="font-size: 10px;">{{ formattedTime }}</div>
    </div>

    <v-menu :close-on-content-click="false" offset="8, 0" location="bottom end">
      <template v-slot:activator="{ props }">
        <v-btn class="profileBtn" variant="text" rounded="sm" v-bind="props">
          <div class="d-flex align-center">
            <v-avatar class="mr-sm-2 mr-0" size="32" color="primary">
               <span class="text-white font-weight-bold text-caption">
                   {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
               </span>
            </v-avatar>
            <h6 class="text-subtitle-2 mb-0 d-sm-block d-none font-weight-medium">{{ user.name }}</h6>
          </div>
        </v-btn>
      </template>
      
      <v-sheet rounded="md" width="290" elevation="10">
        <ProfileDD />
      </v-sheet>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
/* Animasi Ping untuk Status Online */
@keyframes ping {
    75%, 100% { transform: scale(2); opacity: 0; }
}
.animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
.h-2 { height: 8px; }
.w-2 { width: 8px; }
</style>