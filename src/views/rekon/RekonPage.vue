<script setup lang="ts">
// FIX: Tambahkan onBeforeUnmount
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'; 
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
  UploadIcon, 
  DownloadIcon, 
  SettingsIcon, 
  SearchIcon, 
  RefreshIcon, 
  EyeIcon,
  ArrowDownCircleIcon,
  FileTextIcon,
  CheckIcon,
  XIcon,
  PlusIcon 
} from 'vue-tabler-icons';

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";
const router = useRouter();
const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement | null>(null);
const currentUser = authStore.user;

// --- STATE ---
const loading = ref(false);
const list = ref<any[]>([]);
const stats = ref<any>(null);
const search = ref("");
const filterStatus = ref("ALL");
const importing = ref(false);

// FIX: Pindahkan deklarasi timer ke lingkup script setup
let timeout: ReturnType<typeof setTimeout> | null = null; 

// Modal Action State (Existing)
const modalOpen = ref(false);
const selectedItem = ref<any>(null);
const actionForm = reactive({ status: '', note: '' });
const uploadFiles = ref<File[]>([]);
const submitting = ref(false);

// [BARU] Modal Create State
const createModalOpen = ref(false);
const creating = ref(false);
const createForm = reactive({
  account_no: '',
  date: new Date().toISOString().substr(0, 10),
  val_date: new Date().toISOString().substr(0, 10),
  transaction_code: '',
  description1: '',
  description2: '',
  reference_no: '',
  debit: 0,
  credit: 0
});

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

const headers = [
  { title: 'Date', key: 'date', align: 'start' as const },
  { title: 'Trx Code', key: 'transaction_code', align: 'start' as const },
  { title: 'Account', key: 'account_no', align: 'start' as const },
  { title: 'Description', key: 'description1', align: 'start' as const },
  { title: 'Debit', key: 'debit', align: 'end' as const },
  { title: 'Credit', key: 'credit', align: 'end' as const },
  { title: 'Status', key: 'status', align: 'center' as const },
  // Injecting Headers for required columns
  { title: 'Created By', key: 'creator_name', align: 'start' as const },
  { title: 'Approved By', key: 'updater_name', align: 'start' as const },
  { title: 'Action', key: 'actions', align: 'center' as const, sortable: false },
];

const statusOptions = ['New', 'Approved', 'Rejected'];

// --- METHODS ---
const fetchData = async () => {
  loading.value = true;
  try {
    // Fetch List
    const resList = await fetch(`${API_BASE_URL}/Rekon/List.php?q=${search.value}&status=${filterStatus.value}`);
    const jsonList = await resList.json();
    if(jsonList.s) list.value = jsonList.d.map((item:any) => ({
      ...item,
      debit: parseFloat(item.debit),
      credit: parseFloat(item.credit)
    }));
    else list.value = []; 

    // Fetch Dashboard Stats
    const resStats = await fetch(`${API_BASE_URL}/Rekon/Dashboard.php`);
    const jsonStats = await resStats.json();
    if(jsonStats.s) stats.value = jsonStats.d;
    else stats.value = null; 
  } catch (e) {
    showMsg("Gagal memuat data rekonsiliasi.", "error"); 
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// FIX: Gunakan fungsi debounced untuk watch
const fetchDataDebounced = () => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(fetchData, 500); // FIX: Debounce 500ms
}

// FIX: Gunakan fungsi debounced untuk watch
watch([search, filterStatus], fetchDataDebounced);

// Import Logic
const handleImportClick = () => fileInput.value?.click();
const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const formData = new FormData();
  formData.append("file", file);
  
  // [FIXED] Kirim User ID sebagai creator
  if(currentUser && currentUser.id) {
    formData.append('user_id', currentUser.id);
  }

  importing.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Rekon/Import.php`, { method: "POST", body: formData });
    const json = await res.json();
    if (json.s) {
      showMsg(json.message, "success");
      fetchData();
    } else {
      showMsg(json.message || "Gagal melakukan import.", "error");
    }
  } catch {
    showMsg("Gagal upload file. Periksa koneksi atau format file.", "error");
  } finally {
    importing.value = false;
    // FIX: Pastikan input file direset agar bisa memilih file yang sama lagi
    if(fileInput.value) fileInput.value.value = "";
  }
};

const downloadTemplate = () => {
  window.location.href = `${API_BASE_URL}/Rekon/DownloadTemplate.php`;
};

// [BARU] Create Logic
const openCreateModal = () => {
  // Reset Form
  createForm.account_no = '';
  createForm.date = new Date().toISOString().substr(0, 10);
  createForm.val_date = new Date().toISOString().substr(0, 10);
  createForm.transaction_code = '';
  createForm.description1 = '';
  createForm.description2 = '';
  createForm.reference_no = '';
  createForm.debit = 0;
  createForm.credit = 0;
  createModalOpen.value = true;
};

const handleCreateSubmit = async () => {
  if(!createForm.account_no || !createForm.transaction_code) {
    showMsg("Account No dan Trx Code wajib diisi", "error");
    return;
  }
  
  creating.value = true;
  try {
    const payload = {
      ...createForm,
      // [FIXED] Kirim User ID sebagai creator untuk manual entry
      created_by: currentUser.id
    };
    
    const res = await fetch(`${API_BASE_URL}/Rekon/Create.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if(json.s) {
      showMsg("Transaksi berhasil ditambahkan", "success");
      createModalOpen.value = false;
      fetchData();
    } else {
      showMsg(json.message || "Gagal menyimpan", "error");
    }
  } catch(e) {
    showMsg("Terjadi kesalahan koneksi saat menyimpan manual.", "error");
  } finally {
    creating.value = false;
  }
};

// Modal Logic (Existing)
const openModal = (item: any, initialStatus: string | null = null) => { // Modified signature
  selectedItem.value = item;
  actionForm.status = initialStatus || item.status;
  actionForm.note = item.note || "";
  // FIX: Pastikan uploadFiles direset di sini untuk menghindari pengiriman file lama yang tidak diinginkan
  uploadFiles.value = [];
  modalOpen.value = true;
};

const handleActionSubmit = async () => {
  if(!selectedItem.value) return;
  submitting.value = true;

  const formData = new FormData();
  formData.append("id", String(selectedItem.value.id));
  formData.append("action", actionForm.status);
  formData.append("note", actionForm.note);
  // [FIXED] Kirim User ID & Name untuk permission check dan log approver
  formData.append("user", authStore.userData?.name || "System");
  formData.append("user_id", String(authStore.userData?.id || 0));

  // FIX: Pastikan file di-append dengan benar
  uploadFiles.value.forEach((file) => formData.append("files[]", file));

  try {
    const res = await fetch(`${API_BASE_URL}/Rekon/Action.php`, { method: "POST", body: formData });
    const json = await res.json();
    if (json.s) {
      showMsg("Status berhasil diperbarui.", "success");
      modalOpen.value = false;
      fetchData();
    } else {
      showMsg(json.message || "Gagal memperbarui status.", "error");
    }
  } catch {
    showMsg("Terjadi kesalahan koneksi saat update status.", "error");
  } finally {
    submitting.value = false;
  }
};

const fmtMoney = (val: number) => val ? val.toLocaleString('id-ID') : '-';

onMounted(fetchData);

// FIX: Bersihkan timer saat komponen dilepas
onBeforeUnmount(() => {
  if (timeout) clearTimeout(timeout);
});
</script>

<template>
  <v-row class="mt-0">
    
            <v-col cols="12" class="d-flex flex-wrap align-center justify-space-between gap-2 py-2">
      <div>
        <h2 class="text-h6 font-weight-bold">Rekonsiliasi Bank</h2>
        <div class="text-caption text-grey">Kelola dan cocokkan transaksi bank internal</div>
      </div>
      <div class="d-flex gap-2 align-center">
        <v-btn variant="outlined" color="secondary" @click="router.push('/rekon/settings')" icon size="small" title="Settings">
          <SettingsIcon size="16" />
        </v-btn>
        <v-btn variant="outlined" color="primary" @click="downloadTemplate" size="small" class="text-caption">
          <DownloadIcon size="16" class="mr-1" /> Template
        </v-btn>
        
        <input type="file" accept=".xlsx, .csv" ref="fileInput" class="d-none" @change="handleFileChange" />
        <v-btn color="success" variant="tonal" @click="handleImportClick" :loading="importing" size="small" class="text-caption">
          <UploadIcon size="16" class="mr-1" /> Import Excel
        </v-btn>

        <v-btn color="primary" @click="openCreateModal" size="small" class="text-caption">
          <PlusIcon size="16" class="mr-1" /> Input Manual
        </v-btn>
      </div>
    </v-col>

            <v-col cols="12" sm="6" md="3" class="py-1">
      <v-card variant="outlined" class="pa-3 compact-summary-card">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">Total Debit</div>
            <div class="text-subtitle-1 font-weight-bold text-green">Rp {{ fmtMoney(stats?.totals.total_debit || 0) }}</div>
          </div>
          <ArrowDownCircleIcon class="text-green-lighten-2" size="24" />
        </div>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3" class="py-1">
      <v-card variant="outlined" class="pa-3 compact-summary-card">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">Total Kredit</div>
            <div class="text-subtitle-1 font-weight-bold text-red">Rp {{ fmtMoney(stats?.totals.total_credit || 0) }}</div>
          </div>
          <ArrowDownCircleIcon class="text-red-lighten-2" size="24" style="transform: rotate(180deg);" />
        </div>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3" class="py-1">
      <v-card variant="outlined" class="pa-3 bg-blue-lighten-5 border-blue compact-summary-card">
        <div class="text-caption text-blue-darken-2">Menunggu (New)</div>
        <div class="text-h6 font-weight-bold text-blue-darken-4">{{ stats?.status_counts.New || 0 }}</div>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3" class="py-1">
      <v-card variant="outlined" class="pa-3 bg-green-lighten-5 border-green compact-summary-card">
        <div class="text-caption text-green-darken-2">Selesai (Approved)</div>
        <div class="text-h6 font-weight-bold text-green-darken-4">{{ stats?.status_counts.Approved || 0 }}</div>
      </v-card>
    </v-col>

            <v-col cols="12" class="py-1">
      <UiParentCard title="Daftar Transaksi" class="compact-card">
        <div class="d-flex flex-wrap gap-2 mb-2 align-center">
          <div style="flex: 1; min-width: 200px;">
            <v-text-field
              v-model="search"
              density="compact"
              variant="outlined"
              label="Cari kode, deskripsi, referensi..."
              hide-details
                            class="small-input"
            >
              <template v-slot:prepend-inner>
                <SearchIcon size="16" class="text-grey" />
              </template>
            </v-text-field>
          </div>
          <div style="width: 150px;">
            <v-select
              v-model="filterStatus"
              :items="['ALL', 'New', 'Approved', 'Rejected']"
              label="Status"
              density="compact"
              variant="outlined"
              hide-details
                            class="small-input"
            ></v-select>
          </div>
          <v-btn variant="text" icon size="small" @click="fetchData" :loading="loading" title="Refresh Data">
            <RefreshIcon size="18" class="text-primary" />
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="list"
          :loading="loading"
          density="compact"
          class="border rounded-md compact-datatable"
        >
          <template v-slot:item.transaction_code="{ item }">
            <span class="font-weight-medium font-mono text-primary text-caption">{{ item.transaction_code }}</span>
          </template>
          <template v-slot:item.account_no="{ item }">
                        <span class="text-caption">{{ item.account_no }}</span>
                    </template>
                    <template v-slot:item.description1="{ item }">
                        <span class="text-caption">{{ item.description1.length > 50 ? item.description1.substring(0, 50) + '...' : item.description1 }}</span>
                    </template>
          <template v-slot:item.debit="{ item }">
            <span v-if="item.debit > 0" class="text-green font-weight-bold text-caption">{{ fmtMoney(item.debit) }}</span>
            <span v-else class="text-caption">-</span>
          </template>
          <template v-slot:item.credit="{ item }">
            <span v-if="item.credit > 0" class="text-red font-weight-bold text-caption">{{ fmtMoney(item.credit) }}</span>
            <span v-else class="text-caption">-</span>
          </template>
          <template v-slot:item.status="{ item }">
            <v-chip 
              size="x-small" 
              class="font-weight-bold text-uppercase"
              :color="item.status === 'New' ? 'blue' : item.status === 'Approved' ? 'green' : 'red'"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template v-slot:item.creator_name="{ item }">
            <span class="text-caption">{{ item.creator_name || '-' }}</span>
          </template>
          <template v-slot:item.updater_name="{ item }">
            <span class="text-caption" :class="{'text-success font-weight-bold': item.status === 'Approved', 'text-red font-weight-bold': item.status === 'Rejected'}">
              {{ item.updater_name && item.status !== 'New' ? item.updater_name : '-' }}
            </span>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <div v-if="item.status === 'New'" class="d-inline-flex">
              <v-btn icon variant="text" size="x-small" color="success" @click="openModal(item, 'Approved')" title="Approve">
                <CheckIcon size="16" />
              </v-btn>
              <v-btn icon variant="text" size="x-small" color="error" @click="openModal(item, 'Rejected')" title="Reject">
                <XIcon size="16" />
              </v-btn>
            </div>
            <v-btn v-else icon variant="text" size="x-small" color="primary" @click="openModal(item)">
              <EyeIcon size="16" />
            </v-btn>
          </template>

        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>

    <v-dialog v-model="createModalOpen" max-width="600" persistent>
    <v-card class="rounded-lg small-dialog-card">
      <v-card-title class="bg-primary text-white d-flex justify-space-between align-center px-4 py-3 text-subtitle-1">
        Input Transaksi Baru
        <v-btn icon variant="text" color="white" size="small" @click="createModalOpen = false"><XIcon size="18"/></v-btn>
      </v-card-title>
      <v-card-text class="pt-4 pb-0">
        <v-row dense>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field v-model="createForm.transaction_code" label="Transaction Code *" variant="outlined" density="compact" hint="Harus Unik" persistent-hint class="small-input"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field v-model="createForm.account_no" label="Account No *" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field v-model="createForm.date" type="date" label="Date *" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field v-model="createForm.val_date" type="date" label="Val. Date" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field v-model.number="createForm.debit" type="number" label="Debit (Rp)" variant="outlined" density="compact" prefix="Rp" hide-details class="small-input text-right-input"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field v-model.number="createForm.credit" type="number" label="Credit (Rp)" variant="outlined" density="compact" prefix="Rp" hide-details class="small-input text-right-input"></v-text-field>
          </v-col>
          <v-col cols="12" class="py-1">
            <v-text-field v-model="createForm.reference_no" label="Reference No." variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
          </v-col>
          <v-col cols="12" class="py-1">
            <v-text-field v-model="createForm.description1" label="Description 1" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
          </v-col>
          <v-col cols="12" class="py-1">
            <v-text-field v-model="createForm.description2" label="Description 2" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="px-4 py-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" color="grey" size="small" @click="createModalOpen = false" class="text-caption">Batal</v-btn>
        <v-btn color="primary" variant="flat" size="small" @click="handleCreateSubmit" :loading="creating" class="text-caption">
          <CheckIcon size="16" class="mr-1"/> Simpan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

    <v-dialog v-model="modalOpen" max-width="500" scrollable>
    <v-card v-if="selectedItem" class="rounded-lg small-dialog-card">
      <v-card-title class="d-flex justify-space-between align-center px-4 py-3 bg-grey-lighten-4 text-subtitle-2">
        <div>
          <div class="font-weight-bold">Detail Transaksi</div>
          <div class="text-caption text-grey">{{ selectedItem.transaction_code }}</div>
        </div>
        <v-btn icon variant="text" size="x-small" @click="modalOpen = false"><XIcon size="16" /></v-btn>
      </v-card-title>
      
      <v-card-text class="pa-4" style="max-height: 60vh;">
        <v-row dense class="text-caption">
          <v-col cols="6" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Account No</div>
            <div class="font-weight-medium">{{ selectedItem.account_no }}</div>
          </v-col>
          <v-col cols="6" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Date | Val. Date</div>
            <div class="font-weight-medium">{{ selectedItem.date }} | {{ selectedItem.val_date }}</div>
          </v-col>
          <v-col cols="12" class="py-1">
            <div class="bg-grey-lighten-5 pa-2 rounded border">
              <div class="text-overline text-medium-emphasis text-xsmall">Description</div>
              <div class="font-weight-medium">{{ selectedItem.description1 }}</div>
              <div class="text-xsmall">{{ selectedItem.description2 }}</div>
            </div>
          </v-col>
          <v-col cols="6" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Debit</div>
            <div class="font-weight-bold text-green text-subtitle-2">{{ fmtMoney(selectedItem.debit) }}</div>
          </v-col>
          <v-col cols="6" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Credit</div>
            <div class="font-weight-bold text-red text-subtitle-2">{{ fmtMoney(selectedItem.credit) }}</div>
          </v-col>
        </v-row>

        <v-divider class="my-3"></v-divider>

        <div v-if="selectedItem.file_list?.length" class="mb-3">
          <div class="text-subtitle-2 mb-2">Lampiran Tersimpan</div>
          <div class="d-flex flex-wrap gap-1">
            <v-btn 
              v-for="(url, idx) in selectedItem.file_list" 
              :key="idx" 
              :href="url" target="_blank" 
              variant="outlined" size="x-small" color="primary" 
              prepend-icon="mdi-file-document-outline"
                            class="text-caption"
            >
              File {{ idx + 1 }}
            </v-btn>
          </div>
        </div>

        <div class="bg-grey-lighten-4 pa-3 rounded">
          <div class="text-subtitle-2 mb-2">Update Status</div>
          <v-row dense>
            <v-col cols="6" class="py-1">
              <v-select 
                v-model="actionForm.status" 
                :items="statusOptions" 
                label="Status" 
                density="compact" 
                variant="outlined" 
                bg-color="white"
                                class="small-input"
              ></v-select>
            </v-col>
            <v-col cols="6" class="py-1">
              <v-file-input 
                v-model="uploadFiles" 
                label="Upload Bukti (Opsional)" 
                multiple 
                density="compact" 
                variant="outlined" 
                bg-color="white"
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                                class="small-input small-file-input"
              ></v-file-input>
            </v-col>
            <v-col cols="12" class="py-1">
              <v-textarea 
                v-model="actionForm.note" 
                label="Catatan / Note" 
                rows="2" 
                density="compact" 
                variant="outlined" 
                bg-color="white"
                                class="small-input small-textarea"
              ></v-textarea>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
            <v-divider></v-divider>
      <v-card-actions class="px-4 py-3">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" color="secondary" size="small" @click="modalOpen = false" class="text-caption">Batal</v-btn>
        <v-btn color="primary" size="small" @click="handleActionSubmit" :loading="submitting" class="text-caption">
          <CheckIcon size="16" class="mr-1" /> Update Status
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3000" class="text-caption">
    {{ snackbar.text }}
    <template v-slot:actions><v-btn variant="text" size="x-small" @click="snackbar.show = false">Tutup</v-btn></template>
  </v-snackbar>
</template>

<style scoped>
/* ======================== GENERAL COMPACT STYLES ======================== */
.font-mono { font-family: 'Roboto Mono', monospace; }
.border-blue { border-left: 3px solid #42a5f5; }
.border-green { border-left: 3px solid #66bb6a; }

/* Global Card & Text */
.compact-card :deep(.v-card-title) {
    font-size: 0.9rem !important;
    padding: 10px 16px !important;
}
.compact-card :deep(.v-card-text) {
    padding: 12px 16px 16px !important;
}
.text-xsmall { font-size: 0.65rem !important; }

/* Summary Card */
.compact-summary-card {
    border: 1px solid rgba(0,0,0,0.12) !important;
}
.compact-summary-card :deep(.text-subtitle-1) {
    font-size: 0.9rem !important;
}
.compact-summary-card :deep(.text-h6) {
    font-size: 1rem !important;
}

/* Data Table */
.compact-datatable :deep(th) {
    font-size: 0.75rem !important;
    height: 35px !important;
}
.compact-datatable :deep(td) {
    font-size: 0.75rem !important;
    height: 38px !important;
}

/* Form Inputs (Used in filter and modals) */
.small-input :deep(.v-field) { min-height: 36px !important; }
.small-input :deep(.v-label) { font-size: 0.8rem; }
.small-input :deep(input) { font-size: 0.8rem; }
.text-right-input :deep(input) { text-align: right; }
.text-right-input :deep(.v-field__prefix) { font-size: 0.8rem; }

/* Textarea input (in modal) */
.small-textarea :deep(.v-field__input) { 
    padding-top: 6px !important; 
    padding-bottom: 6px !important; 
    min-height: 50px !important; 
    font-size: 0.8rem; 
}
.small-textarea :deep(.v-label) { font-size: 0.8rem; }

/* File Input (in modal) */
.small-file-input :deep(.v-field) { 
    min-height: 36px !important; 
}
.small-file-input :deep(.v-field__input) {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
}
.small-file-input :deep(.v-field__input) div {
    font-size: 0.75rem !important; 
}
.small-file-input :deep(.v-field-label--floating) { 
    font-size: 0.7rem; 
    transform: translateY(-100%) scale(0.75); 
}

/* Modal Styling (Matching Kasbon) */
.small-dialog-card :deep(.v-card-title) {
    padding: 10px 16px !important;
}
.small-dialog-card :deep(.v-card-text) {
    padding: 12px 16px !important;
}
</style>