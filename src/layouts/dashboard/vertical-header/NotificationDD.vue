<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { BellRingingIcon } from 'vue-tabler-icons';
import { useAuthStore } from '@/stores/auth';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";
const authStore = useAuthStore();

const notifications = ref<any[]>([]);
const totalCount = ref(0);
let intervalId: any = null;

const fetchNotifications = async () => {
    if (!authStore.userData?.id) return;

    try {
        const res = await fetch(`${API_BASE_URL}/Notification/GetPending.php?user_id=${authStore.userData.id}`);
        const json = await res.json();
        if (json.s) {
            notifications.value = json.d.items;
            totalCount.value = json.d.total_count;
        }
    } catch (e) {
        console.error("Gagal mengambil notifikasi", e);
    }
};

onMounted(() => {
    fetchNotifications();
    // Auto refresh setiap 30 detik agar realtime
    intervalId = setInterval(fetchNotifications, 30000);
});

onBeforeUnmount(() => {
    if (intervalId) clearInterval(intervalId);
});
</script>

<template>
    <v-menu :close-on-content-click="false" location="bottom end" offset="10">
        <template v-slot:activator="{ props }">
            <v-btn icon class="text-secondary custom-hover-primary" variant="text" v-bind="props">
                <v-badge :content="totalCount" color="error" offset-x="-5" offset-y="-5" v-if="totalCount > 0">
                    <BellRingingIcon size="22" />
                </v-badge>
                <BellRingingIcon size="22" v-else />
            </v-btn>
        </template>
        <v-sheet rounded="md" width="360" elevation="10">
            <div class="px-4 py-3 d-flex align-center justify-space-between bg-primary rounded-t-md">
                <h6 class="text-subtitle-1 font-weight-bold text-white mb-0">Notifikasi Approval</h6>
                <v-chip color="white" variant="outlined" size="small" class="font-weight-bold text-white">
                    {{ totalCount }} Baru
                </v-chip>
            </div>
            
            <perfect-scrollbar style="max-height: 300px">
                <v-list class="py-0" lines="two" density="compact">
                    <div v-if="notifications.length === 0" class="text-center py-4">
                        <span class="text-caption text-grey">Tidak ada notifikasi baru</span>
                    </div>
                    
                    <template v-for="(item, i) in notifications" :key="i">
                        <v-list-item :to="item.link" active-color="primary" class="mb-1">
                            <template v-slot:prepend>
                                <v-avatar size="40" :color="item.color" variant="flat" class="mr-3">
                                    <span class="text-white font-weight-bold text-h6">{{ item.count }}</span>
                                </v-avatar>
                            </template>
                            <v-list-item-title class="text-subtitle-2 font-weight-bold mb-1">
                                {{ item.title }}
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-caption text-medium-emphasis">
                                {{ item.desc }}
                            </v-list-item-subtitle>
                        </v-list-item>
                        <v-divider v-if="i < notifications.length - 1"></v-divider>
                    </template>
                </v-list>
            </perfect-scrollbar>
        </v-sheet>
    </v-menu>
</template>

<style scoped>
.custom-hover-primary:hover {
    color: rgb(var(--v-theme-primary)) !important;
}
</style>