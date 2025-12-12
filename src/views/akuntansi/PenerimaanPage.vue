<script setup lang="ts">
// FIX: Tambahkan onBeforeUnmount
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from 'vue'; 
import { format } from 'date-fns';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  RefreshIcon, 
  ArrowDownCircleIcon, 
  DeviceFloppyIcon,
  XIcon,
  CalendarEventIcon,
  BuildingBankIcon,
  SearchIcon // Tambahkan SearchIcon untuk input
} from 'vue-tabler-icons';

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";

// FIX: Pindahkan deklarasi timer ke lingkup script setup
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// STATE
const loadingList = ref(false);
const receiptList = ref<any[]>([]);
const search = ref(''); // Added search state for UI consistency
const headers = [
  { title: 'No', key: 'index', align: 'center' as const, sortable: false },
  { title: 'Receipt #', key: 'number', align: 'start' as const },
  { title: 'Date', key: 'transDate', align: 'start' as const },
  { title: 'Description', key: 'description', align: 'start' as const },
  { title: 'Amount', key: 'amount', align: 'end' as const },
  { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false },
];

const form = reactive({
  transDate: format(new Date(), 'yyyy-MM-dd'),
  bankId: null as number | null,
  bankName: '',
  description: '',
  items: [{ id: Date.now(), accountNo: '', accountName: '', amount: 0, notes: '' }]
});
const saving = ref(false);

const dialogDetail = ref(false);
const detailData = ref<any>(null);
const loadingDetail = ref(false); // Added loading state for detail

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

const totalAmount = computed(() => form.items.reduce((s, i) => s + (Number(i.amount)||0), 0));

// METHODS
const fetchList = async () => {
  loadingList.value = true;
  try {
    const url = new URL(`${API_BASE_URL}/Penerimaan/List.php`);
    // Added search logic support if needed in future (UI is ready)
    if (search.value) url.searchParams.append("q", search.value); 
    
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.s && Array.isArray(json.d)) receiptList.value = json.d.map((x:any,i:number) => ({...x, index: i+1}));
    else receiptList.value = [];
  } catch { 
    receiptList.value = []; 
    // FIX: Tambahkan error handling notifikasi jika gagal fetch list
    showMsg('Gagal memuat daftar penerimaan.', 'error');
  } 
  finally { loadingList.value = false; }
};

// FIX: Buat fungsi debounce untuk watch
const fetchListDebounced = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchList, 600);
}

// Debounce search watcher
// FIX: Gunakan fungsi debounced
watch(search, fetchListDebounced);

const handleSubmit = async () => {
  if(!form.bankId) return showMsg('Pilih Bank Penerima', 'error');
  
  saving.value = true;
  try {
    const payload = {
      // FIX: Pertahankan logic asli format tanggal
      transDate: format(new Date(form.transDate), 'dd/MM/yyyy'),
      bankId: form.bankId,
      description: form.description || "Penerimaan Lain",
      detailAccount: form.items.map(d => ({ accountNo: d.accountNo, amount: d.amount, detailNotes: d.notes }))
    };
    const res = await fetch(`${API_BASE_URL}/Penerimaan/Transaksi.php`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    const json = await res.json();
    if(json.s) {
      showMsg('Penerimaan Berhasil Disimpan');
      form.transDate = format(new Date(), 'yyyy-MM-dd');
      form.description = '';
      form.bankName = ''; // Reset UI display name
      form.bankId = null;
      form.items = [{ id: Date.now(), accountNo: '', accountName: '', amount: 0, notes: '' }];
      fetchList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // FIX: Penanganan error dari backend
      showMsg(json.d?.message || json.message || 'Gagal menyimpan transaksi penerimaan.', 'error');
    }
  } catch { showMsg('Error koneksi saat menyimpan transaksi.', 'error'); } 
  finally { saving.value = false; }
};

const openDetail = async (id: number) => {
  dialogDetail.value = true;
  loadingDetail.value = true;
  detailData.value = null;
  try {
    const res = await fetch(`${API_BASE_URL}/Penerimaan/Detail.php?id=${id}`);
    const json = await res.json();
    if(json.s) detailData.value = json.d;
    else showMsg('Gagal memuat detail transaksi.', 'error');
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
            Other Deposit Management
          </h2>
          <div class="text-caption text-white opacity-90">
            Record and categorize miscellaneous incoming funds.
          </div>
        </div>
      </div>
    </div>
  </v-card>

  <v-row class="mt-0">
    <v-col cols="12">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-form-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center">
          <ArrowDownCircleIcon size="18" class="text-white mr-1" />
          <span class="text-subtitle-1 font-weight-bold text-white">New Deposit Entry</span>
        </div>

        <v-card-text class="pa-3">
          
                    <v-row>
            <v-col cols="12" md="6" class="py-1">
              <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Deposit Destination</h6>
              
              <div class="mb-2">
                <AsyncSelect
                  label="Deposit To Account (Bank/Cash) *"
                  :apiEndpoint="`${API_BASE_URL}/Penerimaan/MasterGlAccount.php`"
                  filterType="CASH_BANK"
                  v-model="form.bankName"
                  item-title="name"
                  item-value="name"
                  @change="(o: any) => { if(o) { form.bankId = o.id; form.bankName = o.name; } }"
                  density="compact"
                  hide-details
                  class="small-input"
                />
              </div>

              <v-textarea 
                v-model="form.description" 
                label="Description / Notes" 
                placeholder="e.g. Pendapatan Bunga Bank"
                rows="2" 
                variant="outlined" 
                density="compact"
                hide-details
                class="small-input small-textarea"
              ></v-textarea>
            </v-col>

            <v-col cols="12" md="6" class="py-1">
              <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Transaction Info</h6>
              
              <v-text-field 
                v-model="form.transDate" 
                type="date" 
                label="Receipt Date *" 
                variant="outlined" 
                density="compact"
                hide-details
                prepend-inner-icon="mdi-calendar"
                class="mb-2 small-input"
              ></v-text-field>

              <v-text-field 
                label="Receipt Number" 
                placeholder="Auto-generated" 
                disabled 
                variant="outlined" 
                density="compact"
                hide-details
                bg-color="grey-lighten-4"
                prepend-inner-icon="mdi-pound"
                class="small-input"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-3"></v-divider>
          
                    <v-row class="mt-0">
            <v-col cols="12" class="py-1">
              <v-card variant="outlined" class="rounded-md bg-grey-lighten-5 compact-list-card">
                <div class="d-flex justify-space-between align-center px-3 py-2 bg-white border-bottom">
                  <span class="text-caption font-weight-bold text-uppercase text-grey-darken-1">
                    Income Allocation Details (Credit Account)
                  </span>
                </div>
                
                <v-table density="compact" class="bg-transparent item-table-form">
                  <thead>
                    <tr>
                      <th width="40" class="text-center font-weight-bold text-primary text-caption">#</th>
                      <th class="font-weight-bold text-primary text-caption">Income Account</th>
                      <th class="font-weight-bold text-primary text-caption">Notes</th>
                      <th width="200" class="text-right font-weight-bold text-primary text-caption">Amount</th>
                      <th width="50"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in form.items" :key="item.id">
                      <td class="text-center py-1 text-medium-emphasis text-caption align-top">{{ idx + 1 }}</td>
                      <td class="py-1 item-cell align-top">
                        <AsyncSelect 
                          :apiEndpoint="`${API_BASE_URL}/Penerimaan/MasterGlAccount.php`"
                          v-model="item.accountNo"
                          label="Select Account..."
                          item-title="name"
                          item-value="no"
                          @change="(o: any) => { if(o) item.accountName = o.name; item.accountNo = o.no }"
                          density="compact" 
                          variant="outlined" 
                          hide-details
                          class="small-input-in-table bg-white"
                        />
                      </td>
                      <td class="py-1 item-cell align-top">
                        <v-text-field 
                          v-model="item.notes" 
                          density="compact" 
                          variant="outlined" 
                          hide-details 
                          bg-color="white"
                          placeholder="Note..."
                          class="small-input-in-table"
                        ></v-text-field>
                      </td>
                      <td class="py-1 item-cell align-top">
                        <v-text-field 
                          v-model.number="item.amount" 
                          type="number" 
                          density="compact" 
                          variant="outlined" 
                          hide-details 
                          class="text-right-input small-input-in-table bg-white"
                          prefix="Rp"
                        ></v-text-field>
                      </td>
                      <td class="text-center py-1 align-top">
                        <v-btn 
                          icon 
                          variant="text" 
                          color="error" 
                          size="x-small" 
                          @click="form.items.splice(idx, 1)" 
                          :disabled="form.items.length <= 1"
                        >
                          <TrashIcon size="16"/>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="bg-white">
                      <td colspan="3" class="text-right text-subtitle-2 font-weight-bold pt-3 pb-3">Total Receipt:</td>
                      <td class="text-right text-h6 font-weight-bold text-primary pt-3 pb-3">Rp {{ totalAmount.toLocaleString('id-ID') }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </v-table>
                
                <v-divider></v-divider>
                <div class="px-2 py-2 bg-white">
                  <v-btn 
                    color="primary" 
                    variant="tonal" 
                    size="x-small" 
                    prepend-icon="mdi-plus" 
                    @click="form.items.push({ id: Date.now(), accountNo: '', accountName: '', amount: 0, notes: '' })" 
                    block 
                    class="text-none text-caption"
                  >
                    Add Another Income Line
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>

        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="bg-grey-lighten-5 px-4 py-2 justify-end">
          <v-btn variant="outlined" color="secondary" size="small" class="px-4 text-caption">Cancel</v-btn>
          <v-btn color="primary" size="small" variant="flat" @click="handleSubmit" :loading="saving" class="px-4 ml-1 text-caption">
            <DeviceFloppyIcon size="16" class="mr-1"/> Save Receipt
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

        <v-col cols="12" class="mt-2">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center">
            <BuildingBankIcon size="18" class="text-white mr-1" />
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-white">Receipt History</h3>
              <div class="text-caption text-white opacity-80">Track all deposits</div>
            </div>
          </div>
          
          <div class="d-flex align-center gap-1">
            <v-text-field
              v-model="search"
              density="compact"
              variant="solo-filled"
              label="Search Receipt..."
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
          :items="receiptList" 
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
          
          <template v-slot:item.number="{ item }">
            <span class="font-weight-bold text-primary text-caption">{{ item.number }}</span>
          </template>
          <template v-slot:item.transDate="{ item }">
            <span class="text-caption">{{ item.transDate }}</span>
          </template>
          <template v-slot:item.description="{ item }">
            <span class="text-caption">{{ item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description }}</span>
          </template>
          <template v-slot:item.amount="{ item }">
            <span class="text-primary font-weight-bold text-caption">Rp {{ Number(item.amount).toLocaleString('id-ID') }}</span>
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

    <v-dialog v-model="dialogDetail" max-width="700" transition="dialog-bottom-transition" scrollable>
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <div class="bg-white rounded-circle pa-1 d-flex">
            <ArrowDownCircleIcon size="16" class="text-primary" />
          </div>
          <div>
            <span class="text-subtitle-1 font-weight-bold text-white d-block" style="line-height: 1.2;">Deposit Detail</span>
            <span class="text-caption text-white opacity-80 font-weight-normal">Transaction View</span>
          </div>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialogDetail = false">
          <XIcon size="18" />
        </v-btn>
      </div>

      <v-card-text class="pa-0 bg-grey-lighten-5 dialog-detail-content" style="max-height: 70vh;">
        <div v-if="loadingDetail" class="d-flex flex-column align-center justify-center py-6">
          <v-progress-circular indeterminate color="primary" size="30"></v-progress-circular>
          <div class="mt-2 text-caption text-medium-emphasis">Mengambil data detail...</div>
        </div>

        <div v-else-if="detailData">
          <div class="bg-white pa-4 mb-3 shadow-sm border-bottom">
            <v-row dense>
              <v-col cols="12" sm="6" class="py-1">
                <div class="text-overline text-medium-emphasis mb-0 text-xsmall">Receipt Number</div>
                <div class="d-flex align-center gap-1 mb-1">
                  <span class="text-h6 font-weight-bold text-primary">{{ detailData.number }}</span>
                </div>
                <div class="d-flex align-center gap-1 text-grey-darken-2 text-caption">
                  <CalendarEventIcon size="14" />
                  <span>Date: {{ detailData.transDate }}</span>
                </div>
              </v-col>

              <v-col cols="12" sm="6" class="text-sm-right py-1">
                <div class="text-overline text-medium-emphasis mb-0 text-xsmall">Total Amount</div>
                <div class="text-h5 font-weight-bold text-primary mb-1">Rp {{ detailData.amount.toLocaleString('id-ID') }}</div>
                <div class="text-xsmall text-grey-darken-1 mt-1 text-left text-sm-right bg-grey-lighten-4 pa-1 rounded border small-note">
                  <span class="font-weight-bold">To Bank:</span> {{ detailData.bank?.name }}
                </div>
              </v-col>
            </v-row>
            <div class="mt-3">
              <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Description</div>
              <div class="text-body-2 font-italic bg-grey-lighten-4 pa-2 rounded border text-caption">{{ detailData.description || 'No description provided' }}</div>
            </div>
          </div>

          <div class="px-4 pb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center text-primary">
              <v-icon start color="primary" size="x-small">mdi-file-tree</v-icon>
              Income Allocation Breakdown (Credit)
            </div>
            <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
              <v-table density="compact" class="compact-detail-table">
                <thead class="bg-grey-lighten-4">
                  <tr>
                    <th width="30" class="text-center text-caption">#</th>
                    <th class="text-caption">Account Description</th>
                    <th class="text-caption" width="150">Notes</th>
                    <th class="text-right text-caption" width="120">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d, i) in detailData.detailAccount" :key="i" class="hover-bg">
                    <td class="text-center text-medium-emphasis text-caption">{{ i+1 }}</td>
                    <td>
                      <div class="font-weight-medium text-caption">{{ d.account?.name }}</div>
                      <div class="text-xsmall text-medium-emphasis font-mono">{{ d.account?.no }}</div>
                    </td>
                    <td class="font-italic text-grey text-caption">{{ d.detailNotes || '-' }}</td>
                    <td class="text-right">
                      <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold text-caption">
                        Rp {{ Number(d.amount).toLocaleString('id-ID') }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
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
.hover-bg:hover { background-color: #f5f5f5; }
.border-bottom { border-bottom: 1px solid rgba(0,0,0,0.12); }
.border-none { border: none !important; box-shadow: none !important; }
.border-dashed { border-style: dashed !important; border-width: 1px 0 0 0 !important; border-color: rgba(0,0,0,0.1) !important; }

/* INPUT COMPACT STYLING */
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
.small-input :deep(.v-field__prepend-inner),
.small-input :deep(.v-field__append-inner) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}


/* Specific input inside table */
.small-input-in-table :deep(.v-field) {
  min-height: 32px !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
.small-input-in-table :deep(.v-field__input) {
  font-size: 0.75rem !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
  min-height: 20px !important;
  height: 20px !important;
}
.small-input-in-table :deep(.v-label) {
  font-size: 0.75rem !important;
}

/* Item table row/cell padding */
.item-table-form :deep(td) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

/* Data table custom styling */
.compact-data-table :deep(.v-data-table__td) {
  font-size: 0.75rem !important;
  height: 38px !important; /* Dikecilkan */
}
.compact-data-table :deep(.v-data-table-header) th {
  height: 35px !important; /* Dikecilkan */
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
.small-search-input :deep(.v-field__prepend-inner) {
  margin-top: 2px;
}

/* Detail dialog font and table */
.dialog-detail-content {
  font-size: 0.8rem;
}
.text-xsmall {
  font-size: 0.65rem !important;
}
.small-note {
  padding: 4px !important;
}
.compact-detail-table :deep(td), .compact-detail-table :deep(th) {
  padding: 6px 8px !important;
  font-size: 0.75rem !important;
}
</style>