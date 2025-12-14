<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { LogoutIcon, UserCircleIcon, BriefcaseIcon } from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";
const authStore = useAuthStore();
const router = useRouter();

// Minimal Profile State
const profileData = ref<{ 
    profile_picture_url: string | null, 
    designation: string | null 
}>({
    profile_picture_url: null,
    designation: null,
});

const user = computed(() => authStore.userData || { name: 'User', role: 'Staff' });

// Mengambil URL Foto dan Jabatan dari API Profile
const fetchProfileMinimal = async () => {
    const userId = user.value.id;
    if (!userId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/Profile/Get.php?user_id=${userId}`);
        const json = await res.json();

        if (json.s && json.d) {
            profileData.value.profile_picture_url = json.d.profile.profile_picture_url;
            profileData.value.designation = json.d.profile.designation;
        }
    } catch (e) {
        console.error("Gagal mengambil profil minimal:", e);
    }
}

// Menentukan sumber gambar
const displayImage = computed(() => {
    if (
        profileData.value?.profile_picture_url &&
        profileData.value.profile_picture_url !== '0'
    ) {
        return profileData.value.profile_picture_url;
    }

    return 'https://multimitralogistik.id/Backend/uploads/profile/default.png';
});


const navigateToProfile = () => {
    router.push('/profile-settings');
}

const logout = () => {
    authStore.logout();
    router.push('/auth/login');
};

onMounted(fetchProfileMinimal);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center">
      <v-avatar size="48" class="mr-3 bg-primary text-white font-weight-bold">
        <v-img v-if="displayImage" :src="displayImage" alt="Profile" cover></v-img>
        <span v-else class="text-white font-weight-bold text-h6">
            {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
        </span>
      </v-avatar>
      <div>
        <h6 class="text-subtitle-1 font-weight-bold mb-0">{{ user.name }}</h6>
        <div class="d-flex align-center mt-1">
          <BriefcaseIcon size="16" class="text-grey mr-1"/>
          <span class="text-caption text-grey">{{ profileData.designation || user.role }}</span>
        </div>
      </div>
    </div>

    <v-divider class="my-4"></v-divider>
    
    <v-list density="compact" class="pa-0">
        <v-list-item @click="navigateToProfile" class="rounded-md">
            <template v-slot:prepend><UserCircleIcon size="20" class="mr-2 text-primary"/></template>
            <v-list-item-title class="text-caption font-weight-medium">Profile Setting</v-list-item-title>
        </v-list-item>
    </v-list>

    <v-divider class="my-4"></v-divider>

    <v-btn 
      color="error" 
      variant="outlined" 
      block 
      rounded="md"
      @click="logout()" 
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
.text-\[10px\] { font-size: 10px; }
</style>