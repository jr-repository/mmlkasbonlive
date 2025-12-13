<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
    UserCogIcon, 
    ShieldCheckIcon,
    AlertCircleIcon 
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

interface UserPermission {
    id: number;
    username: string;
    name: string;
    role: string;
    // Pastikan tipe data boolean agar kompatibel dengan v-switch
    can_approve: boolean; 
}

const users = ref<UserPermission[]>([]);
const loading = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// --- SNACKBAR HELPER ---
const showMsg = (text: string, color = 'success') => { 
    snackbar.text = text; 
    snackbar.color = color; 
    snackbar.show = true; 
};

// --- METHODS ---
const fetchUsers = async () => {
    loading.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Rekon/Settings.php`);
        const json = await res.json();
        if (json.s && Array.isArray(json.d)) {
            // Mapping: Pastikan data dari API (yang mungkin 1/0) dikonversi jadi boolean true/false
            users.value = json.d.map((u: any) => ({
                ...u,
                can_approve: u.can_approve === true || u.can_approve === 1 || u.can_approve === "1"
            }));
        }
    } catch (e) {
        showMsg("Gagal memuat user.", "error");
    } finally {
        loading.value = false;
    }
};

// Fungsi Update (Perbaikan Logic)
const updatePermission = async (user: UserPermission) => {
    // Saat fungsi ini dipanggil, v-model SUDAH mengubah nilai user.can_approve di UI.
    // Kita ambil nilai baru tersebut.
    const newValue = user.can_approve;

    try {
        const res = await fetch(`${API_BASE_URL}/Rekon/Settings.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: user.id, 
                // Kirim boolean (true/false) atau integer (1/0)
                can_approve: newValue 
            })
        });
        const json = await res.json();
        
        if (json.s) {
            showMsg(`Hak akses ${user.name} berhasil diperbarui`, "success");
        } else {
            throw new Error(json.message);
        }
    } catch (e: any) {
        // JIKA GAGAL: Kembalikan tampilan toggle ke posisi semula (Revert)
        user.can_approve = !newValue;
        showMsg(e.message || "Gagal update", "error");
    }
};

onMounted(fetchUsers);
</script>

<template>
    <v-row class="justify-center">
        <v-col cols="12" md="10">
            <v-alert color="primary" variant="tonal" class="mb-6" border="start">
                <template v-slot:prepend>
                    <UserCogIcon size="24" class="mr-2" />
                </template>
                <div class="text-subtitle-1 font-weight-bold">Hak Akses Rekonsiliasi</div>
                <div class="text-body-2">
                    Atur user yang memiliki wewenang untuk melakukan Approval atau Reject pada transaksi rekonsiliasi.
                </div>
            </v-alert>

            <UiParentCard title="Daftar User System">
                <template v-slot:action>
                    <ShieldCheckIcon size="20" class="text-primary" />
                </template>

                <v-table class="border rounded-md" density="comfortable">
                    <thead>
                        <tr class="bg-grey-lighten-4">
                            <th>User</th>
                            <th>Role</th>
                            <th class="text-center" width="200">Akses Approval</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="3" class="text-center py-4">
                                <v-progress-circular indeterminate size="24" color="primary"></v-progress-circular>
                            </td>
                        </tr>
                        <tr v-else v-for="user in users" :key="user.id" class="hover:bg-grey-lighten-5">
                            <td class="py-3">
                                <div class="font-weight-medium">{{ user.name }}</div>
                                <div class="text-caption text-grey">@{{ user.username }}</div>
                            </td>
                            <td>
                                <v-chip size="small" label color="grey-darken-1" variant="outlined" class="text-uppercase font-weight-bold">
                                    {{ user.role }}
                                </v-chip>
                            </td>
                            <td class="text-center">
                                <div class="d-flex justify-center">
                                    <v-switch
                                        v-model="user.can_approve"
                                        color="primary"
                                        hide-details
                                        density="compact"
                                        inset
                                        @update:model-value="updatePermission(user)"
                                    ></v-switch>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </UiParentCard>
        </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right">
        {{ snackbar.text }}
        <template v-slot:actions><v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn></template>
    </v-snackbar>
</template>