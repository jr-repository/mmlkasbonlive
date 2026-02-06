<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';
import { 
  UsersIcon, 
  UserPlusIcon, 
  TrashIcon, 
  PencilIcon, 
  SearchIcon,
  DeviceFloppyIcon,
  XIcon
} from 'vue-tabler-icons';

const API_BASE = 'https://multimitralogistik.id/Backend/Api/Payroll/Employee';

// --- STATE ---
const employees = ref([]);
const search = ref('');
const dialog = ref(false);
const loading = ref(false);
const saving = ref(false);

const defaultForm = { id: null, name: '', nik: '', ktp: '', dept: 'IT', status: 'Tetap' };
const form = reactive({ ...defaultForm });

// --- METHODS ---
const loadData = async () => {
    loading.value = true;
    try {
        const res = await fetchWrapper.get(`${API_BASE}/List.php`);
        if (res && res.s === true) {
            employees.value = res.d || [];
        }
    } catch (e) {
        console.error("Gagal memuat data:", e);
    } finally {
        loading.value = false;
    }
};

const openModal = (item = null) => {
    if (item) {
        Object.assign(form, item);
    } else {
        Object.assign(form, defaultForm);
    }
    dialog.value = true;
};

const save = async () => {
    if (!form.name || !form.nik) {
        alert("Nama dan NIK wajib diisi!");
        return;
    }
    
    saving.value = true;
    try {
        const res = await fetchWrapper.post(`${API_BASE}/Save.php`, form);
        if (res && res.s === true) {
            await loadData();
            dialog.value = false;
        } else {
            alert(res.message || "Gagal menyimpan data.");
        }
    } catch (e) {
        alert("Gagal koneksi ke server.");
    } finally {
        saving.value = false;
    }
};

const deleteItem = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus karyawan ini?')) {
        try {
            const res = await fetchWrapper.post(`${API_BASE}/Delete.php`, { id });
            if (res && res.s === true) {
                await loadData();
            } else {
                alert(res.message || "Gagal menghapus.");
            }
        } catch (e) {
            alert("Terjadi kesalahan saat menghapus.");
        }
    }
};

const filteredEmployees = computed(() => {
    if (!Array.isArray(employees.value)) return [];
    return employees.value.filter(e => {
        const term = search.value.toLowerCase();
        const nameMatch = e.name ? e.name.toLowerCase().includes(term) : false;
        const nikMatch = e.nik ? e.nik.toString().includes(term) : false;
        return nameMatch || nikMatch;
    });
});

const getStatusColor = (s) => {
    if (!s) return 'grey';
    const status = s.toLowerCase();
    if (status === 'tetap') return 'success';
    if (status === 'kontrak') return 'warning';
    return 'info';
};

onMounted(loadData);
</script>

<template>
  <v-row>
    <v-col cols="12">
      <BaseBreadcrumb 
        title="Master Data Karyawan" 
        :breadcrumbs="[{title: 'Payroll', disabled: false}, {title: 'Karyawan', disabled: true}]"
      ></BaseBreadcrumb>

      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
        <div class="bg-gradient-smooth px-4 py-3">
          <div class="d-flex align-center gap-2">
            <div>
              <h2 class="text-h6 font-weight-bold text-white mb-0">Employee Database</h2>
              <div class="text-caption text-white opacity-90">
                Manage employee records, department assignments, and contract status.
              </div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center">
            <UsersIcon size="18" class="text-white mr-1" />
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-white">Employee List</h3>
            </div>
          </div>
          
          <div class="d-flex align-center gap-2">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search Name / NIK..."
              variant="flat"
              density="compact"
              hide-details
              rounded="pill"
              class="search-input-field mr-2"
              bg-color="white"
            ></v-text-field>
            
            <v-btn 
              color="success" 
              variant="flat" 
              size="small"
              @click="openModal()"
              class="text-none font-weight-bold text-caption"
            >
              <UserPlusIcon size="16" class="mr-1"/> Add Employee
            </v-btn>
          </div>
        </div>

        <v-table density="compact" class="compact-data-table modern-table" hover>
          <thead>
            <tr class="bg-gradient-smooth">
              <th class="text-caption font-weight-bold text-uppercase text-white border-none py-2">Karyawan</th>
              <th class="text-caption font-weight-bold text-uppercase text-white border-none py-2">No. KTP</th>
              <th class="text-caption font-weight-bold text-uppercase text-white border-none py-2">Departemen</th>
              <th class="text-caption font-weight-bold text-uppercase text-white border-none py-2">Status</th>
              <th class="text-caption font-weight-bold text-uppercase text-white border-none py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="30"></v-progress-circular>
                <div class="text-caption mt-2 text-medium-emphasis">Fetching data...</div>
              </td>
            </tr>

            <tr v-else-if="filteredEmployees.length === 0">
              <td colspan="5" class="text-center py-10 text-muted text-caption">
                No matching records found.
              </td>
            </tr>

            <tr v-for="item in filteredEmployees" :key="item.id">
              <td>
                <div class="d-flex align-center py-1">
                  <v-avatar size="28" color="primary" variant="tonal" class="mr-2">
                    <span class="text-caption">{{ item.name ? item.name.charAt(0).toUpperCase() : '?' }}</span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-bold text-caption">{{ item.name }}</div>
                    <div class="text-xsmall text-primary font-weight-medium">{{ item.nik }}</div>
                  </div>
                </div>
              </td>
              <td><span class="text-caption">{{ item.ktp }}</span></td>
              <td>
                <v-chip size="x-small" variant="flat" color="secondary" class="font-weight-bold">
                  {{ item.dept }}
                </v-chip>
              </td>
              <td>
                <v-chip 
                  :color="getStatusColor(item.status)" 
                  size="x-small" 
                  variant="tonal" 
                  class="font-weight-bold text-uppercase"
                >
                  {{ item.status }}
                </v-chip>
              </td>
              <td class="text-right">
                <v-btn icon variant="text" color="primary" size="x-small" @click="openModal(item)">
                  <PencilIcon size="16"/>
                </v-btn>
                <v-btn icon variant="text" color="error" size="x-small" @click="deleteItem(item.id)">
                  <TrashIcon size="16"/>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="dialog" max-width="500" transition="dialog-bottom-transition" persistent scrollable>
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <div class="bg-white rounded-circle pa-1 d-flex">
            <UserPlusIcon size="16" class="text-primary" />
          </div>
          <span class="text-subtitle-1 font-weight-bold text-white">
            {{ form.id ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru' }}
          </span>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialog = false">
          <XIcon size="18" />
        </v-btn>
      </div>

      <v-card-text class="pa-5 bg-grey-lighten-5">
        <v-row dense>
          <v-col cols="12">
            <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Nama Lengkap</v-label>
            <v-text-field 
              v-model="form.name" 
              variant="outlined" 
              density="compact" 
              color="primary" 
              hide-details 
              class="mb-3 small-input"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">NIK</v-label>
            <v-text-field 
              v-model="form.nik" 
              variant="outlined" 
              density="compact" 
              color="primary" 
              hide-details 
              class="mb-3 small-input"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">No. KTP</v-label>
            <v-text-field 
              v-model="form.ktp" 
              variant="outlined" 
              density="compact" 
              color="primary" 
              hide-details 
              class="mb-3 small-input"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Departemen</v-label>
            <v-select 
              v-model="form.dept" 
              :items="['IT', 'HRD', 'Finance', 'GA']" 
              variant="outlined" 
              density="compact" 
              color="primary" 
              hide-details 
              class="mb-3 small-input"
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Status Pekerjaan</v-label>
            <v-select 
              v-model="form.status" 
              :items="['Tetap', 'Kontrak', 'Harian']" 
              variant="outlined" 
              density="compact" 
              color="primary" 
              hide-details 
              class="mb-3 small-input"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="bg-white pa-4">
        <v-spacer></v-spacer>
        <v-btn 
          variant="outlined" 
          color="secondary" 
          size="small" 
          @click="dialog = false" 
          class="px-4 text-caption text-none"
        >Cancel</v-btn>
        <v-btn 
          color="primary" 
          variant="flat" 
          size="small" 
          @click="save" 
          :loading="saving" 
          class="px-6 ml-1 text-caption text-none"
        >
          <DeviceFloppyIcon size="16" class="mr-1"/> Save Record
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Gradient Theme derived from UserSettingPage */
.bg-gradient-smooth {
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}

.border-none {
  border: none !important;
}

/* Compact Table Layout */
.compact-data-table :deep(.v-table__wrapper) {
  border-radius: 0;
}

.compact-data-table :deep(th) {
  height: 38px !important;
  font-size: 0.75rem !important;
}

.compact-data-table :deep(td) {
  height: 44px !important;
  font-size: 0.75rem !important;
}

/* Row Hover Effect */
.modern-table tbody tr:hover {
  background-color: #f8fafc !important;
  transition: 0.2s;
}

/* Search Bar Compaction */
.search-input-field {
  max-width: 250px;
}
.search-input-field :deep(.v-field__input) {
  font-size: 0.75rem;
  min-height: 32px !important;
  padding-top: 5px;
}

/* Input Compaction */
.small-input :deep(.v-field) {
  --v-field-padding-bottom: 4px;
  --v-field-padding-top: 4px;
  min-height: 36px !important;
}

.text-xsmall {
  font-size: 0.65rem !important;
}

.gap-2 {
  gap: 8px;
}

/* Avatar Border Styling */
.v-avatar {
  border: 1px solid rgba(0,0,0,0.05);
}
</style>