<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
    UserPlusIcon, 
    UserIcon, 
    LockIcon, 
    ShieldLockIcon, 
    IdIcon,
    AlertCircleIcon,
    TrashIcon,
    SettingsIcon,
    CheckIcon,
    XIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

// --- DATA & STATE ---
const users = ref<any[]>([]);
const loadingList = ref(false);
const loadingAction = ref(false);

const form = reactive({ username: '', password: '', name: '', role: 'user' });
const roles = [
    { title: 'User / Staff', value: 'user' }, 
    { title: 'Administrator', value: 'admin' }
];

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
    snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

// Permission Modal
const dialogPerm = ref(false);
const selectedUser = ref<any>(null);
const selectedPerms = ref<string[]>([]);

const menuList = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'job_order', label: 'Job Order' },
    { key: 'kasbon', label: 'Kasbon & Biaya' },
    { key: 'invoice', label: 'Sales Invoice' },
    { key: 'penerimaan', label: 'Penerimaan Lain' },
    { key: 'transfer', label: 'Transfer Bank' },
    { key: 'laporan', label: 'Laporan Keuangan' },
    { key: 'rekon', label: 'Rekonsiliasi Bank' },
    { key: 'users', label: 'Manajemen User' },
    { key: 'settings', label: 'Konfigurasi Sistem' },
];

// --- METHODS ---

const fetchUsers = async () => {
    loadingList.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Users/List.php`);
        const json = await res.json();
        if (json.s) users.value = json.d;
    } catch (e) {
        showMsg("Gagal memuat list user", "error");
    } finally {
        loadingList.value = false;
    }
};

const handleCreateUser = async () => {
    if(!form.username || !form.password || !form.name) return showMsg("Lengkapi form", "warning");

    loadingAction.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Register/AuthRegister.php`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(form)
        });
        const json = await res.json();
        
        if(json.s) {
            showMsg("User berhasil ditambahkan");
            form.username=''; form.password=''; form.name=''; form.role='user';
            fetchUsers();
        } else {
             showMsg(json.message, "error");
        }
    } catch {
        showMsg("Error koneksi", "error");
    } finally { 
        loadingAction.value = false; 
    }
};

const deleteUser = async (id: number) => {
    if(!confirm("Yakin ingin menghapus user ini?")) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/Users/Delete.php`, {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        const json = await res.json();
        if(json.s) {
            showMsg("User dihapus");
            fetchUsers();
        } else {
            showMsg(json.message, "error");
        }
    } catch {
        showMsg("Error menghapus", "error");
    }
};

const openPermissionModal = (user: any) => {
    selectedUser.value = user;
    // Clone array agar tidak reaktif langsung ke list sebelum save
    selectedPerms.value = user.permissions ? [...user.permissions] : [];
    dialogPerm.value = true;
};

const savePermissions = async () => {
    if(!selectedUser.value) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/Users/UpdateAccess.php`, {
            method: 'POST',
            body: JSON.stringify({ 
                user_id: selectedUser.value.id,
                menus: selectedPerms.value
            })
        });
        const json = await res.json();
        if(json.s) {
            showMsg("Hak akses diperbarui");
            dialogPerm.value = false;
            fetchUsers(); // Refresh data agar tampilan tabel update
        } else {
            showMsg(json.message, "error");
        }
    } catch {
        showMsg("Gagal menyimpan akses", "error");
    }
};

onMounted(fetchUsers);
</script>

<template>
    <v-row>
        <v-col cols="12" md="4">
            <UiParentCard title="Tambah User Baru">
                <form @submit.prevent="handleCreateUser">
                    <v-label class="mb-2 font-weight-medium">Nama Lengkap</v-label>
                    <v-text-field 
                        v-model="form.name" 
                        variant="outlined" color="primary" density="compact" 
                        prepend-inner-icon="mdi-account-details"
                    ></v-text-field>

                    <v-label class="mb-2 font-weight-medium">Username</v-label>
                    <v-text-field 
                        v-model="form.username" 
                        variant="outlined" color="primary" density="compact" 
                        prepend-inner-icon="mdi-account"
                    ></v-text-field>

                    <v-label class="mb-2 font-weight-medium">Password</v-label>
                    <v-text-field 
                        v-model="form.password" type="password"
                        variant="outlined" color="primary" density="compact" 
                        prepend-inner-icon="mdi-lock"
                    ></v-text-field>

                    <v-label class="mb-2 font-weight-medium">Role</v-label>
                    <v-select 
                        v-model="form.role" :items="roles" 
                        variant="outlined" color="primary" density="compact"
                        prepend-inner-icon="mdi-shield-account"
                    ></v-select>

                    <v-btn block color="primary" class="mt-4" type="submit" :loading="loadingAction">
                        <UserPlusIcon size="18" class="mr-2"/> Simpan User
                    </v-btn>
                </form>
            </UiParentCard>
        </v-col>

        <v-col cols="12" md="8">
            <UiParentCard title="Daftar Pengguna System">
                <v-table class="border rounded-md">
                    <thead class="bg-grey-lighten-4">
                        <tr>
                            <th>User Info</th>
                            <th>Role</th>
                            <th class="text-center">Akses Menu</th>
                            <th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loadingList">
                            <td colspan="4" class="text-center py-4">Loading...</td>
                        </tr>
                        <tr v-else v-for="u in users" :key="u.id" class="hover:bg-grey-lighten-5">
                            <td class="py-3">
                                <div class="font-weight-bold">{{ u.name }}</div>
                                <div class="text-caption text-grey">@{{ u.username }}</div>
                            </td>
                            <td>
                                <v-chip size="small" :color="u.role === 'admin' ? 'purple' : 'blue'" variant="tonal" class="font-weight-bold text-uppercase">
                                    {{ u.role }}
                                </v-chip>
                            </td>
                            <td class="text-center">
                                <div v-if="u.role === 'admin'" class="text-caption font-italic text-grey">Full Access</div>
                                <div v-else>
                                    <v-btn size="small" variant="outlined" color="primary" @click="openPermissionModal(u)">
                                        <SettingsIcon size="16" class="mr-1"/> {{ u.permissions?.length || 0 }} Menu
                                    </v-btn>
                                </div>
                            </td>
                            <td class="text-center">
                                <v-btn icon variant="text" color="error" size="small" @click="deleteUser(u.id)">
                                    <TrashIcon size="18"/>
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </UiParentCard>
        </v-col>
    </v-row>

    <v-dialog v-model="dialogPerm" max-width="500">
        <v-card>
            <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
                Setting Akses Menu
                <v-btn icon variant="text" color="white" @click="dialogPerm = false"><XIcon size="20"/></v-btn>
            </v-card-title>
            <v-card-text class="pt-4">
                <div class="mb-3 bg-blue-lighten-5 pa-2 rounded text-body-2">
                    User: <strong>{{ selectedUser?.name }}</strong>
                </div>
                <div class="text-caption text-grey mb-2">Checklist menu yang diizinkan:</div>
                
                <v-row dense>
                    <v-col cols="6" v-for="menu in menuList" :key="menu.key">
                        <v-checkbox 
                            v-model="selectedPerms" 
                            :value="menu.key" 
                            :label="menu.label"
                            density="compact"
                            hide-details
                            color="primary"
                        ></v-checkbox>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="dialogPerm = false">Batal</v-btn>
                <v-btn color="primary" variant="flat" @click="savePermissions">
                    <CheckIcon size="18" class="mr-2"/> Simpan Perubahan
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right">
        {{ snackbar.text }}
        <template v-slot:actions><v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn></template>
    </v-snackbar>
</template>