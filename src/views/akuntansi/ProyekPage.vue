<script setup lang="ts">
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'; 
import { format } from 'date-fns';
import { 
  BriefcaseIcon,
  TrashIcon, 
  RefreshIcon, 
  DeviceFloppyIcon,
  PencilIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const loadingList = ref(false);
const projectList = ref<any[]>([]);
const search = ref(''); 
const headers = [
  { title: 'No', key: 'index', align: 'center' as const, sortable: false },
  { title: 'No. Proyek', key: 'no', align: 'start' as const },
  { title: 'Nama Proyek', key: 'name', align: 'start' as const },
  { title: 'Penanggung Jawab', key: 'managerName', align: 'start' as const },
  { title: 'Tgl Mulai', key: 'startDate', align: 'start' as const },
  { title: 'Tgl Selesai', key: 'finishDate', align: 'start' as const },
  { title: 'Status', key: 'suspended', align: 'center' as const },
  { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false },
];

const initialFormState = {
  id: null as number | null,
  no: '',
  name: '',
  description: '',
  startDate: '',
  finishDate: '',
  suspended: false,
  contractNumber: '',
  contractDate: format(new Date(), 'yyyy-MM-dd'),
  contactName: '',
  managerName: ''
};

const form = reactive({ ...initialFormState });
const saving = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

const fetchList = async () => {
  loadingList.value = true;
  try {
    const url = new URL(`${API_BASE_URL}/Project/List.php`);
    // Fitur 'q' dicopot karena pencarian akan di-handle instan oleh client-side
    
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.s && Array.isArray(json.d)) {
        projectList.value = json.d.map((x:any,i:number) => ({...x, index: i+1}));
    } else {
        projectList.value = [];
    }
  } catch { 
    projectList.value = []; 
    showMsg('Gagal memuat daftar proyek.', 'error');
  } 
  finally { loadingList.value = false; }
};

const resetForm = () => {
  Object.assign(form, initialFormState);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSubmit = async () => {
  if(!form.name) return showMsg('Nama Proyek Wajib Diisi', 'error');
  
  saving.value = true;
  try {
    const payload = { ...form };
    const res = await fetch(`${API_BASE_URL}/Project/Save.php`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    const json = await res.json();
    if(json.s) {
      showMsg(json.message);
      resetForm();
      fetchList();
    } else {
      showMsg(json.message || 'Gagal menyimpan data proyek.', 'error');
    }
  } catch { showMsg('Error koneksi saat menyimpan.', 'error'); } 
  finally { saving.value = false; }
};

const editProject = async (id: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/Project/Detail.php?id=${id}`);
    const json = await res.json();
    if(json.s && json.d) {
      const d = json.d;
      Object.assign(form, {
        id: d.id,
        no: d.no || '',
        name: d.name || '',
        description: d.description || '',
        startDate: d.startDate ? d.startDate.split('/').reverse().join('-') : '',
        finishDate: d.finishDate ? d.finishDate.split('/').reverse().join('-') : '',
        suspended: d.suspended || false,
        contractNumber: d.contractNumber || '',
        contractDate: d.contractDate ? d.contractDate.split('/').reverse().join('-') : format(new Date(), 'yyyy-MM-dd'),
        contactName: d.contactName || '',
        managerName: d.managerName || ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showMsg('Gagal mengambil detail proyek.', 'error');
    }
  } catch { showMsg('Error koneksi.', 'error'); }
};

const deleteProject = async (id: number) => {
  if(!confirm('Apakah Anda yakin ingin menghapus proyek ini? (Aksi ini tidak dapat dibatalkan)')) return;
  try {
    const res = await fetch(`${API_BASE_URL}/Project/Delete.php`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id })
    });
    const json = await res.json();
    if(json.s) {
      showMsg(json.message);
      fetchList();
    } else {
      showMsg(json.message || 'Gagal menghapus.', 'error');
    }
  } catch { showMsg('Error koneksi saat menghapus.', 'error'); }
};

onMounted(fetchList);

onBeforeUnmount(() => {
  // Cleanup jika perlu
});
</script>

<template>
  <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">
            Manajemen Data Proyek
          </h2>
          <div class="text-caption text-white opacity-90">
            Buat, kelola, dan pantau daftar proyek perusahaan Anda.
          </div>
        </div>
      </div>
    </div>
  </v-card>

  <v-row class="mt-0">
    <v-col cols="12">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-form-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <BriefcaseIcon size="18" class="text-white mr-1" />
            <span class="text-subtitle-1 font-weight-bold text-white">{{ form.id ? 'Edit Proyek' : 'Entri Proyek Baru' }}</span>
          </div>
          <v-btn v-if="form.id" variant="text" size="small" color="white" @click="resetForm" class="text-none">Batal Edit</v-btn>
        </div>

        <v-card-text class="pa-4">
          
          <h6 class="text-subtitle-2 font-weight-bold mb-3 text-primary pb-1 border-bottom-dashed">INFORMASI PROYEK</h6>
          <v-row>
            <v-col cols="12" md="6" class="py-1">
              <v-text-field 
                v-model="form.no" 
                label="No. Proyek" 
                variant="outlined" 
                density="compact"
                hide-details
                placeholder="Otomatis jika kosong"
                class="mb-3 small-input"
              ></v-text-field>
              
              <v-text-field 
                v-model="form.name" 
                label="Nama Proyek *" 
                variant="outlined" 
                density="compact"
                hide-details
                class="mb-3 small-input"
              ></v-text-field>

              <v-textarea 
                v-model="form.description" 
                label="Keterangan" 
                rows="3" 
                variant="outlined" 
                density="compact"
                hide-details
                class="mb-3 small-input small-textarea"
              ></v-textarea>
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field 
                    v-model="form.startDate" 
                    type="date" 
                    label="Target Mulai" 
                    variant="outlined" 
                    density="compact"
                    hide-details
                    class="mb-3 small-input"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field 
                    v-model="form.finishDate" 
                    type="date" 
                    label="Tanggal Selesai" 
                    variant="outlined" 
                    density="compact"
                    hide-details
                    class="mb-3 small-input"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" class="mt-2">
                  <div class="bg-grey-lighten-4 pa-3 rounded border">
                    <div class="text-caption font-weight-bold mb-1 text-grey-darken-2">Pengaturan Status</div>
                    <v-switch 
                        v-model="form.suspended" 
                        label="Non Aktifkan Proyek (Suspended)" 
                        color="error" 
                        density="compact" 
                        hide-details
                    ></v-switch>
                    <div class="text-xsmall text-grey-darken-1 mt-1">Jika diaktifkan, proyek ini tidak akan bisa dipilih di transaksi.</div>
                  </div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <h6 class="text-subtitle-2 font-weight-bold mt-4 mb-3 text-primary pb-1 border-bottom-dashed">INFORMASI LAIN-LAIN</h6>
          <v-row>
            <v-col cols="12" sm="6" md="3" class="py-1">
              <v-text-field 
                v-model="form.contractNumber" 
                label="No. Kontrak" 
                variant="outlined" 
                density="compact"
                hide-details
                class="mb-2 small-input"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="3" class="py-1">
              <v-text-field 
                v-model="form.contractDate" 
                type="date" 
                label="Tgl Kontrak" 
                variant="outlined" 
                density="compact"
                hide-details
                class="mb-2 small-input"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="3" class="py-1">
              <v-text-field 
                v-model="form.contactName" 
                label="Nama Kontak" 
                variant="outlined" 
                density="compact"
                hide-details
                class="mb-2 small-input"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="3" class="py-1">
              <v-text-field 
                v-model="form.managerName" 
                label="Penanggung Jawab" 
                variant="outlined" 
                density="compact"
                hide-details
                class="mb-2 small-input"
              ></v-text-field>
            </v-col>
          </v-row>

        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="bg-grey-lighten-5 px-4 py-2 justify-end">
          <v-btn variant="outlined" color="secondary" size="small" @click="resetForm" class="px-4 text-caption">Reset</v-btn>
          <v-btn color="primary" size="small" variant="flat" @click="handleSubmit" :loading="saving" class="px-4 ml-1 text-caption">
            <DeviceFloppyIcon size="16" class="mr-1"/> Simpan Proyek
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

    <v-col cols="12" class="mt-2">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center">
            <BriefcaseIcon size="18" class="text-white mr-1" />
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-white">Daftar Proyek</h3>
              <div class="text-caption text-white opacity-80">List data proyek terdaftar</div>
            </div>
          </div>
          
          <div class="d-flex align-center gap-1">
            <v-text-field
              v-model="search"
              density="compact"
              variant="solo-filled"
              label="Cari Proyek..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              single-line
              bg-color="white"
              class="rounded small-search-input"
            ></v-text-field>
            <v-btn icon variant="text" color="white" @click="fetchList" :loading="loadingList" title="Refresh" size="small">
              <RefreshIcon size="18"/>
            </v-btn>
          </div>
        </div>

        <v-data-table 
          :headers="headers" 
          :items="projectList" 
          :search="search"
          :items-per-page="10"
          :loading="loadingList" 
          density="compact" 
          hover
          class="rounded-0 compact-data-table"
        >
          <template v-slot:headers="{ columns }">
            <tr class="bg-gradient-smooth">
              <template v-for="column in columns" :key="column.key">
                <th class="text-caption font-weight-bold text-uppercase text-white py-2 border-none" :class="`text-${column.align}`">
                  {{ column.title }}
                </th>
              </template>
            </tr>
          </template>
          
          <template v-slot:item.no="{ item }">
            <span class="font-weight-bold text-primary text-caption">{{ item.no || '-' }}</span>
          </template>
          <template v-slot:item.name="{ item }">
            <span class="text-caption font-weight-bold">{{ item.name }}</span>
          </template>
          <template v-slot:item.managerName="{ item }">
            <span class="text-caption text-grey-darken-1">{{ item.managerName || '-' }}</span>
          </template>
          <template v-slot:item.startDate="{ item }">
            <span class="text-caption text-grey-darken-1">{{ item.startDate || '-' }}</span>
          </template>
          <template v-slot:item.finishDate="{ item }">
            <span class="text-caption text-grey-darken-1">{{ item.finishDate || '-' }}</span>
          </template>
          <template v-slot:item.suspended="{ item }">
            <v-chip :color="item.suspended ? 'error' : 'success'" size="x-small" variant="flat" class="font-weight-bold text-uppercase">
              {{ item.suspended ? 'Non Aktif' : 'Aktif' }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" color="primary" size="x-small" @click="editProject(item.id)" title="Edit">
              <PencilIcon size="16"/>
            </v-btn>
            <v-btn icon variant="text" color="error" size="x-small" @click="deleteProject(item.id)" title="Hapus">
              <TrashIcon size="16"/>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
  </v-row>

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
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
:deep(th) { background-color: transparent !important; }

/* Helpers */
.text-xsmall { font-size: 0.7rem !important; }
.border-none { border: none !important; box-shadow: none !important; }
.border-bottom-dashed { border-bottom: 1px dashed rgba(0,0,0,0.12); }

/* INPUT COMPACT STYLING */
.small-input :deep(.v-field) {
  --v-field-padding-bottom: 4px;
  --v-field-padding-top: 4px;
  min-height: 36px !important;
}
.small-input :deep(.v-label) { font-size: 0.8rem; }
.small-input :deep(input) { font-size: 0.85rem; }
.small-textarea :deep(.v-field__input) {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  min-height: 50px !important;
}
.small-input :deep(.v-field__prepend-inner),
.small-input :deep(.v-field__append-inner) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

/* Data table custom styling */
.compact-data-table :deep(.v-data-table__td) {
  font-size: 0.75rem !important;
  height: 38px !important;
}
.compact-data-table :deep(.v-data-table-header) th {
  height: 35px !important;
}

/* Search Input */
.small-search-input :deep(.v-field) { min-height: 36px !important; }
.small-search-input :deep(.v-field__input) {
  font-size: 0.8rem;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  min-height: 30px !important;
  height: 30px !important;
}
.small-search-input :deep(.v-label) { font-size: 0.8rem; top: 6px; }
.small-search-input :deep(.v-field__prepend-inner) { margin-top: 2px; }
</style>