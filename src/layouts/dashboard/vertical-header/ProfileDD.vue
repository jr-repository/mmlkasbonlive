<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { LogoutIcon } from 'vue-tabler-icons';

const authStore = useAuthStore();
// Ambil data user dari store (fallback ke default jika kosong)
const user = computed(() => authStore.userData || { name: 'User', role: 'Staff' });
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center">
      <v-avatar size="48" class="mr-3 bg-primary text-white font-weight-bold">
        {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
      </v-avatar>
      <div>
        <h6 class="text-subtitle-1 font-weight-bold mb-0">{{ user.name }}</h6>
        <div class="d-flex align-center mt-1">
          <span class="text-caption text-grey mr-2">{{ user.role }}</span>
          

        </div>
      </div>
    </div>

    <v-divider class="my-4"></v-divider>

    <v-btn 
      color="error" 
      variant="outlined" 
      block 
      rounded="md"
      @click="authStore.logout()" 
      class="text-capitalize"
    >
      <LogoutIcon size="18" class="mr-2" />
      Logout
    </v-btn>
  </div>
</template>

<style scoped>
/* Animasi Ping untuk Status Online */
@keyframes ping {
    75%, 100% {
        transform: scale(2);
        opacity: 0;
    }
}
.animate-ping {
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.h-2 { height: 8px; }
.w-2 { width: 8px; }
.text-[10px] { font-size: 10px; }
</style>