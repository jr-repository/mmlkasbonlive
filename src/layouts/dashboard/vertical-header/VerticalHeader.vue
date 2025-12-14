<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCustomizerStore } from '@/stores/customizer';
import { useAuthStore } from '@/stores/auth';
import { Menu2Icon } from 'vue-tabler-icons';
import ProfileDD from './ProfileDD.vue';
import NotificationDD from './NotificationDD.vue';

// --- CONFIG ---
const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

const customizer = useCustomizerStore();
const authStore = useAuthStore();
const route = useRoute();

// State untuk menyimpan URL foto profil dan nama display
const profileInfo = ref({ 
    name: authStore.userData?.name || 'User',
    profile_picture_url: null as string | null
});

// Minimal Fetch untuk mendapatkan URL Foto Profil
const fetchProfileMinimal = async () => {
    const userId = authStore.userData?.id;
    if (!userId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/Profile/Get.php?user_id=${userId}`);
        const json = await res.json();

        if (json.s && json.d) {
            profileInfo.value.profile_picture_url = json.d.profile.profile_picture_url; 
            profileInfo.value.name = json.d.profile.name;
        }
    } catch (e) {
        // console.error("Gagal mengambil profil minimal:", e);
    }
}

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
    'AccurateSettings': 'Konfigurasi Sistem',
    'ProfileSettings': 'Profile Setting', // Tambahkan nama route baru
};
const pageTitle = computed(() => routeNames[route.name as string] || 'Halaman');

const currentTime = ref(new Date());
let timer: any;
onMounted(() => { 
    timer = setInterval(() => currentTime.value = new Date(), 1000); 
    fetchProfileMinimal(); // Panggil fetch profile saat komponen dimuat
});
onUnmounted(() => { if (timer) clearInterval(timer); });

const formattedDate = computed(() => currentTime.value.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
const formattedTime = computed(() => currentTime.value.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\./g, ':'));

const user = computed(() => authStore.userData || { name: 'User', role: 'Guest' });
</script>

<template>
 <v-app-bar elevation="0" height="70" class="main-head">
  <v-btn
   class="hidden-lg-and-up text-secondary ms-md-3 ms-sm-5 ms-3"
   size="small"
   icon
   @click="customizer.SET_SIDEBAR_DRAWER"
   variant="text"
  >
   <Menu2Icon size="20" stroke-width="1.5" />
  </v-btn>

  <div class="ml-4 d-none d-sm-block">
    <h3 class="text-h6 font-weight-bold text-primary mb-0">{{ pageTitle }}</h3>
    <div class="text-caption text-medium-emphasis">Sistem Manajemen Keuangan</div>
  </div>

  <v-spacer />

  <div class="mr-3">
    <NotificationDD />
  </div>

  <div class="d-none d-sm-flex align-center mr-4">
    <div class="bg-green-lighten-5 px-3 py-1 rounded-pill d-flex align-center gap-2 border border-success">
      <span class="relative flex h-2 w-2">
       <span class="animate-ping absolute inline-flex h-full w-full rounded-circle bg-success opacity-75"></span>
       <span class="relative d-inline-flex rounded-circle h-2 w-2 bg-success"></span>
      </span>
      <span class="text-[10px] font-weight-bold text-success">Online</span>
     </div>
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
       <v-img v-if="profileInfo.profile_picture_url" :src="profileInfo.profile_picture_url" alt="Profile" cover></v-img>
       <span v-else class="text-white font-weight-bold text-caption">
         {{ profileInfo.name ? profileInfo.name.charAt(0).toUpperCase() : 'U' }}
       </span>
      </v-avatar>
      <h6 class="text-subtitle-2 mb-0 d-sm-block d-none font-weight-medium">{{ profileInfo.name }}</h6>
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
.main-head {
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background-color: white;
}
.profileBtn {
  height: auto !important;
  padding: 4px 8px;
}
.text-\[10px\] { font-size: 10px; }
.relative { position: relative; }
.absolute { position: absolute; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.h-full { height: 100%; }
.w-full { width: 100%; }
.h-2 { height: 0.5rem; }
.w-2 { width: 0.5rem; }
.rounded-circle { border-radius: 50%; }
.opacity-75 { opacity: 0.75; }

@keyframes ping {
 75%, 100% {
  transform: scale(2);
  opacity: 0;
 }
}
.animate-ping {
 animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>