<script setup lang="ts">
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
  CheckIcon,
  XIcon,
  PlusIcon,
  CalendarIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";
const router = useRouter();
const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement | null>(null);
const currentUser = authStore.userData;
const createFormRef = ref<any>(null);

const loading = ref(false);
const list = ref<any[]>([]);
const stats = ref<any>(null);
const search = ref("");
const filterStatus = ref("ALL");
const importing = ref(false);
const filterDate = reactive({ from: '', to: '' });

let timeout: ReturnType<typeof setTimeout> | null = null; 

const modalOpen = ref(false);
const selectedItem = ref<any>(null);
const actionForm = reactive({ status: '', note: '' });
const uploadFiles = ref<File[]>([]);
const submitting = ref(false);

const createModalOpen = ref(false);
const creating = ref(false);
const createForm = reactive({
  post_date: new Date().toISOString().substr(0, 10),
  eff_date: new Date().toISOString().substr(0, 10),
  cheque_no: '',
  description: '',
  debit: 0,
  credit: 0,
  balance: 0,
  transaction_code: '',
  reference_no: '',
  payment_type: '',
  bank_reference: ''
});

const deleteDialog = ref(false);
const itemToDelete = ref<any>(null);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

const requiredRule = [(v: any) => !!v || 'Field ini wajib diisi'];
const requiredDateRule = [(v: any) => !!v || 'Tanggal wajib diisi'];

const headers = [
  { title: 'No', key: 'line_no', align: 'start' as const, width: '50px' },
  { title: 'Post Date', key: 'post_date', align: 'start' as const, width: '120px' },
  { title: 'Eff Date', key: 'eff_date', align: 'start' as const, width: '120px' },
  { title: 'Cheque No', key: 'cheque_no', align: 'start' as const, width: '100px' },
  { title: 'Description', key: 'description', align: 'start' as const, width: '300px' },
  { title: 'Debit', key: 'debit', align: 'end' as const, width: '120px' },
  { title: 'Credit', key: 'credit', align: 'end' as const, width: '120px' },
  { title: 'Balance', key: 'balance', align: 'end' as const, width: '120px' },
  { title: 'Transaction', key: 'transaction_code', align: 'start' as const, width: '150px' },
  { title: 'Ref no', key: 'reference_no', align: 'start' as const, width: '100px' },
  { title: 'Pymt Type', key: 'payment_type', align: 'start' as const, width: '120px' },
  { title: 'Bank Ref', key: 'bank_reference', align: 'start' as const, width: '120px' },
  { title: 'Status', key: 'status', align: 'center' as const, width: '80px' },
  { title: 'Created By', key: 'creator_name', align: 'start' as const, width: '100px' },
  { title: 'Approved By', key: 'updater_name', align: 'start' as const, width: '100px' },
  { title: 'Action', key: 'actions', align: 'center' as const, sortable: false, width: '100px' },
];

const statusOptions = ['New', 'Approved', 'Rejected'];

const fetchData = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
        q: search.value,
        status: filterStatus.value,
        from_date: filterDate.from,
        to_date: filterDate.to
    });

    const resList = await fetch(`${API_BASE_URL}/Rekon/ListCimb.php?${params.toString()}`);
    const jsonList = await resList.json();
    if(jsonList.s) list.value = jsonList.d;
    else list.value = []; 

    const resStats = await fetch(`${API_BASE_URL}/Rekon/DashboardCimb.php`);
    const jsonStats = await resStats.json();
    if(jsonStats.s) stats.value = jsonStats.d;
    else stats.value = null; 
  } catch (e) {
    showMsg("Gagal memuat data CIMB.", "error"); 
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const fetchDataDebounced = () => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(fetchData, 500);
}

watch([search, filterStatus, filterDate], fetchDataDebounced, { deep: true });

const handleImportClick = () => fileInput.value?.click();
const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const formData = new FormData();
  formData.append("file", file);
  
  if(currentUser && currentUser.id) {
    formData.append('user_id', currentUser.id);
  }

  importing.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Rekon/ImportCimb.php`, { method: "POST", body: formData });
    const json = await res.json();
    if (json.s) {
      showMsg(json.message, "success");
      fetchData();
    } else {
      showMsg(json.message || "Gagal melakukan import CIMB.", "error");
    }
  } catch {
    showMsg("Gagal upload file. Periksa koneksi atau format file.", "error");
  } finally {
    importing.value = false;
    if(fileInput.value) fileInput.value.value = "";
  }
};

const downloadTemplate = () => {
  window.location.href = `${API_BASE_URL}/Rekon/DownloadTemplateCimb.php`;
};

const exportData = () => {
    const params = new URLSearchParams({
        from_date: filterDate.from,
        to_date: filterDate.to
    });
    window.location.href = `${API_BASE_URL}/Rekon/ExportExcelCimb.php?${params.toString()}`;
};

const openCreateModal = () => {
  Object.assign(createForm, {
    post_date: new Date().toISOString().substr(0, 10),
    eff_date: new Date().toISOString().substr(0, 10),
    cheque_no: '',
    description: '',
    debit: 0,
    credit: 0,
    balance: 0,
    transaction_code: '',
    reference_no: '',
    payment_type: '',
    bank_reference: ''
  });
  createModalOpen.value = true;
};

const handleCreateSubmit = async () => {
  const { valid } = await createFormRef.value.validate();
  if (!valid) {
    showMsg("Harap lengkapi semua field wajib (*)", "error");
    return;
  }
  
  creating.value = true;
  try {
    const payload = {
      ...createForm,
      // line_no dihilangkan dari payload karena diisi otomatis di backend
      created_by: currentUser?.id || 0
    };
    
    const res = await fetch(`${API_BASE_URL}/Rekon/CreateCimb.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if(json.s) {
      showMsg("Transaksi CIMB berhasil ditambahkan", "success");
      createModalOpen.value = false;
      fetchData();
    } else {
      showMsg(json.message || "Gagal menyimpan transaksi CIMB", "error");
    }
  } catch(e) {
    showMsg("Terjadi kesalahan koneksi server. Cek log server atau pastikan API CreateCimb.php berjalan normal.", "error");
  } finally {
    creating.value = false;
  }
};

const openModal = (item: any, initialStatus: string | null = null) => {
  selectedItem.value = item;
  actionForm.status = initialStatus || item.status;
  actionForm.note = item.note || "";
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
  formData.append("user", authStore.userData?.name || "System");
  formData.append("user_id", String(authStore.userData?.id || 0));

  uploadFiles.value.forEach((file) => formData.append("files[]", file));

  try {
    const res = await fetch(`${API_BASE_URL}/Rekon/ActionCimb.php`, { method: "POST", body: formData });
    const json = await res.json();
    if (json.s) {
      showMsg("Status CIMB berhasil diperbarui.", "success");
      modalOpen.value = false;
      fetchData();
    } else {
      showMsg(json.message || "Gagal memperbarui status CIMB.", "error");
    }
  } catch {
    showMsg("Terjadi kesalahan koneksi saat update status.", "error");
  } finally {
    submitting.value = false;
  }
};

const openDeleteDialog = (item: any) => {
    itemToDelete.value = item;
    deleteDialog.value = true;
};

const handleDelete = async () => {
    if (!itemToDelete.value) return;
    try {
        const res = await fetch(`${API_BASE_URL}/Rekon/DeleteCimb.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemToDelete.value.id })
        });
        const json = await res.json();
        
        if (json.s) {
            showMsg(json.message, "success");
            deleteDialog.value = false;
            fetchData();
        } else {
            showMsg(json.message || "Gagal menghapus data.", "error");
        }
    } catch (e: any) {
        showMsg(e.message || "Gagal menghapus", "error");
    }
};

const fmtMoney = (val: number) => {
  if (val === undefined || val === null) return '-';
  // Format mata uang Rupiah: Rp 100.000,00
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(val).replace('IDR', 'Rp');
};
const fmtDate = (val: string) => {
    if (!val) return '-';
    const datePart = val.split(' ')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
};

onMounted(fetchData);

onBeforeUnmount(() => {
  if (timeout) clearTimeout(timeout);
});
</script>

<template>
  <v-row class="mt-0">
    
    <v-col cols="12" class="d-flex flex-wrap align-center justify-space-between gap-2 py-2">
      <div>
        <h2 class="text-h6 font-weight-bold">Rekonsiliasi Bank CIMB Niaga</h2>
        <div class="text-caption text-grey">Kelola dan cocokkan transaksi bank CIMB Niaga</div>
      </div>
      <div class="d-flex gap-2 align-center">
      
        <v-btn variant="outlined" color="success" @click="exportData" size="small" class="text-caption">
          <DownloadIcon size="16" class="mr-1" /> Export Data
        </v-btn>
        <v-btn variant="outlined" color="primary" @click="downloadTemplate" size="small" class="text-caption">
          <DownloadIcon size="16" class="mr-1" /> Template CIMB
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
            <div class="text-subtitle-1 font-weight-bold text-green">{{ fmtMoney(stats?.totals.total_debit || 0) }}</div>
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
            <div class="text-subtitle-1 font-weight-bold text-red">{{ fmtMoney(stats?.totals.total_credit || 0) }}</div>
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
      <UiParentCard title="Daftar Transaksi CIMB Niaga" class="compact-card">
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
            <v-text-field
                v-model="filterDate.from"
                type="date"
                label="Dari Tanggal"
                density="compact"
                variant="outlined"
                hide-details
                class="small-input"
            >
              <template v-slot:prepend-inner>
                <CalendarIcon size="16" class="text-grey" />
              </template>
            </v-text-field>
          </div>
          <div style="width: 150px;">
            <v-text-field
                v-model="filterDate.to"
                type="date"
                label="Sampai Tanggal"
                density="compact"
                variant="outlined"
                hide-details
                class="small-input"
            >
              <template v-slot:prepend-inner>
                <CalendarIcon size="16" class="text-grey" />
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

        <div class="v-data-table-container-scrollable">
            <v-data-table
              :headers="headers"
              :items="list"
              :loading="loading"
              density="compact"
              class="border rounded-md compact-datatable"
              :items-per-page="50"
              fixed-header
              style="min-width: 2600px;" 
            >
              <template v-slot:item.line_no="{ item }">
                <span class="text-caption font-weight-bold">{{ item.line_no }}</span>
              </template>
              <template v-slot:item.post_date="{ item }">
                <span class="text-caption">{{ fmtDate(item.post_date) }}</span>
              </template>
              <template v-slot:item.eff_date="{ item }">
                <span class="text-caption">{{ fmtDate(item.eff_date) }}</span>
              </template>
              <template v-slot:item.cheque_no="{ item }">
                <span class="text-caption">{{ item.cheque_no || '-' }}</span>
              </template>
              <template v-slot:item.description="{ item }">
                <span class="text-caption">{{ item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description }}</span>
              </template>
              <template v-slot:item.debit="{ item }">
                <span v-if="item.debit > 0" class="text-green font-weight-bold text-caption">{{ fmtMoney(item.debit) }}</span>
                <span v-else class="text-caption">-</span>
              </template>
              <template v-slot:item.credit="{ item }">
                <span v-if="item.credit > 0" class="text-red font-weight-bold text-caption">{{ fmtMoney(item.credit) }}</span>
                <span v-else class="text-caption">-</span>
              </template>
              <template v-slot:item.balance="{ item }">
                <span class="font-weight-bold text-caption">{{ fmtMoney(item.balance) }}</span>
              </template>
              <template v-slot:item.transaction_code="{ item }">
                <span class="font-weight-medium font-mono text-primary text-caption">{{ item.transaction_code }}</span>
              </template>
              <template v-slot:item.reference_no="{ item }">
                <span class="text-caption">{{ item.reference_no || '-' }}</span>
              </template>
              <template v-slot:item.payment_type="{ item }">
                <span class="text-caption">{{ item.payment_type || '-' }}</span>
              </template>
              <template v-slot:item.bank_reference="{ item }">
                <span class="text-caption">{{ item.bank_reference || '-' }}</span>
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
                <div class="d-inline-flex">
                  <template v-if="item.status === 'New'">
                    <v-btn icon variant="text" size="x-small" color="success" @click="openModal(item, 'Approved')" title="Approve">
                      <CheckIcon size="16" />
                    </v-btn>
                    <v-btn icon variant="text" size="x-small" color="error" @click="openModal(item, 'Rejected')" title="Reject">
                      <XIcon size="16" />
                    </v-btn>
                    <v-btn icon variant="text" size="x-small" color="error" @click="openDeleteDialog(item)" title="Hapus">
                        <XIcon size="16" />
                    </v-btn>
                  </template>
                  <v-btn v-else icon variant="text" size="x-small" color="primary" @click="openModal(item)">
                    <EyeIcon size="16" />
                  </v-btn>
                </div>
              </template>

            </v-data-table>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-dialog v-model="createModalOpen" max-width="700" persistent>
    <v-card class="rounded-lg small-dialog-card">
      <v-card-title class="bg-primary text-white d-flex justify-space-between align-center px-4 py-3 text-subtitle-1">
        Input Transaksi CIMB Baru
        <v-btn icon variant="text" color="white" size="small" @click="createModalOpen = false"><XIcon size="18"/></v-btn>
      </v-card-title>
      <v-form ref="createFormRef" @submit.prevent="handleCreateSubmit">
        <v-card-text class="pt-4 pb-0">
          <v-row dense>
            <v-col cols="12" md="6" class="py-1">
              <v-text-field v-model="createForm.post_date" type="date" label="Post Date *" variant="outlined" density="compact" hide-details class="small-input" :rules="requiredDateRule"></v-text-field>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-text-field v-model="createForm.eff_date" type="date" label="Eff Date" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
            </v-col>

            <v-col cols="12" md="4" class="py-1">
              <v-text-field v-model="createForm.cheque_no" label="Cheque No" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="py-1">
              <v-text-field v-model="createForm.payment_type" label="Payment Type" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="py-1">
              <v-text-field v-model="createForm.bank_reference" label="Bank Reference" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
            </v-col>

            <v-col cols="12" class="py-1">
              <v-textarea v-model="createForm.description" label="Description" rows="2" density="compact" variant="outlined" hide-details class="small-input small-textarea"></v-textarea>
            </v-col>
            
            <v-col cols="12" md="4" class="py-1">
              <v-text-field v-model.number="createForm.debit" type="number" label="Debit (Rp)" variant="outlined" density="compact" prefix="Rp" hide-details class="small-input text-right-input"></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="py-1">
              <v-text-field v-model.number="createForm.credit" type="number" label="Credit (Rp)" variant="outlined" density="compact" prefix="Rp" hide-details class="small-input text-right-input"></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="py-1">
              <v-text-field v-model.number="createForm.balance" type="number" label="Balance (Rp)" variant="outlined" density="compact" prefix="Rp" hint="Saldo Akhir" persistent-hint class="small-input text-right-input"></v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <v-text-field v-model="createForm.transaction_code" label="Transaction (Unique ID) *" variant="outlined" density="compact" persistent-hint class="small-input" :rules="requiredRule"></v-text-field>
            </v-col>
            <v-col cols="12" md="6" class="py-1">
              <v-text-field v-model="createForm.reference_no" label="Ref no" variant="outlined" density="compact" hide-details class="small-input"></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="px-4 py-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" size="small" @click="createModalOpen = false" class="text-caption">Batal</v-btn>
          <v-btn color="primary" variant="flat" size="small" type="submit" :loading="creating" class="text-caption">
            <CheckIcon size="16" class="mr-1"/> Simpan
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <v-dialog v-model="modalOpen" max-width="500" scrollable>
    <v-card v-if="selectedItem" class="rounded-lg small-dialog-card">
      <v-card-title class="d-flex justify-space-between align-center px-4 py-3 bg-grey-lighten-4 text-subtitle-2">
        <div>
          <div class="font-weight-bold">Detail Transaksi CIMB</div>
          <div class="text-caption text-grey">{{ selectedItem.transaction_code }}</div>
        </div>
        <v-btn icon variant="text" size="x-small" @click="modalOpen = false"><XIcon size="16" /></v-btn>
      </v-card-title>
      
      <v-card-text class="pa-4" style="max-height: 60vh;">
        <v-row dense class="text-caption">
          
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">No (Line No)</div>
            <div class="font-weight-medium">{{ selectedItem.line_no || '-' }}</div>
          </v-col>
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Post Date</div>
            <div class="font-weight-medium">{{ fmtDate(selectedItem.post_date) }}</div>
          </v-col>
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Eff Date</div>
            <div class="font-weight-medium">{{ fmtDate(selectedItem.eff_date) }}</div>
          </v-col>

          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Cheque No</div>
            <div class="font-weight-medium">{{ selectedItem.cheque_no || '-' }}</div>
          </v-col>
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Payment Type</div>
            <div class="font-weight-medium">{{ selectedItem.payment_type || '-' }}</div>
          </v-col>
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Bank Ref</div>
            <div class="font-weight-medium">{{ selectedItem.bank_reference || '-' }}</div>
          </v-col>

          <v-col cols="12" class="py-1">
            <div class="bg-grey-lighten-5 pa-2 rounded border">
              <div class="text-overline text-medium-emphasis text-xsmall">Description</div>
              <div class="font-weight-medium">{{ selectedItem.description }}</div>
            </div>
          </v-col>
          
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Debit</div>
            <div class="font-weight-bold text-green text-subtitle-2">{{ fmtMoney(selectedItem.debit) }}</div>
          </v-col>
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Credit</div>
            <div class="font-weight-bold text-red text-subtitle-2">{{ fmtMoney(selectedItem.credit) }}</div>
          </v-col>
          <v-col cols="4" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Balance</div>
            <div class="font-weight-bold text-primary text-subtitle-2">{{ fmtMoney(selectedItem.balance) }}</div>
          </v-col>

          <v-col cols="6" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Transaction Code</div>
            <div class="font-weight-medium">{{ selectedItem.transaction_code }}</div>
          </v-col>
          <v-col cols="6" class="py-1">
            <div class="text-overline text-medium-emphasis text-xsmall">Ref No</div>
            <div class="font-weight-medium">{{ selectedItem.reference_no || '-' }}</div>
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
                :disabled="selectedItem.status === 'Approved'"
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
                :disabled="selectedItem.status === 'Approved'"
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
                :disabled="selectedItem.status === 'Approved'"
              ></v-textarea>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="px-4 py-3">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" color="secondary" size="small" @click="modalOpen = false" class="text-caption">Tutup</v-btn>
        <v-btn 
          v-if="selectedItem.status !== 'Approved'"
          color="primary" 
          size="small" 
          @click="handleActionSubmit" 
          :loading="submitting" 
          class="text-caption"
        >
          <CheckIcon size="16" class="mr-1" /> Update Status
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="400">
        <v-card class="rounded-lg">
            <v-card-title class="text-h6 text-error">Konfirmasi Hapus</v-card-title>
            <v-card-text>
                Anda yakin ingin menghapus transaksi CIMB dengan kode 
                <span class="font-weight-bold">{{ itemToDelete?.transaction_code }}</span>?
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="deleteDialog = false">Batal</v-btn>
                <v-btn color="error" variant="flat" @click="handleDelete">Hapus</v-btn>
            </v-card-actions>
        </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3000" class="text-caption">
    {{ snackbar.text }}
    <template v-slot:actions><v-btn variant="text" size="x-small" @click="snackbar.show = false">Tutup</v-btn></template>
  </v-snackbar>
</template>

<style scoped>
.font-mono { font-family: 'Roboto Mono', monospace; }
.border-blue { border-left: 3px solid #42a5f5; }
.border-green { border-left: 3px solid #66bb6a; }

.compact-card :deep(.v-card-title) {
    font-size: 0.9rem !important;
    padding: 10px 16px !important;
}
.compact-card :deep(.v-card-text) {
    padding: 12px 16px 16px !important;
}
.text-xsmall { font-size: 0.65rem !important; }

.v-data-table-container-scrollable {
    overflow-x: auto;
}

.compact-summary-card {
    border: 1px solid rgba(0,0,0,0.12) !important;
}
.compact-summary-card :deep(.text-subtitle-1) {
    font-size: 0.9rem !important;
}
.compact-summary-card :deep(.text-h6) {
    font-size: 1rem !important;
}

.compact-datatable :deep(th) {
    font-size: 0.75rem !important;
    height: 35px !important;
    white-space: nowrap; 
}
.compact-datatable :deep(td) {
    font-size: 0.75rem !important;
    height: 38px !important;
    white-space: nowrap;
}

.small-input :deep(.v-field) { min-height: 36px !important; }
.small-input :deep(.v-label) { font-size: 0.8rem; }
.small-input :deep(input) { font-size: 0.8rem; }
.text-right-input :deep(input) { text-align: right; }
.text-right-input :deep(.v-field__prefix) { font-size: 0.8rem; }

.small-textarea :deep(.v-field__input) { 
    padding-top: 6px !important; 
    padding-bottom: 6px !important; 
    min-height: 50px !important; 
    font-size: 0.8rem; 
}
.small-textarea :deep(.v-label) { font-size: 0.8rem; }

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

.small-dialog-card :deep(.v-card-title) {
    padding: 10px 16px !important;
}
.small-dialog-card :deep(.v-card-text) {
    padding: 12px 16px !important;
}
</style>