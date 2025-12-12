<script setup lang="ts">
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'; // FIX: Tambahkan onBeforeUnmount
import { format } from 'date-fns';
import AsyncSelect from '@/components/common/AsyncSelect.vue';

// Icons
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  DeviceFloppyIcon,
  RefreshIcon,
  FileDescriptionIcon,
  XIcon,
  CalendarEventIcon,
  UserIcon // Icon PIC
} from 'vue-tabler-icons';

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";

// FIX: Pindahkan deklarasi searchTimeout ke lingkup atas dan tetapkan tipenya
let searchTimeout: ReturnType<typeof setTimeout> | null = null; 

// --- STATE LIST DATA ---
const search = ref('');
const loadingList = ref(false);
const jobOrderList = ref<any[]>([]);

const headers = [
  { title: 'No', key: 'index', align: 'center' as const, sortable: false },
  { title: 'JO Number', key: 'number', align: 'start' as const },
  { title: 'Date', key: 'transDate', align: 'start' as const },
  { title: 'Customer', key: 'customerName', align: 'start' as const },
  { title: 'PIC', key: 'pic', align: 'start' as const }, // KOLOM BARU
  { title: 'Description', key: 'description', align: 'start' as const },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false },
];

// --- STATE FORM ---
const form = reactive({
  transDate: format(new Date(), 'yyyy-MM-dd'),
  jobNumber: '',
  customerNo: '',
  customerName: '', // Simpan nama untuk DB lokal
  pic: '', // FIELD BARU
  description: '',
  items: [{ id: Date.now(), no: '', name: '', quantity: 1 }]
});
const saving = ref(false);

// --- STATE MODAL DETAIL ---
const dialogDetail = ref(false);
const detailData = ref<any>(null);
const loadingDetail = ref(false);

// --- STATE SNACKBAR ---
const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

// --- METHODS LIST ---
const fetchList = async () => {
  loadingList.value = true;
  try {
    const url = new URL(`${API_BASE_URL}/JobOrder/List.php`);
    if (search.value) url.searchParams.append("q", search.value);
    
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.s && Array.isArray(json.d)) {
      jobOrderList.value = json.d.map((item: any, index: number) => ({
        ...item,
        index: index + 1
      }));
    } else {
      jobOrderList.value = [];
    }
  } catch (e) {
    showMsg('Gagal memuat data', 'error');
  } finally {
    loadingList.value = false;
  }
};

// FIX: Debounce logic sudah benar, memanggil fetchList saat search berubah
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout); // FIX: Clear timeout sebelumnya
  searchTimeout = setTimeout(fetchList, 600); // FIX: Terapkan debounce 600ms
});

// --- METHODS FORM ---
const addItem = () => {
  form.items.push({ id: Date.now(), no: '', name: '', quantity: 1 });
};

const removeItem = (index: number) => {
  if (form.items.length > 1) form.items.splice(index, 1);
};

const onItemChange = (index: number, obj: any) => {
  if (obj) {
    // FIX: Pastikan item.no juga terisi jika itemValue di AsyncSelect adalah 'no'
    form.items[index].no = obj.no;
    form.items[index].name = obj.name;
  }
};

const onCustomerChange = (obj: any) => {
  if(obj) {
    form.customerName = obj.name;
    form.customerNo = obj.customerNo;
  }
};

const resetForm = () => {
  form.transDate = format(new Date(), 'yyyy-MM-dd');
  form.jobNumber = '';
  form.customerNo = '';
  form.customerName = '';
  form.pic = '';
  form.description = '';
  form.items = [{ id: Date.now(), no: '', name: '', quantity: 1 }];
};

const handleSubmit = async () => {
  if (!form.jobNumber || !form.customerNo) return showMsg('Lengkapi data Customer & Nomor JO', 'error');
  if (!form.pic) return showMsg('PIC Pelaksana wajib diisi', 'error'); // Validasi PIC
  
  saving.value = true;
  try {
    const payload = {
      transDate: form.transDate, // Kirim format Y-m-d biar backend proses
      customerNo: form.customerNo,
      customerName: form.customerName,
      pic: form.pic,
      number: form.jobNumber,
      description: form.description,
      detailItem: form.items.map(i => ({ 
        itemNo: i.no, 
        itemName: i.name, // Kirim nama item untuk DB lokal
        quantity: i.quantity 
      }))
    };

    const res = await fetch(`${API_BASE_URL}/JobOrder/Transaksi.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.s) {
      showMsg('Job Order Berhasil Disimpan!');
      resetForm();
      fetchList(); // FIX: Panggil fetchList setelah simpan
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // FIX: Pertahankan logic asli penanganan error yang kompleks
      showMsg(json.d ? (Array.isArray(json.d) ? json.d.join(', ') : json.d?.message || 'Gagal') : 'Gagal simpan', 'error');
    }
  } catch (e) {
    showMsg('Terjadi kesalahan koneksi', 'error');
  } finally {
    saving.value = false;
  }
};

const openDetail = async (id: number) => {
  dialogDetail.value = true;
  loadingDetail.value = true;
  detailData.value = null;
  try {
    const res = await fetch(`${API_BASE_URL}/JobOrder/Detail.php?id=${id}`);
    const json = await res.json();
    if (json.s) detailData.value = json.d;
    else showMsg('Gagal memuat detail', 'error');
  } catch (e) {
    showMsg('Error koneksi', 'error');
  } finally {
    loadingDetail.value = false;
  }
};

onMounted(() => {
  fetchList();
});

// FIX: Tambahkan onBeforeUnmount untuk membersihkan debounce timer
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
            Job Order Management
          </h2>
          <div class="text-caption text-white opacity-90">
            Create, manage, and track your job order transactions efficiently.
          </div>
        </div>
      </div>
    </div>
  </v-card>

  <v-row class="mt-0">
        <v-col cols="12">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-form-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center">
          <PlusIcon size="18" class="text-white mr-1" />
          <span class="text-subtitle-1 font-weight-bold text-white">New Job Order Entry</span>
        </div>

        <v-card-text class="pa-3">
          <v-row>
            <v-col cols="12" md="6" class="py-1">
              <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">General Information</h6>
              
              <v-text-field 
                v-model="form.jobNumber" 
                label="Job Order Number" 
                placeholder="e.g. JO-2023-001"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-pound"
                class="mb-2 small-input"
              ></v-text-field>
              
              <div class="mb-2">
                <AsyncSelect 
                  label="Select Customer"
                  :apiEndpoint="`${API_BASE_URL}/JobOrder/MasterCustomer.php`"
                  v-model="form.customerNo"
                  item-title="name"
                  item-value="customerNo"
                  @change="onCustomerChange"
                  density="compact"
                  hide-details
                  class="small-input"
                />
              </div>

              <v-text-field 
                v-model="form.pic" 
                label="PIC Pelaksana Order" 
                placeholder="Nama Penanggung Jawab"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-2 small-input"
              >
                <template v-slot:prepend-inner>
                  <UserIcon size="16" class="text-grey" />
                </template>
              </v-text-field>

              <v-textarea 
                v-model="form.description" 
                label="Project Description / Notes" 
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                class="small-input small-textarea"
              ></v-textarea>
            </v-col>
            
            <v-col cols="12" md="6" class="py-1">
              <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Transaction Details</h6>
              
              <v-text-field 
                v-model="form.transDate" 
                type="date" 
                label="Transaction Date" 
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-calendar"
                class="mb-2 small-input"
              ></v-text-field>

              <v-card variant="outlined" class="rounded-md mt-2 bg-grey-lighten-5 compact-list-card">
                <div class="d-flex justify-space-between align-center px-3 py-2 bg-white border-bottom">
                  <span class="text-caption font-weight-bold text-uppercase text-grey-darken-1">
                    Materials / Items List
                  </span>
                </div>
                
                <v-table density="compact" class="bg-transparent item-table-form">
                  <thead>
                    <tr>
                      <th class="font-weight-bold text-primary text-caption">Item Name</th>
                      <th width="100" class="text-center font-weight-bold text-primary text-caption">Qty</th>
                      <th width="30"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in form.items" :key="item.id">
                      <td class="py-1 item-cell">
                        <AsyncSelect 
                          :apiEndpoint="`${API_BASE_URL}/JobOrder/MasterItem.php`"
                          v-model="item.no"
                          label="Select Item"
                          item-title="name"
                          item-value="no"
                          @change="(obj: any) => onItemChange(index, obj)"
                          density="compact"
                          hide-details
                          class="small-input-in-table"
                        />
                      </td>
                      <td class="align-top py-1 item-cell">
                        <v-text-field 
                          v-model.number="item.quantity" 
                          type="number" 
                          min="1" 
                          variant="outlined" 
                          density="compact" 
                          hide-details
                          class="centered-input small-input-in-table bg-white"
                        ></v-text-field>
                      </td>
                      <td class="text-center align-top py-1">
                        <v-btn 
                          icon 
                          variant="text" 
                          color="error" 
                          size="x-small" 
                          @click="removeItem(index)" 
                          :disabled="form.items.length <= 1"
                        >
                          <TrashIcon size="16" />
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <v-divider></v-divider>
                <div class="px-2 py-2 bg-white">
                  <v-btn 
                    color="primary" 
                    variant="tonal" 
                    size="x-small" 
                    prepend-icon="mdi-plus" 
                    @click="addItem"
                    block
                    class="text-none text-caption"
                  >
                    Add Another Item
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="bg-grey-lighten-5 px-4 py-2 justify-end">
          <v-btn variant="outlined" color="secondary" size="small" @click="resetForm" class="px-4 text-caption">Cancel</v-btn>
          <v-btn color="primary" size="small" variant="flat" @click="handleSubmit" :loading="saving" class="px-4 ml-1 text-caption">
            <DeviceFloppyIcon size="16" class="mr-1" /> Save Job Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

        <v-col cols="12" class="mt-2">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center">
            <FileDescriptionIcon size="18" class="text-white mr-1" />
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-white">Transaction History</h3>
              <div class="text-caption text-white opacity-80">Local Database Records</div>
            </div>
          </div>
          
          <div class="d-flex align-center gap-1">
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
          :items="jobOrderList"
          :loading="loadingList"
          density="compact"
          hover
          class="rounded-0 compact-data-table"
        >
          <template v-slot:headers="{ columns }">
            <tr class="bg-gradient-smooth">
             <template v-for="column in columns" :key="column.key ?? column.title">
                <th class="text-caption font-weight-bold text-uppercase text-white py-2 border-none">
                  {{ column.title }}
                </th>
              </template>
            </tr>
          </template>

          <template v-slot:item.number="{ item }">
            <span class="font-weight-bold text-primary text-caption">{{ item.number }}</span>
          </template>

          <template v-slot:item.pic="{ item }">
            <div class="d-flex align-center">
              <UserIcon size="14" class="mr-1 text-grey"/>
              <span class="font-weight-medium text-caption">{{ item.pic || '-' }}</span>
            </div>
          </template>
          
          <template v-slot:item.description="{ item }">
                        <span class="text-caption">{{ item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description }}</span>
                    </template>

          <template v-slot:item.status="{ item }">
            <v-chip 
              size="x-small" 
              variant="tonal"
              class="font-weight-bold text-uppercase"
              :color="item.status === 'Submitted' ? 'green' : 'grey'"
            >
              {{ item.status }}
            </v-chip>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" color="primary" size="x-small" @click="openDetail(item.id)">
              <EyeIcon size="16" />
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
  </v-row>

    <v-dialog v-model="dialogDetail" max-width="600" transition="dialog-bottom-transition" scrollable>
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <div class="bg-white rounded-circle pa-1 d-flex">
            <FileDescriptionIcon size="16" class="text-primary" />
          </div>
          <div>
            <span class="text-subtitle-1 font-weight-bold text-white d-block" style="line-height: 1.2;">Job Order Detail</span>
            <span class="text-caption text-white opacity-80 font-weight-normal">View complete transaction info</span>
          </div>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialogDetail = false">
          <XIcon size="18" />
        </v-btn>
      </div>
      
      <v-card-text class="pa-0 bg-grey-lighten-5 dialog-detail-content" style="max-height: 60vh;">
        <div v-if="loadingDetail" class="d-flex flex-column align-center justify-center py-6">
          <v-progress-circular indeterminate color="primary" size="30"></v-progress-circular>
          <div class="mt-2 text-caption text-medium-emphasis">Mengambil data detail...</div>
        </div>

        <div v-else-if="detailData">
          <div class="bg-white pa-4 mb-3 shadow-sm border-bottom">
            <v-row dense>
              <v-col cols="12" sm="6" class="py-1">
                <div class="text-overline text-medium-emphasis mb-0 text-xsmall">Transaction Info</div>
                <div class="d-flex align-center gap-1 mb-1">
                  <span class="text-h6 font-weight-bold text-primary">{{ detailData.number }}</span>
                </div>
                <div class="d-flex align-center gap-1 mb-1 text-grey-darken-1 text-caption">
                  <CalendarEventIcon size="14" />
                  <span>{{ detailData.transDate }}</span>
                </div>
                <div class="d-flex align-center gap-1 text-grey-darken-2 text-caption">
                  <UserIcon size="14" />
                  <span class="font-weight-bold">PIC: {{ detailData.pic || '-' }}</span>
                </div>
              </v-col>

              <v-col cols="12" sm="6" class="text-sm-right py-1">
                <div class="text-overline text-medium-emphasis mb-0 text-xsmall">Customer Info</div>
                <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-1">{{ detailData.customer?.name }}</div>
                <div class="text-caption text-primary font-mono bg-blue-lighten-5 d-inline-block px-2 py-0 rounded mb-1">
                  {{ detailData.customer?.customerNo }}
                </div>
                <div class="text-xsmall text-grey-darken-1 mt-1 text-left text-sm-right bg-grey-lighten-4 pa-1 rounded border small-note">
                  <span class="font-weight-bold">Note:</span> "{{ detailData.description || 'No description provided' }}"
                </div>
              </v-col>
            </v-row>
          </div>

          <div class="px-4 pb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center text-primary">
              <v-icon start color="primary" size="x-small">mdi-package-variant-closed</v-icon>
              Items Breakdown
            </div>
            <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
              <v-table density="compact" class="compact-detail-table">
                <thead class="bg-grey-lighten-4">
                  <tr>
                    <th width="30" class="text-center text-caption">#</th>
                    <th class="text-caption">Item Description</th>
                    <th class="text-center text-caption" width="80">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in detailData.detailItem" :key="idx" class="hover-bg">
                    <td class="text-center text-medium-emphasis text-caption">{{ idx + 1 }}</td>
                    <td>
                      <div class="font-weight-medium text-caption">{{ item.item?.name }}</div>
                      <div class="text-xsmall text-medium-emphasis font-mono">{{ item.item?.no }}</div>
                    </td>
                    <td class="text-center">
                      <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold text-caption">
                        {{ item.quantity }}
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
        <v-btn variant="outlined" color="primary" size="small" @click="dialogDetail = false" class="px-4 text-caption">Close Detail</v-btn>
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
.bg-gradient-smooth {
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}
.font-mono {
  font-family: 'Roboto Mono', monospace;
}
.centered-input :deep(input) {
  text-align: center;
}
.hover-bg:hover {
  background-color: #f5f5f5;
}
.border-bottom {
  border-bottom: 1px solid rgba(0,0,0,0.12);
}
.border-none {
  border: none !important;
  box-shadow: none !important;
}

/* Override input styling for compactness */
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

.small-textarea :deep(.v-field__input) {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    min-height: 50px !important;
}

/* Specific item input inside table */
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

/* Detail dialog font and layout */
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
}
</style>