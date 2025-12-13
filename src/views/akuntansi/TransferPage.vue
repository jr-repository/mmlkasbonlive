<script setup lang="ts">
// FIX: Tambahkan onBeforeUnmount
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth'; // Import Store
import UiParentCard from '@/components/shared/UiParentCard.vue';
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
  ArrowsLeftRightIcon, 
  EyeIcon, 
  RefreshIcon, 
  ArrowRightIcon, 
  BuildingBankIcon,
  SendIcon,
  XIcon,
  CalendarEventIcon,
  ArrowsTransferDownIcon,
  PlusIcon, // Tambahkan PlusIcon
  SearchIcon // Tambahkan SearchIcon untuk input
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";
const authStore = useAuthStore(); // Init Store

// FIX: Pindahkan deklarasi timer ke lingkup script setup
let searchTimeout: ReturnType<typeof setTimeout> | null = null; 

// STATE
const loadingList = ref(false);
const transferList = ref<any[]>([]);
const search = ref(''); // State search untuk konsistensi UI

const headers = [
  { title: 'No', key: 'index', align: 'center' as const, sortable: false },
  { title: 'Transfer #', key: 'number', align: 'start' as const },
  { title: 'From / To', key: 'banks', align: 'start' as const },
  { title: 'Date', key: 'transDate', align: 'start' as const },
  { title: 'Amount', key: 'amount', align: 'end' as const },
  { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false },
];

const form = reactive({
  transDate: format(new Date(), 'yyyy-MM-dd'),
  fromBankId: null as number | null,
  fromBankName: '',
  toBankId: null as number | null,
  toBankName: '',
  amount: 0,
  description: ''
});
const saving = ref(false);

const dialogForm = ref(false); // STATE BARU UNTUK MODAL FORM
const dialogDetail = ref(false);
const detailData = ref<any>(null);
const loadingDetail = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

// LOGIC UNTUK RESET FORM SAAT MODAL DITUTUP ATAU SUBMIT SUKSES
const resetForm = () => {
    form.transDate = format(new Date(), 'yyyy-MM-dd');
    form.fromBankId = null;
    form.fromBankName = '';
    form.toBankId = null;
    form.toBankName = '';
    form.amount = 0;
    form.description = '';
    dialogForm.value = false;
}

// METHODS
const fetchList = async () => {
  loadingList.value = true;
  try {
    const url = new URL(`${API_BASE_URL}/Transfer/List.php`);
    if (search.value) url.searchParams.append("q", search.value);
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.s && Array.isArray(json.d)) transferList.value = json.d.map((x:any,i:number) => ({...x, index: i+1}));
    else transferList.value = [];
  } catch { 
    transferList.value = []; 
    // FIX: Tambahkan error handling notifikasi
    showMsg('Gagal memuat daftar transfer.', 'error');
  } 
  finally { loadingList.value = false; }
};

// FIX: Buat fungsi debounce untuk watch
const fetchListDebounced = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchList, 600);
}

// Search Watcher
// FIX: Gunakan fungsi debounced
watch(search, fetchListDebounced);

const handleSubmit = async () => {
  if(!form.fromBankId || !form.toBankId) return showMsg('Pilih Bank Asal & Tujuan', 'error');
  if(form.fromBankId === form.toBankId) return showMsg('Bank Asal & Tujuan tidak boleh sama', 'error');
  if(form.amount <= 0) return showMsg('Masukkan jumlah transfer', 'error');

  saving.value = true;
  try {
    const payload = {
      transDate: format(new Date(form.transDate), 'dd/MM/yyyy'),
      fromBankId: form.fromBankId,
      toBankId: form.toBankId,
      amount: form.amount,
      description: form.description || "Transfer Antar Bank",
      user_id: authStore.userData?.id,
      user_name: authStore.userData?.name
    };
    const res = await fetch(`${API_BASE_URL}/Transfer/Transaksi.php`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    const json = await res.json();
    if(json.s) {
      showMsg('Transfer Berhasil');
      resetForm(); // Menggunakan resetForm baru
      fetchList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // FIX: Penanganan error dari backend
      showMsg(json.d?.message || json.message || 'Gagal menyimpan transaksi.', 'error');
    }
  } catch { showMsg('Error koneksi saat menyimpan transaksi.', 'error'); } 
  finally { saving.value = false; }
};

const openDetail = async (id: number) => {
  dialogDetail.value = true;
  loadingDetail.value = true;
  detailData.value = null;
  try {
    const res = await fetch(`${API_BASE_URL}/Transfer/Detail.php?id=${id}`);
    const json = await res.json();
    if(json.s) detailData.value = json.d;
    else showMsg('Gagal memuat detail transaksi.', 'error'); // FIX: Tambahkan error handling
  } catch { showMsg('Error koneksi saat memuat detail.', 'error'); }
  finally { loadingDetail.value = false; }
};

onMounted(fetchList);

// FIX: Bersihkan timer saat komponen dilepas
onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>

<template>
    <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">
            Bank Transfer Management
          </h2>
          <div class="text-caption text-white opacity-90">
            Manage funds movement between internal accounts.
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
            <ArrowsLeftRightIcon size="18" class="text-white mr-1" />
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-white">Transfer History</h3>
              <div class="text-caption text-white opacity-80">All inter-account transactions</div>
            </div>
          </div>
          
          <div class="d-flex align-center gap-1">
                        <v-btn 
              color="success" 
              variant="flat" 
              size="small"
              @click="dialogForm = true"
              class="text-none font-weight-bold text-caption mr-2"
            >
              <PlusIcon size="18" class="mr-1"/> New Transfer
            </v-btn>

            <v-text-field
              v-model="search"
              density="compact"
              variant="solo-filled"
              label="Search Data..."
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
          :items="transferList" 
          :loading="loadingList" 
          density="compact" 
          class="rounded-0 compact-data-table"
          hover
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

          <template v-slot:item.number="{ item }">
            <span class="font-weight-bold text-primary text-caption">{{ item.number }}</span>
          </template>
          <template v-slot:item.transDate="{ item }">
            <span class="text-caption">{{ item.transDate }}</span>
          </template>
          <template v-slot:item.amount="{ item }">
            <span class="text-primary font-weight-bold text-caption">Rp {{ Number(item.amount).toLocaleString('id-ID') }}</span>
          </template>

          <template v-slot:item.banks="{ item }">
            <div class="py-2 text-caption">
              <div class="d-flex align-center mb-1 text-grey-darken-1">
                <v-icon size="small" class="mr-1">mdi-bank-minus</v-icon>
                <span class="font-weight-medium">{{ item.fromBankName }}</span>
              </div>
              <div class="ml-1 pl-3 border-s-md border-opacity-25" style="border-color: #ccc;">
                <div class="d-flex align-center text-primary">
                  <ArrowRightIcon size="12" class="mr-1"/> 
                  <span class="font-weight-bold">TO</span>
                  <v-icon size="small" class="mx-1" color="grey">mdi-bank-plus</v-icon>
                  <span class="font-weight-bold">{{ item.toBankName }}</span>
                </div>
              </div>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" color="primary" size="x-small" @click="openDetail(item.id)">
              <EyeIcon size="16"/>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
  </v-row>

    <v-dialog v-model="dialogForm" max-width="600" transition="dialog-bottom-transition" scrollable @after-leave="resetForm">
        <v-card class="rounded-lg overflow-hidden small-dialog-card">
            <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
                <div class="d-flex align-center gap-2">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <SendIcon size="16" class="text-primary" />
                    </div>
                    <div>
                        <span class="text-subtitle-1 font-weight-bold text-white d-block" style="line-height: 1.2;">New Fund Transfer</span>
                        <span class="text-caption text-white opacity-80 font-weight-normal">Record inter-account movement</span>
                    </div>
                </div>
                <v-btn icon variant="text" color="white" size="small" @click="dialogForm = false">
                    <XIcon size="18" />
                </v-btn>
            </div>

            <v-card-text class="pa-4 bg-grey-lighten-5">
                <v-row>
                    <v-col cols="12" md="6" class="py-1">
                        <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Transaction Info</h6>
                        <v-text-field 
                            v-model="form.transDate" 
                            type="date" 
                            label="Transaction Date *" 
                            variant="outlined" 
                            density="compact"
                            hide-details
                            prepend-inner-icon="mdi-calendar"
                            class="mb-2 small-input"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="py-1">
                        <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Transfer Amount</h6>
                        <v-text-field 
                            v-model.number="form.amount" 
                            type="number" 
                            label="Nominal Transfer (Rp) *"
                            variant="outlined" 
                            density="compact" 
                            prefix="Rp"
                            hide-details
                            class="text-right-input font-weight-bold small-input"
                        ></v-text-field>
                    </v-col>
                </v-row>
                
                <v-card variant="outlined" class="bg-white pa-3 mt-4">
                    <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Account Selection</h6>
                    <AsyncSelect 
                        label="From Account (Source) *" 
                        :apiEndpoint="`${API_BASE_URL}/Transfer/MasterGlAccount.php`" filterType="CASH_BANK"
                        v-model="form.fromBankName" item-title="name" item-value="name"
                        @update:model-value="(val: any) => form.fromBankName = val"
                        @change="(o: any) => { if(o) { form.fromBankId = o.id; form.fromBankName = o.name; } }"
                        density="compact"
                        hide-details
                        class="mb-3 small-input"
                    >
                        <template v-slot:prepend-inner>
                            <BuildingBankIcon size="16" class="text-error"/>
                        </template>
                    </AsyncSelect>
                    
                    <div class="d-flex justify-center my-2 text-medium-emphasis">
                        <ArrowsTransferDownIcon size="20"/>
                    </div>

                    <AsyncSelect 
                        label="To Account (Destination) *" 
                        :apiEndpoint="`${API_BASE_URL}/Transfer/MasterGlAccount.php`" filterType="CASH_BANK"
                        v-model="form.toBankName" item-title="name" item-value="name"
                        @update:model-value="(val: any) => form.toBankName = val"
                        @change="(o: any) => { if(o) { form.toBankId = o.id; form.toBankName = o.name; } }"
                        density="compact"
                        hide-details
                        class="small-input"
                    >
                        <template v-slot:prepend-inner>
                            <BuildingBankIcon size="16" class="text-success"/>
                        </template>
                    </AsyncSelect>
                </v-card>

                <v-textarea 
                    label="Description / Notes" 
                    placeholder="e.g. Setor tunai ke bank..."
                    v-model="form.description" 
                    variant="outlined" 
                    rows="2"
                    density="compact"
                    hide-details
                    class="mt-3 small-input small-textarea"
                ></v-textarea>
            </v-card-text>
            
            <v-divider></v-divider>

            <v-card-actions class="bg-white pa-3 justify-end">
                <v-btn variant="outlined" color="secondary" size="small" @click="dialogForm = false; resetForm()" class="px-4 text-caption">Cancel</v-btn>
                <v-btn color="primary" size="small" variant="flat" @click="handleSubmit" :loading="saving" class="px-4 ml-1 text-caption">
                    <ArrowsLeftRightIcon size="16" class="mr-1"/> Process Transfer
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

      <v-dialog v-model="dialogDetail" max-width="500" transition="dialog-bottom-transition" scrollable>
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <div class="bg-white rounded-circle pa-1 d-flex">
            <ArrowsLeftRightIcon size="16" class="text-primary" />
          </div>
          <div>
            <span class="text-subtitle-1 font-weight-bold text-white d-block" style="line-height: 1.2;">Transaction Detail</span>
          </div>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialogDetail = false">
                    <XIcon size="18" />
                </v-btn>
      </div>

      <v-card-text v-if="loadingDetail" class="text-center py-6 bg-grey-lighten-5">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <div class="mt-2 text-caption text-medium-emphasis">Mengambil data detail...</div>
      </v-card-text>

      <v-card-text v-else-if="detailData" class="pa-4 bg-grey-lighten-5 dialog-detail-content">
                <div class="bg-white pa-4 rounded-lg border">
                    <div class="text-center">
                        <div class="text-overline text-medium-emphasis mb-1 text-xsmall">Transfer Amount</div>
                        <div class="text-h5 font-weight-bold text-primary mb-2">
                            Rp {{ (detailData.amount || detailData.fromBankAmount || 0).toLocaleString('id-ID') }}
                        </div>
                        
                        <div class="d-flex justify-center align-center gap-2 mb-4">
                            <v-chip size="x-small" variant="outlined" color="grey-darken-1" class="font-mono text-caption">
                                #{{ detailData.number }}
                            </v-chip>
                            <div class="text-caption text-grey d-flex align-center">
                                <CalendarEventIcon size="14" class="mr-1"/>
                                <span>{{ detailData.transDate }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <v-card variant="flat" class="pa-0 overflow-hidden bg-grey-lighten-5">
                        <v-row dense>
                            <v-col cols="6" class="pa-3 border-e-sm text-center">
                                <div class="text-caption font-weight-bold text-error mb-1">SOURCE (DEBIT)</div>
                                <div class="text-body-2 font-weight-bold text-truncate">{{ detailData.fromBank?.name }}</div>
                                <div class="text-xsmall text-grey font-mono">{{ detailData.fromBank?.no }}</div>
                            </v-col>
                            <v-col cols="6" class="pa-3 text-center">
                                <div class="text-caption font-weight-bold text-success mb-1">DESTINATION (CREDIT)</div>
                                <div class="text-body-2 font-weight-bold text-truncate">{{ detailData.toBank?.name }}</div>
                                <div class="text-xsmall text-grey font-mono">{{ detailData.toBank?.no }}</div>
                            </v-col>
                        </v-row>
                    </v-card>
                    <div class="pa-3 bg-white text-left border rounded-lg mt-3">
                        <div class="text-caption font-weight-bold text-grey-darken-1 mb-1">DESCRIPTION</div>
                        <div class="text-caption font-italic text-medium-emphasis">{{ detailData.description || 'No description provided' }}</div>
                    </div>
                </div>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="bg-white pa-3 justify-end">
        <v-btn variant="outlined" color="primary" size="small" @click="dialogDetail=false" class="px-4 text-caption">Close Detail</v-btn>
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
:deep(th) {
  background-color: transparent !important;
}

/* Helpers */
.font-mono { font-family: 'Roboto Mono', monospace; }
.text-right-input :deep(input) { text-align: right; }
.border-dashed { border-style: dashed !important; }
.border-none { border: none !important; box-shadow: none !important; }

/* Global Compact UI Styles (Copied from previous requests) */
.compact-header-card {
    margin-bottom: 1rem !important;
}
.compact-data-card :deep(.v-data-table__td) {
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
.small-textarea :deep(.v-field__input) {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  min-height: 50px !important;
}

/* Search Input inside colored bar */
.small-search-input :deep(.v-field) {
  min-height: 36px !important;
}
.small-search-input :deep(.v-field__input) {
  font-size: 0.8rem;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  min-height: 30px !important;
  height: 30px !important;
}
.small-search-input :deep(.v-label) {
  font-size: 0.8rem;
  top: 6px;
}
/* Detail Dialog Styles */
.dialog-detail-content {
  font-size: 0.8rem;
}
.text-xsmall {
  font-size: 0.65rem !important;
}
</style>