<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
    AlertCircleIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

const loading = ref(false);
const users = ref<any[]>([]);
const snackbar = reactive({ show: false, text: '', color: 'success' });

const showMsg = (text: string, color = 'success') => {
    snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

const fetchUsers = async () => {
    loading.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Approver/List.php`);
        const json = await res.json();
        if (json.s) users.value = json.d;
    } catch (e) {
        showMsg("Gagal memuat data", "error");
    } finally {
        loading.value = false;
    }
};

const updatePermission = async (user: any, module: string, value: boolean) => {
    try {
        const res = await fetch(`${API_BASE_URL}/Approver/Update.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                module: module,
                value: value
            })
        });
        const json = await res.json();
        if (json.s) {
            showMsg(`Akses Approval ${module} diperbarui`, "success");
        } else {
            user.approvals[module] = !value; 
            showMsg(json.message, "error");
        }
    } catch (e) {
        user.approvals[module] = !value; 
        showMsg("Koneksi Error", "error");
    }
};

onMounted(fetchUsers);
</script>

<template>
    <v-row class="justify-center mt-4">
        <v-col cols="12" md="12">
            <v-alert color="info" variant="tonal" class="mb-6" border="start">
                <template v-slot:prepend>
                    <AlertCircleIcon size="24" class="mr-2" />
                </template>
                <div class="text-subtitle-1 font-weight-bold">Setting Approver</div>
                <div class="text-body-2">
                    Atur hak akses user untuk melakukan Approval pada modul-modul berikut.
                </div>
            </v-alert>

            <UiParentCard title="Matrix Otoritas Approval">
                <v-table class="border rounded-md">
                    <thead class="bg-grey-lighten-4">
                        <tr>
                            <th width="250">User</th>
                            <th class="text-center">Role</th>
                            <th class="text-center">Kasbon & Biaya</th>
                            <th class="text-center">Sales Invoice</th>
                            <th class="text-center">Purchase Bill</th>
                            <th class="text-center bg-blue-lighten-5">Rekon Bank</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="6" class="text-center py-4">Loading...</td>
                        </tr>
                        <tr v-else v-for="u in users" :key="u.id" class="hover:bg-grey-lighten-5">
                            <td class="py-3">
                                <div class="d-flex align-center">
                                    <v-avatar color="primary" variant="tonal" size="32" class="mr-3">
                                        <span class="text-caption font-weight-bold">{{ u.name.charAt(0) }}</span>
                                    </v-avatar>
                                    <div>
                                        <div class="font-weight-bold">{{ u.name }}</div>
                                        <div class="text-caption text-grey">@{{ u.username }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-center">
                                <v-chip size="x-small" :color="u.role === 'admin' ? 'purple' : 'grey'" variant="flat" class="font-weight-bold text-uppercase text-white">
                                    {{ u.role }}
                                </v-chip>
                            </td>
                            <td class="text-center">
                                <v-switch v-model="u.approvals.KASBON" color="success" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'KASBON', val)" class="d-inline-flex"></v-switch>
                            </td>
                            <td class="text-center">
                                <v-switch v-model="u.approvals.INVOICE" color="success" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'INVOICE', val)" class="d-inline-flex"></v-switch>
                            </td>
                            <td class="text-center">
                                <v-switch v-model="u.approvals.BILL" color="success" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'BILL', val)" class="d-inline-flex"></v-switch>
                            </td>
                            <td class="text-center bg-blue-lighten-5">
                                <v-switch v-model="u.approvals.REKON" color="primary" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'REKON', val)" class="d-inline-flex"></v-switch>
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