<script setup lang="ts">
import { ref, reactive } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
    UserPlusIcon, 
    UserIcon, 
    LockIcon, 
    ShieldLockIcon, 
    IdIcon,
    AlertCircleIcon 
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

const form = reactive({ username: '', password: '', name: '', role: 'user' });
const loading = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

const roles = [
    { title: 'User / Staff', value: 'user' }, 
    { title: 'Administrator', value: 'admin' }
];

const handleSubmit = async () => {
    if(!form.username || !form.password || !form.name) {
        snackbar.text = "Mohon lengkapi semua field"; snackbar.color = "warning"; snackbar.show = true;
        return;
    }

    loading.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Register/AuthRegister.php`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(form)
        });
        const json = await res.json();
        
        if(json.s) {
            snackbar.text = "User baru berhasil ditambahkan!"; snackbar.color = "success"; snackbar.show = true;
            // Reset form
            form.username=''; form.password=''; form.name=''; form.role='user';
        } else {
             snackbar.text = json.message || "Gagal menambahkan user"; snackbar.color = "error"; snackbar.show = true;
        }
    } catch {
        snackbar.text = "Terjadi kesalahan koneksi server"; snackbar.color = "error"; snackbar.show = true;
    } finally { 
        loading.value = false; 
    }
};
</script>

<template>
    <v-row class="justify-center mt-4">
        <v-col cols="12" md="8" lg="6">
            <v-alert color="primary" variant="tonal" class="mb-6" border="start">
                <template v-slot:prepend>
                    <AlertCircleIcon size="24" class="mr-2" />
                </template>
                <div class="text-subtitle-2 font-weight-bold">Informasi Admin</div>
                <div class="text-caption">
                    User yang ditambahkan akan memiliki akses login ke sistem ini. Pastikan password aman.
                </div>
            </v-alert>

            <UiParentCard title="Tambah Pengguna Baru">
                <form @submit.prevent="handleSubmit">
                    <v-row>
                        <v-col cols="12">
                            <v-label class="mb-2 font-weight-medium">Nama Lengkap</v-label>
                            <v-text-field 
                                v-model="form.name" 
                                placeholder="Contoh: Budi Santoso" 
                                variant="outlined" 
                                color="primary"
                                density="comfortable"
                            >
                                <template v-slot:prepend-inner>
                                    <IdIcon size="20" class="text-grey" />
                                </template>
                            </v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-label class="mb-2 font-weight-medium">Hak Akses (Role)</v-label>
                            <v-select 
                                v-model="form.role" 
                                :items="roles" 
                                placeholder="Pilih Role" 
                                variant="outlined"
                                color="primary"
                                density="comfortable"
                            >
                                <template v-slot:prepend-inner>
                                    <ShieldLockIcon size="20" class="text-grey" />
                                </template>
                            </v-select>
                        </v-col>

                        <v-divider class="my-2 w-100"></v-divider>

                        <v-col cols="12" md="6">
                            <v-label class="mb-2 font-weight-medium">Username</v-label>
                            <v-text-field 
                                v-model="form.username" 
                                placeholder="Username untuk login" 
                                variant="outlined" 
                                color="primary"
                                density="comfortable"
                                autocomplete="new-username"
                            >
                                <template v-slot:prepend-inner>
                                    <UserIcon size="20" class="text-grey" />
                                </template>
                            </v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-label class="mb-2 font-weight-medium">Password</v-label>
                            <v-text-field 
                                v-model="form.password" 
                                type="password" 
                                placeholder="Katasandi" 
                                variant="outlined" 
                                color="primary"
                                density="comfortable"
                                autocomplete="new-password"
                            >
                                <template v-slot:prepend-inner>
                                    <LockIcon size="20" class="text-grey" />
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>

                    <div class="mt-6">
                        <v-btn 
                            block 
                            color="primary" 
                            size="large" 
                            type="submit" 
                            :loading="loading" 
                            elevation="2"
                        >
                            <UserPlusIcon class="mr-2" size="20"/> Tambah User
                        </v-btn>
                    </div>
                </form>
            </UiParentCard>
        </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right">
        {{ snackbar.text }}
        <template v-slot:actions>
            <v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn>
        </template>
    </v-snackbar>
</template>