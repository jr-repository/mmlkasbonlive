<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from 'vue'; 
import { format, subMonths } from 'date-fns';
import { useAuthStore } from '@/stores/auth'; 
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  RefreshIcon, 
  SendIcon, 
  XIcon,
  CalendarEventIcon,
  FileDescriptionIcon,
  CheckIcon,
  BanIcon, 
  PencilIcon,
  DownloadIcon,
  PrinterIcon,
  TrendingUpIcon,
  CurrencyDollarIcon,
  ReceiptIcon,
  ChartPieIcon,
  ListIcon,
  FileSpreadsheetIcon,
  FileAnalyticsIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";
const authStore = useAuthStore();

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let filterTimeout: ReturnType<typeof setTimeout> | null = null;

const activeTab = ref('summary');

const filterDate = reactive({
  start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
  end: format(new Date(), 'yyyy-MM-dd')
});

const dashboardData = ref({
  summary: { cost: 0, bill: 0, gp: 0 },
  jo_performance: [] as any[]
});

const loadingList = ref(false);
const kasbonList = ref<any[]>([]);
const search = ref('');

const headers = [
  { title: 'No', key: 'index', align: 'center' as const, sortable: false },
  { title: 'No. Transaksi', key: 'number', align: 'start' as const },
  { title: 'Tanggal', key: 'transDate', align: 'start' as const },
  { title: 'Keterangan', key: 'description', align: 'start' as const },
  { title: 'Total Biaya', key: 'amount', align: 'end' as const },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false },
];

const dialogForm = ref(false); 
const isEditing = ref(false);
const editId = ref(0);
const form = reactive({
  transDate: format(new Date(), 'yyyy-MM-dd'),
  bankId: null as number | null,
  bankName: '',
  description: '',
  items: [{ 
    id: Date.now(), 
    accountNo: '', 
    accountName: '', 
    amount: 0, 
    billAmount: 0, 
    jobOrderId: null as number | null, 
    jobOrderNo: '',
    notes: '' 
  }]
});
const saving = ref(false);

const dialogDetail = ref(false);
const detailData = ref<any>(null);
const loadingDetail = ref(false);
const approving = ref(false);
const rejecting = ref(false);

const dialogJODetail = ref(false);
const joDetailData = ref<any>(null);
const loadingJoDetail = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

const totalAmount = computed(() => form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
const totalBill = computed(() => form.items.reduce((sum, item) => sum + (Number(item.billAmount) || 0), 0));
const canApprove = computed(() => authStore.userData?.approvals?.includes('KASBON'));

const fetchDashboard = async () => {
  try {
    const url = `${API_BASE_URL}/Kasbon/DashboardSummary.php?start_date=${filterDate.start}&end_date=${filterDate.end}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.s) dashboardData.value = json.d;
  } catch (e) {
    console.error("Dashboard error", e);
  }
};

const handleExport = (type: 'excel' | 'pdf') => {
  const url = `${API_BASE_URL}/Kasbon/Export.php?type=${type}&start_date=${filterDate.start}&end_date=${filterDate.end}`;
  window.open(url, '_blank');
};

const fetchList = async () => {
  loadingList.value = true;
  try {
    const url = new URL(`${API_BASE_URL}/Kasbon/List.php`);
    if (search.value) url.searchParams.append("q", search.value);
    
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.s && Array.isArray(json.d)) {
      kasbonList.value = json.d.map((item: any, idx: number) => ({...item, index: idx + 1}));
    } else {
      kasbonList.value = [];
    }
  } catch {
    kasbonList.value = [];
  } finally {
    loadingList.value = false;
  }
};

const fetchListDebounced = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchList, 600);
};

const fetchDashboardDebounced = () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = setTimeout(fetchDashboard, 600);
};

watch(search, fetchListDebounced);

watch(() => [filterDate.start, filterDate.end], fetchDashboardDebounced, { deep: true });

const openCreateModal = () => {
  resetForm();
  dialogForm.value = true;
};

const addItem = () => {
  form.items.push({ id: Date.now(), accountNo: '', accountName: '', amount: 0, billAmount: 0, jobOrderId: null, jobOrderNo: '', notes: '' });
};

const removeItem = (idx: number) => {
  if (form.items.length > 1) form.items.splice(idx, 1);
};

const onItemChange = (idx: number, obj: any) => {
  if (obj) {
    form.items[idx].accountNo = obj.no;
    form.items[idx].accountName = obj.name;
  }
};

const onJOChange = (idx: number, obj: any) => {
  if (obj) {
    form.items[idx].jobOrderId = obj.id;
    form.items[idx].jobOrderNo = obj.number;
  }
};

const resetForm = () => {
  isEditing.value = false;
  editId.value = 0;
  form.transDate = format(new Date(), 'yyyy-MM-dd');
  form.bankId = null; 
  form.bankName = '';
  form.description = '';
  form.items = [{ id: Date.now(), accountNo: '', accountName: '', amount: 0, billAmount: 0, jobOrderId: null, jobOrderNo: '', notes: '' }];
};

const handleEdit = async (item: any) => {
  loadingList.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Kasbon/Detail.php?id=${item.id}`);
    const json = await res.json();
    if(json.s) {
      const data = json.d;
      isEditing.value = true;
      editId.value = data.id;
      const parts = data.transDate.split('/');
      form.transDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      form.bankId = data.bank.id;
      form.bankName = data.bank.name;
      form.description = data.description;
      
      form.items = data.detailAccount.map((d: any) => ({
        id: Date.now() + Math.random(),
        accountNo: d.account.no,
        accountName: d.account.name,
        amount: d.amount,
        billAmount: d.billAmount,
        jobOrderId: d.jobOrder ? d.jobOrder.id : null,
        jobOrderNo: d.jobOrder ? d.jobOrder.number : '',
        notes: d.detailNotes
      }));
      
      dialogForm.value = true;
      showMsg("Mode Edit Aktif", "info");
    }
  } catch {
    showMsg("Gagal memuat data", "error");
  } finally {
    loadingList.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.bankId) return showMsg('Pilih Sumber Dana (Kas/Bank)', 'error');
  if (form.items.some(i => !i.accountNo || i.amount <= 0)) return showMsg('Lengkapi rincian biaya', 'error');

  saving.value = true;
  try {
    const payload = {
      id: isEditing.value ? editId.value : null, 
      user: authStore.userData?.name || 'User',
      user_id: authStore.userData?.id,
      user_name: authStore.userData?.name,
      transDate: form.transDate,
      bankId: form.bankId,
      bankName: form.bankName,
      description: form.description || "Pengeluaran Kasbon/Biaya",
      detailAccount: form.items.map(d => ({
        accountNo: d.accountNo,
        accountName: d.accountName,
        amount: d.amount,
        billAmount: d.billAmount,
        jobOrderId: d.jobOrderId,
        detailNotes: d.notes
      }))
    };

    const url = isEditing.value 
      ? `${API_BASE_URL}/Kasbon/Update.php`
      : `${API_BASE_URL}/Kasbon/Transaksi.php`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.s) {
      showMsg(isEditing.value ? 'Perubahan Disimpan' : 'Berhasil Disimpan');
      dialogForm.value = false; 
      fetchList(); 
    } else {
      showMsg(json.message || 'Gagal simpan', 'error');
    }
  } catch (e: any) {
    showMsg(e.message || 'Error koneksi', 'error');
  } finally {
    saving.value = false;
  }
};

const handleApprove = async (id: number) => {
  if(!confirm("Yakin Approve transaksi ini?")) return;
  approving.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Kasbon/Approve.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, user_id: authStore.userData?.id })
    });
    const json = await res.json();
    if(json.s) {
      showMsg(json.message, "success");
      fetchList();
      dialogDetail.value = false;
    } else {
      showMsg(json.message, "error");
    }
  } catch {
    showMsg("Error koneksi", "error");
  } finally {
    approving.value = false;
  }
};

const handleReject = async (id: number) => {
  if(!confirm("Yakin Reject transaksi ini?")) return;
  rejecting.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Kasbon/Reject.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, user_id: authStore.userData?.id })
    });
    const json = await res.json();
    if(json.s) {
      showMsg("Transaksi Ditolak", "warning");
      fetchList();
      dialogDetail.value = false;
    } else {
      showMsg(json.message, "error");
    }
  } catch {
    showMsg("Error koneksi", "error");
  } finally {
    rejecting.value = false;
  }
};

const openDetail = async (id: number) => {
  dialogDetail.value = true;
  loadingDetail.value = true;
  detailData.value = null;
  try {
    const res = await fetch(`${API_BASE_URL}/Kasbon/Detail.php?id=${id}`);
    const json = await res.json();
    if(json.s) detailData.value = json.d;
  } catch {
    showMsg('Gagal muat detail', 'error');
  } finally {
    loadingDetail.value = false;
  }
};

const openJoDetail = async (joNumber: string) => {
  dialogJODetail.value = true;
  loadingJoDetail.value = true;
  joDetailData.value = null;
  try {
    const res = await fetch(`${API_BASE_URL}/Kasbon/GetJoExpenses.php?jo_number=${joNumber}`);
    const json = await res.json();
    if(json.s) joDetailData.value = json.d;
    else showMsg('Data JO detail tidak ditemukan', 'error');
  } catch {
    showMsg('Error koneksi', 'error');
  } finally {
    loadingJoDetail.value = false;
  }
};

const printJoPdf = (joNumber: string) => {
  window.open(`${API_BASE_URL}/Kasbon/ExportJoPdf.php?jo_number=${joNumber}`, '_blank');
};

const exportJoExcel = (joNumber: string) => {
  window.open(`${API_BASE_URL}/Kasbon/ExportJoExcel.php?jo_number=${joNumber}`, '_blank');
};

onMounted(() => {
  fetchList();
  fetchDashboardDebounced();
});

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (filterTimeout) clearTimeout(filterTimeout);
});
</script>

<template>
    <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <h2 class="text-h6 font-weight-bold text-white mb-0">Expense & Kasbon</h2>
      <div class="text-caption text-white opacity-90">Management, Summary, and Gross Profit Analysis.</div>
    </div>
    
    <v-tabs v-model="activeTab" bg-color="white" color="primary" grow density="compact">
      <v-tab value="summary" class="text-caption compact-tab"><ChartPieIcon size="16" class="mr-1"/> Summary & Analytics</v-tab>
      <v-tab value="transactions" class="text-caption compact-tab"><ListIcon size="16" class="mr-1"/> Transactions History</v-tab>
    </v-tabs>
  </v-card>

  <v-window v-model="activeTab">
    
        <v-window-item value="summary">
      <v-row class="mb-2">
        <v-col cols="12" sm="4">
          <v-card elevation="2" class="pa-3 bg-red-lighten-5 border-red compact-summary-card h-100">
            <div class="d-flex align-center gap-2">
              <div class="bg-red text-white pa-2 rounded-circle"><ReceiptIcon size="18" /></div>
              <div>
                <div class="text-caption text-grey-darken-1">Total Biaya (Cost)</div>
                <div class="text-subtitle-1 font-weight-bold text-red">Rp {{ Number(dashboardData.summary.cost).toLocaleString('id-ID') }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card elevation="2" class="pa-3 bg-blue-lighten-5 border-blue compact-summary-card h-100">
            <div class="d-flex align-center gap-2">
              <div class="bg-blue text-white pa-2 rounded-circle"><CurrencyDollarIcon size="18" /></div>
              <div>
                <div class="text-caption text-grey-darken-1">Total Tagihan (Bill)</div>
                <div class="text-subtitle-1 font-weight-bold text-blue">Rp {{ Number(dashboardData.summary.bill).toLocaleString('id-ID') }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card elevation="2" class="pa-3 bg-green-lighten-5 border-green compact-summary-card h-100">
            <div class="d-flex align-center gap-2">
              <div class="bg-green text-white pa-2 rounded-circle"><TrendingUpIcon size="18" /></div>
              <div>
                <div class="text-caption text-grey-darken-1">Gross Profit (GP)</div>
                <div class="text-subtitle-1 font-weight-bold text-green">Rp {{ Number(dashboardData.summary.gp).toLocaleString('id-ID') }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
            <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
              <div class="d-flex align-center">
                <TrendingUpIcon size="18" class="text-white mr-1" />
                <h3 class="text-subtitle-1 font-weight-bold text-white">Top 10 Job Order Profitability</h3>
              </div>
              
              <div class="d-flex align-center gap-2 flex-wrap">
                <div class="d-flex align-center gap-2 bg-white pa-1 rounded shadow-sm px-2 border-filter-date" style="height: 36px;">
                  <CalendarEventIcon size="16" class="text-grey" />
                  <input type="date" v-model="filterDate.start" class="date-input text-caption" />
                  <span class="text-grey text-caption">-</span>
                  <input type="date" v-model="filterDate.end" class="date-input text-caption" />
                </div>

                <v-btn color="white" variant="outlined" class="text-white border-white text-caption" size="x-small" @click="handleExport('excel')">
                  <DownloadIcon size="16" class="mr-1"/> All
                </v-btn>
              </div>
            </div>

            <v-table density="compact" class="border rounded-md compact-table">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-caption">Job Order</th>
                  <th class="text-caption">Customer</th>
                  <th class="text-right text-caption">Total Biaya</th>
                  <th class="text-right text-caption">Total Tagihan</th>
                  <th class="text-right text-caption">Gross Profit</th>
                  <th class="text-center text-caption">Margin %</th>
                  <th class="text-center text-caption">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="dashboardData.jo_performance.length === 0">
                  <td colspan="7" class="text-center py-2 text-caption text-grey">Belum ada data pada periode ini</td>
                </tr>
                <tr v-for="jo in dashboardData.jo_performance" :key="jo.jo_number" class="text-caption hover-row">
                  <td class="font-weight-bold text-primary">{{ jo.jo_number }}</td>
                  <td>{{ jo.customer }}</td>
                  <td class="text-right text-red">Rp {{ Number(jo.cost).toLocaleString('id-ID') }}</td>
                  <td class="text-right text-blue">Rp {{ Number(jo.bill).toLocaleString('id-ID') }}</td>
                  <td class="text-right font-weight-bold text-green">Rp {{ Number(jo.gp).toLocaleString('id-ID') }}</td>
                  <td class="text-center">
                    <v-chip size="x-small" :color="jo.margin > 20 ? 'green' : (jo.margin > 0 ? 'orange' : 'red')" variant="flat" class="text-uppercase font-weight-bold">
                      {{ jo.margin }}%
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <div class="d-flex justify-center gap-1">
                      <v-btn icon variant="text" color="info" size="x-small" @click="openJoDetail(jo.jo_number)" title="View Expense Detail">
                        <EyeIcon size="16"/>
                      </v-btn>
                      <v-btn icon variant="text" color="error" size="x-small" @click="printJoPdf(jo.jo_number)" title="Print PDF">
                        <PrinterIcon size="16"/>
                      </v-btn>
                      <v-btn icon variant="text" color="success" size="x-small" @click="exportJoExcel(jo.jo_number)" title="Export Excel">
                        <FileSpreadsheetIcon size="16"/>
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </v-window-item>

        <v-window-item value="transactions">
      <v-row>
        <v-col cols="12">
          <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
            <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
              <div class="d-flex align-center">
                <FileDescriptionIcon size="18" class="text-white mr-1" />
                <h3 class="text-subtitle-1 font-weight-bold text-white">Expense History</h3>
              </div>
              
              <div class="d-flex align-center gap-1">
                <v-text-field
                  v-model="search"
                  density="compact"
                  variant="solo-filled"
                  label="Search Transaction..."
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  single-line
                  bg-color="white"
                  class="rounded small-search-input search-border-fix"
                ></v-text-field>

                <v-btn icon variant="text" color="white" size="small" @click="fetchList" :loading="loadingList" title="Refresh">
                  <RefreshIcon size="18"/>
                </v-btn>

                <v-btn icon color="white" variant="flat" size="small" class="text-primary ml-1" @click="openCreateModal" title="New Expense Request">
                  <PlusIcon size="18"/>
                </v-btn>
              </div>
            </div>

            <v-data-table 
                            :headers="headers" 
                            :items="kasbonList" 
                            :loading="loadingList" 
                            density="compact" 
                            class="rounded-0 compact-data-table"
                        >
              <template v-slot:item.number="{ item }"><span class="font-weight-bold text-primary text-caption">{{ item.number }}</span></template>
              <template v-slot:item.amount="{ item }"><span class="font-weight-medium text-caption">Rp {{ Number(item.amount).toLocaleString('id-ID') }}</span></template>
              <template v-slot:item.transDate="{ item }"><span class="text-caption">{{ item.transDate }}</span></template>
              <template v-slot:item.description="{ item }"><span class="text-caption">{{ item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description }}</span></template>

              <template v-slot:item.status="{ item }">
                <v-chip size="x-small" variant="tonal" class="font-weight-bold text-uppercase" :color="item.status === 'APPROVED' ? 'green' : (item.status === 'REJECTED' ? 'red' : 'orange')">{{ item.status }}</v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-center">
                  <v-btn icon variant="text" color="primary" size="x-small" @click="openDetail(item.id)" title="Detail"><EyeIcon size="16"/></v-btn>
                  <v-btn v-if="item.status !== 'APPROVED'" icon variant="text" color="orange" size="x-small" @click="handleEdit(item)" title="Edit"><PencilIcon size="16"/></v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-window-item>
  </v-window>

    <v-dialog v-model="dialogForm" max-width="750" persistent>
    <v-card class="rounded-lg small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <span class="text-subtitle-1 font-weight-bold text-white">
          {{ isEditing ? 'Edit Expense Transaction' : 'New Expense Request' }}
        </span>
        <v-btn icon variant="text" color="white" size="small" @click="dialogForm = false"><XIcon size="18"/></v-btn>
      </div>
      
      <v-card-text class="pa-4" style="max-height: 75vh; overflow-y: auto;">
        <v-row dense>
          <v-col cols="12" md="6">
            <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Transaction Info</h6>
            <v-text-field v-model="form.transDate" type="date" label="Transaction Date *" variant="outlined" density="compact" hide-details class="mb-2"></v-text-field>
            <div class="mb-2">
              <AsyncSelect 
                label="Source Fund (Kas/Bank) *" 
                :apiEndpoint="`${API_BASE_URL}/Kasbon/MasterGlAccount.php`" 
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
          </v-col>
          <v-col cols="12" md="6">
            <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Request Details</h6>
            <v-textarea v-model="form.description" label="General Description" variant="outlined" rows="3" auto-grow density="compact" hide-details class="small-textarea"></v-textarea>
          </v-col>
        </v-row>
        <div class="mt-2">
          <v-card variant="outlined" class="rounded-md bg-grey-lighten-5">
            <v-table density="compact" class="compact-detail-table">
              <thead>
                <tr class="text-caption">
                  <th width="30">#</th>
                  <th width="200">Target Account</th>
                  <th>Notes</th>
                  <th width="150">Job Order (Ref)</th>
                  <th width="120" class="text-right">Biaya (Cost)</th>
                  <th width="120" class="text-right">Tagihan (Bill)</th>
                  <th width="30"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in form.items" :key="item.id" class="text-caption">
                  <td class="text-center pt-2">{{ idx + 1 }}</td>
                  <td class="pt-1">
                    <AsyncSelect 
                      :apiEndpoint="`${API_BASE_URL}/Kasbon/MasterGlAccount.php`" 
                      v-model="item.accountNo" 
                      label="Akun..." 
                      item-title="name" 
                      item-value="no" 
                      @change="(obj: any) => onItemChange(idx, obj)" 
                                        density="compact"
                                        hide-details
                                        class="small-input-in-table"
                    />
                  </td>
                  <td>
                    <v-text-field v-model="item.notes" placeholder="Note..." variant="outlined" density="compact" hide-details bg-color="white" class="small-input-in-table"></v-text-field>
                  </td>
                  <td class="pt-1">
                    <AsyncSelect 
                      :apiEndpoint="`${API_BASE_URL}/JobOrder/List.php`" 
                      v-model="item.jobOrderNo" 
                      label="Pilih JO..." 
                      item-title="number" 
                      item-value="number" 
                      @change="(obj: any) => onJOChange(idx, obj)" 
                                        density="compact"
                                        hide-details
                                        class="small-input-in-table"
                    />
                  </td>
                  <td>
                    <v-text-field v-model.number="item.amount" type="number" variant="outlined" density="compact" hide-details class="text-right-input small-input-in-table bg-white" prefix="Rp"></v-text-field>
                  </td>
                  <td>
                    <v-text-field v-model.number="item.billAmount" type="number" variant="outlined" density="compact" hide-details class="text-right-input small-input-in-table bg-blue-lighten-5" prefix="Rp"></v-text-field>
                  </td>
                  <td class="text-center pt-2">
                    <v-btn icon color="error" variant="text" size="x-small" @click="removeItem(idx)" :disabled="form.items.length <= 1"><TrashIcon size="16"/></v-btn>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-white text-subtitle-2">
                  <td colspan="4" class="text-right font-weight-bold pt-2 pb-2">TOTAL:</td>
                  <td class="text-right font-weight-bold pt-2 pb-2">Rp {{ totalAmount.toLocaleString('id-ID') }}</td>
                  <td class="text-right font-weight-bold text-blue pt-2 pb-2">Rp {{ totalBill.toLocaleString('id-ID') }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </v-table>
            <v-divider></v-divider>
            <div class="px-2 py-2 bg-white">
              <v-btn color="primary" variant="tonal" size="x-small" prepend-icon="mdi-plus" @click="addItem" class="text-caption">Add Row</v-btn>
            </div>
          </v-card>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="pa-3 justify-end">
        <v-btn variant="outlined" color="error" size="small" @click="dialogForm = false" class="text-caption">Batal</v-btn>
        <v-btn color="primary" variant="flat" size="small" @click="handleSubmit" :loading="saving" class="text-caption">
          <SendIcon size="16" class="mr-1"/> {{ isEditing ? 'Simpan Perubahan' : 'Simpan & Ajukan' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

    <v-dialog v-model="dialogDetail" max-width="600" scrollable>
    <v-card class="rounded-lg small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <span class="text-subtitle-1 font-weight-bold text-white">Transaction Detail</span>
        <v-btn icon variant="text" color="white" size="small" @click="dialogDetail = false"><XIcon size="18"/></v-btn>
      </div>
      <v-card-text class="pa-0 bg-grey-lighten-5 dialog-detail-content" style="max-height: 60vh;">
        <div v-if="loadingDetail" class="text-center py-6 text-caption">Loading...</div>
        <div v-else-if="detailData">
          <div class="bg-white pa-4 mb-3 shadow-sm border-bottom">
            <v-row dense>
              <v-col cols="12" sm="6" class="py-1">
                <div class="text-overline text-medium-emphasis mb-0 text-xsmall">Transaction Info</div>
                <div class="text-subtitle-1 font-weight-bold text-primary mb-1">{{ detailData.number }}</div>
                <div class="d-flex align-center gap-1 mb-1 text-grey-darken-1 text-caption"><CalendarEventIcon size="14" /><span>{{ detailData.transDate }}</span></div>
                <v-chip :color="detailData.status === 'APPROVED' ? 'green' : (detailData.status === 'REJECTED' ? 'red' : 'orange')" size="x-small" class="font-weight-bold text-uppercase">{{ detailData.status }}</v-chip>
              </v-col>
              <v-col cols="12" sm="6" class="text-sm-right py-1">
                <div class="text-overline text-medium-emphasis mb-1 text-xsmall">Source Fund</div>
                <div class="text-subtitle-2 font-weight-bold">{{ detailData.bank?.name }}</div>
                <div class="bg-grey-lighten-4 pa-1 rounded border font-italic text-xsmall text-left mt-2">{{ detailData.description || 'No description' }}</div>
              </v-col>
             </v-row>
          </div>
          <div class="px-4 pb-4">
            <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
              <v-table density="compact" class="compact-detail-table">
                <thead class="bg-grey-lighten-4">
                  <tr class="text-caption"><th>Account</th><th>Notes / JO Ref</th><th class="text-right">Cost</th><th class="text-right">Bill</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(d, i) in detailData.detailAccount" :key="i" class="text-caption">
                    <td><div class="font-weight-medium text-body-2">{{ d.account?.name }}</div><div class="text-xsmall font-mono text-grey">{{ d.account?.no }}</div></td>
                    <td><div>{{ d.detailNotes || '-' }}</div><div v-if="d.jobOrder" class="text-xsmall text-primary font-weight-bold">JO: {{ d.jobOrder.number }}</div></td>
                    <td class="text-right">Rp {{ Number(d.amount).toLocaleString('id-ID') }}</td>
                    <td class="text-right text-blue">Rp {{ Number(d.billAmount).toLocaleString('id-ID') }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="bg-white pa-3 justify-end">
        <v-btn variant="text" size="small" @click="dialogDetail = false" class="text-caption">Close</v-btn>
        <template v-if="detailData?.status === 'WAITING_APPROVAL' && canApprove">
          <v-btn color="error" variant="tonal" size="small" @click="handleReject(detailData.id)" :loading="rejecting" class="mr-1 text-caption"><BanIcon size="16" class="mr-1"/> Reject</v-btn>
          <v-btn color="success" variant="flat" size="small" @click="handleApprove(detailData.id)" :loading="approving" class="text-caption"><CheckIcon size="16" class="mr-1"/> Approve</v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialogJODetail" max-width="800" scrollable>
    <v-card class="rounded-lg small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <FileAnalyticsIcon size="20" class="text-white mr-2" />
          <div>
            <span class="text-subtitle-1 font-weight-bold text-white d-block">Expense History per Job Order</span>
            <span class="text-caption text-white opacity-80" v-if="joDetailData">{{ joDetailData.jo_info.transaction_number }} - {{ joDetailData.jo_info.customer_name }}</span>
          </div>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialogJODetail = false"><XIcon size="18"/></v-btn>
      </div>
      
      <v-card-text class="pa-0 bg-grey-lighten-5 dialog-detail-content" style="max-height: 70vh;">
        <div v-if="loadingJoDetail" class="text-center py-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="text-caption mt-2">Loading details...</div>
        </div>
        
        <div v-else-if="joDetailData">
          <div class="pa-4">
            <v-card variant="outlined" class="mb-4 bg-white">
              <div class="d-flex justify-space-between pa-3 bg-grey-lighten-4 border-bottom">
                 <span class="text-caption font-weight-bold">SUMMARY PROFITABILITY</span>
              </div>
              <v-row no-gutters class="pa-2">
                <v-col cols="4" class="text-center border-e px-2">
                  <div class="text-caption text-grey">Total Tagihan (Bill)</div>
                  <div class="text-subtitle-2 font-weight-bold text-blue">Rp {{ Number(joDetailData.summary.total_bill).toLocaleString('id-ID') }}</div>
                </v-col>
                <v-col cols="4" class="text-center border-e px-2">
                  <div class="text-caption text-grey">Total Biaya (Cost)</div>
                  <div class="text-subtitle-2 font-weight-bold text-red">Rp {{ Number(joDetailData.summary.total_cost).toLocaleString('id-ID') }}</div>
                </v-col>
                <v-col cols="4" class="text-center px-2">
                  <div class="text-caption text-grey">Gross Profit</div>
                  <div class="text-subtitle-2 font-weight-bold text-green">Rp {{ Number(joDetailData.summary.gross_profit).toLocaleString('id-ID') }}</div>
                </v-col>
              </v-row>
            </v-card>

            <div class="text-caption font-weight-bold mb-2 ml-1 text-grey-darken-2">RINCIAN PENGELUARAN (EXPENSE LIST)</div>
            <v-card variant="outlined" class="overflow-hidden border bg-white">
              <v-table density="compact" class="compact-detail-table">
                <thead class="bg-grey-lighten-4">
                  <tr>
                    <th class="text-center">Date</th>
                    <th>Trans No</th>
                    <th>Description</th>
                    <th class="text-right">Cost Amount</th>
                    <th class="text-right">Bill Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="joDetailData.expenses.length === 0">
                    <td colspan="5" class="text-center text-caption text-grey py-4">Tidak ada data pengeluaran untuk JO ini</td>
                  </tr>
                  <tr v-for="(exp, i) in joDetailData.expenses" :key="i">
                    <td class="text-center text-caption">{{ format(new Date(exp.trans_date), 'dd/MM/yyyy') }}</td>
                    <td class="text-caption font-weight-medium">{{ exp.transaction_number }}</td>
                    <td class="text-caption text-grey-darken-2">{{ exp.notes || '-' }}</td>
                    <td class="text-right text-caption">Rp {{ Number(exp.cost).toLocaleString('id-ID') }}</td>
                    <td class="text-right text-caption text-blue">Rp {{ Number(exp.bill).toLocaleString('id-ID') }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      <v-card-actions class="bg-white pa-3 justify-end">
        <v-btn variant="outlined" color="primary" size="small" @click="dialogJODetail = false" class="text-caption">Close</v-btn>
        <v-btn color="error" variant="flat" size="small" @click="printJoPdf(joDetailData?.jo_info.transaction_number)" :disabled="!joDetailData" class="text-caption ml-2">
           <PrinterIcon size="16" class="mr-1"/> Print PDF
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.text-right-input :deep(input) { text-align: right; font-size: 0.75rem; }
.date-input { border: none; outline: none; font-size: 0.75rem; width: 85px; background: transparent; }
.border-red { border-left: 3px solid #ef5350; }
.border-blue { border-left: 3px solid #42a5f5; }
.border-green { border-left: 3px solid #66bb6a; }
.border-white { border-color: rgba(255,255,255,0.7) !important; }

.compact-header-card :deep(.text-h6) { font-size: 1rem !important; }
.compact-tab :deep(.v-tab__content) { font-size: 0.75rem !important; }

.compact-summary-card :deep(.text-subtitle-1) { font-size: 0.9rem !important; }
.compact-summary-card :deep(.text-caption) { font-size: 0.65rem !important; }
.compact-summary-card :deep(.v-icon) { font-size: 18px; }

.border-filter-date {
    border: 1px solid #ddd;
}

.compact-data-table :deep(.v-data-table-header) th {
    height: 35px !important;
}
.compact-data-table :deep(.v-data-table__td) {
    font-size: 0.75rem !important;
    height: 38px !important;
}

.compact-table :deep(th) {
    font-size: 0.7rem !important;
    padding: 6px 8px !important;
}
.compact-table :deep(td) {
    padding: 6px 8px !important;
}

.search-border-fix {
    border: 1px solid rgba(0,0,0,0.12); 
    border-radius: 4px;
}
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
.small-search-input :deep(.v-field--variant-solo-filled) {
    padding-left: 0 !important;
    padding-right: 0 !important;
}

.small-input :deep(.v-field) { min-height: 36px !important; }
.small-input :deep(.v-label) { font-size: 0.8rem; }
.small-input :deep(input) { font-size: 0.85rem; }
.small-textarea :deep(.v-field__input) { padding-top: 6px !important; padding-bottom: 6px !important; min-height: 50px !important; }

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

.compact-detail-table :deep(th) {
    font-size: 0.7rem !important;
    padding: 6px 8px !important;
    height: 30px !important;
}
.compact-detail-table :deep(td) {
    padding: 4px 8px !important;
}

.text-xsmall { font-size: 0.65rem !important; }
.dialog-detail-content { font-size: 0.75rem; }
.dialog-detail-content :deep(.v-table td) { padding: 4px 8px !important; }
.dialog-detail-content :deep(.v-table th) { padding: 6px 8px !important; }
.hover-row:hover { background-color: #f5f5f5; }
</style>