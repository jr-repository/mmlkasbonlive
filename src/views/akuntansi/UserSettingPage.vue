<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
  UserPlusIcon, 
  TrashIcon,
  SettingsIcon,
  CheckIcon,
  XIcon,
    UsersIcon,
    DeviceFloppyIcon // Tambahkan icon untuk konsistensi save
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

// --- DATA & STATE ---
const users = ref<any[]>([]);
const loadingList = ref(false);
const loadingAction = ref(false);
const savingPerms = ref(false); 
const deletingUser = ref(false);

const dialogForm = ref(false); // STATE UNTUK MODAL FORM USER BARU

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

// DAFTAR MENU LENGKAP (Dipertahankan seperti asli)
const menuList = [
  { header: 'Menu Utama' },
  { key: 'dashboard', label: 'Dashboard' },
  
  { header: 'Transaksi' },
  { key: 'job_order', label: 'Job Order' },
  { key: 'invoice', label: 'Sales Invoice (AR)' },
  { key: 'bill', label: 'Tagihan Vendor (AP)' },
  { key: 'kasbon', label: 'Kasbon & Biaya' },
  { key: 'penerimaan', label: 'Penerimaan Lain' },
  { key: 'transfer', label: 'Transfer Bank' },
  
  { header: 'Laporan & Analisis' },
  { key: 'laporan', label: 'Laporan Keuangan' },
  { key: 'rekon', label: 'Rekonsiliasi Bank' },

  { header: 'Master Data' },
  { key: 'master_tax', label: 'Setting Pajak' },

  { header: 'Admin Only' },
  { key: 'users', label: 'Manajemen User' },
  { key: 'approver_settings', label: 'Setting Approver' },
  { key: 'settings', label: 'Konfigurasi Sistem' },
];

const headers = [
    { title: 'No', key: 'index', align: 'center' as const, sortable: false, width: '50px' },
  { title: 'User Info', key: 'userInfo', align: 'start' as const, sortable: false },
  { title: 'Role', key: 'role', align: 'start' as const, sortable: false },
  { title: 'Access', key: 'access', align: 'center' as const, sortable: false, width: '150px' },
  { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false, width: '100px' },
];

const resetForm = () => {
    form.username = '';
    form.password = '';
    form.name = '';
    form.role = 'user';
    dialogForm.value = false;
}

// --- METHODS ---

const fetchUsers = async () => {
  loadingList.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Users/List.php`);
    const json = await res.json();
    // FIX: Tambahkan indexing pada data user
    if (json.s) users.value = json.d.map((u: any, index: number) => ({ ...u, index: index + 1 }));
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
      resetForm(); 
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
  
  deletingUser.value = true; 
    const originalSelectedUser = selectedUser.value;
    selectedUser.value = { id }; // Set selected user for button loading indicator
    
  try {
    const res = await fetch(`${API_BASE_URL}/Users/Delete.php`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    if(json.s) {
      showMsg("User dihapus", "warning");
      fetchUsers();
    } else {
      showMsg(json.message, "error");
    }
  } catch {
    showMsg("Error menghapus", "error");
  } finally {
    deletingUser.value = false; 
        selectedUser.value = originalSelectedUser;
  }
};

const openPermissionModal = (user: any) => {
  selectedUser.value = user;
  selectedPerms.value = user.permissions ? [...user.permissions] : [];
  dialogPerm.value = true;
};

const savePermissions = async () => {
  if(!selectedUser.value) return;
  
    savingPerms.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Users/UpdateAccess.php`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ 
        user_id: selectedUser.value.id,
        menus: selectedPerms.value
      })
    });
    const json = await res.json();
    if(json.s) {
      showMsg("Hak akses diperbarui");
      dialogPerm.value = false;
      fetchUsers(); 
    } else {
      showMsg(json.message, "error");
    }
  } catch {
    showMsg("Gagal menyimpan akses", "error");
  } finally {
        savingPerms.value = false;
    }
};

onMounted(fetchUsers);
</script>

<template>
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">
            User & Access Management
          </h2>
          <div class="text-caption text-white opacity-90">
            Manage system users, roles, and menu permissions.
          </div>
        </div>
      </div>
    </div>
  </v-card>

  <v-row class="mt-0">
    <v-col cols="12">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center">
            <UsersIcon size="18" class="text-white mr-1" />
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-white">System User List</h3>
              <div class="text-caption text-white opacity-80">Manage user accounts and permissions</div>
            </div>
          </div>
          
          <div class="d-flex align-center gap-1">
                                    <v-btn 
              color="success" 
              variant="flat" 
              size="small"
              @click="dialogForm = true"
              class="text-none font-weight-bold text-caption"
            >
              <UserPlusIcon size="16" class="mr-1"/> Add New User
            </v-btn>
          </div>
        </div>

                <v-data-table
                    :headers="headers"
                    :items="users"
                    :loading="loadingList"
                    density="compact"
                    hover
                    class="rounded-0 compact-data-table"
                >
                    <template v-slot:headers="{ columns }">
                        <tr class="bg-gradient-smooth">
                            <template v-for="column in columns" :key="column.key ?? column.title">
                                <th class="text-caption font-weight-bold text-uppercase text-white py-2 border-none" :class="`text-${column.align}`">
                                    {{ column.title }}
                                </th>
                            </template>
                        </tr>
                    </template>

                    <template v-slot:item.index="{ item }">
                        <span class="text-caption text-medium-emphasis">{{ item.index }}</span>
                    </template>

                    <template v-slot:item.userInfo="{ item }">
                        <div class="py-2">
                            <div class="font-weight-bold text-caption">{{ item.name }}</div>
                            <div class="text-xsmall text-grey">@{{ item.username }}</div>
                        </div>
                    </template>

                    <template v-slot:item.role="{ item }">
                        <v-chip 
                            size="x-small" 
                            :color="item.role === 'admin' ? 'purple' : 'blue'" 
                            variant="tonal" 
                            class="font-weight-bold text-uppercase text-caption"
                        >
                            {{ item.role }}
                        </v-chip>
                    </template>

                    <template v-slot:item.access="{ item }">
                        <div class="text-center">
                            <div v-if="item.role === 'admin'" class="text-caption font-italic text-success">Full Access</div>
                            <div v-else>
                                <v-btn 
                                    size="x-small" 
                                    variant="outlined" 
                                    color="primary" 
                                    @click="openPermissionModal(item)"
                                    class="text-caption text-none"
                                >
                                    <SettingsIcon size="14" class="mr-1"/> {{ item.permissions?.length || 0 }} Menu
                                </v-btn>
                            </div>
                        </div>
                    </template>

                    <template v-slot:item.actions="{ item }">
                        <v-btn 
                            icon 
                            variant="text" 
                            color="error" 
                            size="x-small" 
                            @click="deleteUser(item.id)" 
                            :loading="deletingUser && item.id === selectedUser?.id"
                        >
                            <TrashIcon size="16"/>
                        </v-btn>
                    </template>

                    <template v-slot:no-data>
                        <div class="py-3 text-center text-medium-emphasis text-caption">No user data found.</div>
                    </template>

                </v-data-table>
      </v-card>
    </v-col>
  </v-row>

    <v-dialog v-model="dialogForm" max-width="450" transition="dialog-bottom-transition" scrollable @after-leave="resetForm">
        <v-card class="rounded-lg overflow-hidden small-dialog-card">
            <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
                <div class="d-flex align-center gap-2">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <UserPlusIcon size="16" class="text-primary" />
                    </div>
                    <span class="text-subtitle-1 font-weight-bold text-white">Add New User</span>
                </div>
                <v-btn icon variant="text" color="white" size="small" @click="dialogForm = false">
                    <XIcon size="18" />
                </v-btn>
            </div>

            <v-card-text class="pa-4 bg-grey-lighten-5">
                <form @submit.prevent="handleCreateUser">
                    <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Nama Lengkap</v-label>
                    <v-text-field 
                        v-model="form.name" 
                        variant="outlined" 
                        color="primary" 
                        density="compact" 
                        hide-details
                        prepend-inner-icon="mdi-account-details"
                        class="mb-3 small-input"
                    ></v-text-field>

                    <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Username</v-label>
                    <v-text-field 
                        v-model="form.username" 
                        variant="outlined" 
                        color="primary" 
                        density="compact" 
                        hide-details
                        prepend-inner-icon="mdi-account"
                        class="mb-3 small-input"
                    ></v-text-field>

                    <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Password</v-label>
                    <v-text-field 
                        v-model="form.password" 
                        type="password"
                        variant="outlined" 
                        color="primary" 
                        density="compact" 
                        hide-details
                        prepend-inner-icon="mdi-lock"
                        class="mb-3 small-input"
                    ></v-text-field>

                    <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Role</v-label>
                    <v-select 
                        v-model="form.role" :items="roles" 
                        item-title="title" item-value="value"
                        variant="outlined" 
                        color="primary" 
                        density="compact"
                        hide-details
                        prepend-inner-icon="mdi-shield-account"
                        class="small-input"
                    ></v-select>
                    
                    <v-divider class="my-4"></v-divider>

                    <v-btn block color="primary" type="submit" :loading="loadingAction" class="text-none font-weight-bold text-caption">
                        <DeviceFloppyIcon size="16" class="mr-1"/> Save User
                    </v-btn>
                </form>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="dialogPerm" max-width="600" transition="dialog-bottom-transition" scrollable>
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <SettingsIcon size="16" class="text-primary" />
                    </div>
          <span class="text-subtitle-1 font-weight-bold text-white">Setting Akses Menu</span>
                </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialogPerm = false"><XIcon size="18"/></v-btn>
      </div>

      <v-card-text class="pa-4 bg-grey-lighten-5 dialog-detail-content">
        <div class="mb-3 bg-blue-lighten-5 pa-2 rounded text-caption border">
          User: <strong>{{ selectedUser?.name }}</strong> (@{{ selectedUser?.username }})
        </div>
        <div class="text-caption text-grey-darken-2 font-weight-bold mb-2">Centang menu yang diizinkan:</div>
        
        <v-card variant="outlined" class="pa-2 bg-white rounded-lg">
                    <v-row dense>
                        <template v-for="(menu, i) in menuList" :key="i">
                            <v-col cols="12" v-if="menu.header" class="py-1">
                                <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mt-2 mb-1 border-bottom-dashed pb-1">
                                    {{ menu.header }}
                                </div>
                            </v-col>
                            <v-col cols="6" v-else class="py-1">
                                <v-checkbox 
                                    v-model="selectedPerms" 
                                    :value="menu.key" 
                                    :label="menu.label"
                                    density="compact"
                                    hide-details
                                    color="primary"
                                    class="compact-checkbox"
                                >
                                    <template v-slot:label>
                                        <span class="text-caption">{{ menu.label }}</span>
                                    </template>
                                </v-checkbox>
                            </v-col>
                        </template>
                    </v-row>
                </v-card>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="bg-white pa-3 justify-end">
                <v-btn variant="outlined" color="secondary" size="small" @click="dialogPerm = false" class="px-4 text-caption">Cancel</v-btn>
        <v-btn color="primary" variant="flat" size="small" @click="savePermissions" :loading="savingPerms" class="px-4 ml-1 text-caption">
          <CheckIcon size="16" class="mr-1"/> Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" variant="elevated" timeout="3000">
    <div class="d-flex align-center text-caption">
      <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" class="mr-1" size="18"></v-icon>
      {{ snackbar.text }}
    </div>
    <template v-slot:actions>
      <v-btn variant="text" icon="mdi-close" size="x-small" @click="snackbar.show = false"></v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
/* Gradient Theme */
.bg-gradient-smooth {
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}
.border-none {
  border: none !important;
  box-shadow: none !important;
}
.border-bottom-dashed {
    border-bottom: 1px dashed #ccc;
}

/* Global Compact UI Styles */
.compact-header-card {
    margin-bottom: 1rem !important;
}
.compact-data-table :deep(.v-data-table__td) {
  font-size: 0.75rem !important;
  height: 38px !important; 
}
.compact-data-table :deep(.v-data-table-header) th {
  height: 35px !important; 
}

/* Input Compaction */
.small-input :deep(.v-field) {
  --v-field-padding-bottom: 4px;
  --v-field-padding-top: 4px;
  min-height: 36px !important;
}
.small-input :deep(.v-label) {
  font-size: 0.8rem;
}
.small-input :deep(input) {
  font-size: 0.85rem;
}
.small-input :deep(.v-field__prepend-inner),
.small-input :deep(.v-field__append-inner) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

/* Checkbox alignment fix (tighter spacing) */
.compact-checkbox :deep(.v-selection-control) {
    min-height: 25px;
    padding-top: 0;
    padding-bottom: 0;
}
.compact-checkbox :deep(.v-selection-control__wrapper) {
    margin-top: 0;
    margin-bottom: 0;
}

/* Detail Dialog Styles */
.dialog-detail-content {
  font-size: 0.8rem;
}
.text-xsmall {
  font-size: 0.65rem !important;
}
</style>