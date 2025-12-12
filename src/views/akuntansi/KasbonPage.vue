<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
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
    ListIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";
const authStore = useAuthStore();

// --- STATE TABS & LAYOUT ---
const activeTab = ref('summary');

// --- STATE FILTER & DASHBOARD ---
// Default 1 Bulan Terakhir
const filterDate = reactive({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
});

const dashboardData = ref({
    summary: { cost: 0, bill: 0, gp: 0 },
    jo_performance: [] as any[]
});

// --- STATE LIST ---
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

// --- STATE FORM (MODAL) ---
const dialogForm = ref(false); // Modal Form
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

// --- STATE DETAIL (MODAL) ---
const dialogDetail = ref(false);
const detailData = ref<any>(null);
const loadingDetail = ref(false);
const approving = ref(false);
const rejecting = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
    snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

// --- COMPUTED ---
const totalAmount = computed(() => form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
const totalBill = computed(() => form.items.reduce((sum, item) => sum + (Number(item.billAmount) || 0), 0));
const canApprove = computed(() => authStore.userData?.approvals?.includes('KASBON'));

// --- METHODS: DASHBOARD & EXPORT ---
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

// --- METHODS: LIST ---
const fetchList = async () => {
    loadingList.value = true;
    try {
        fetchDashboard(); // Refresh dashboard data too
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

let searchTimeout: any;
watch(search, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchList, 600);
});

watch(() => [filterDate.start, filterDate.end], () => {
    fetchDashboard();
});

// --- METHODS: FORM ---
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
    if (obj) form.items[idx].accountName = obj.name;
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
            
            dialogForm.value = true; // Buka Modal
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
            dialogForm.value = false; // Tutup Modal
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

onMounted(fetchList);
</script>

<template>
    <v-card elevation="10" rounded="lg" class="mb-6 overflow-hidden">
        <div class="bg-gradient-smooth px-6 py-8">
            <h2 class="text-h4 font-weight-bold text-white mb-1">Expense & Kasbon</h2>
            <div class="text-subtitle-1 text-white opacity-90">Management, Summary, and Gross Profit Analysis.</div>
        </div>
        
        <v-tabs v-model="activeTab" bg-color="white" color="primary" grow>
            <v-tab value="summary" class="text-subtitle-1"><ChartPieIcon size="20" class="mr-2"/> Summary & Analytics</v-tab>
            <v-tab value="transactions" class="text-subtitle-1"><ListIcon size="20" class="mr-2"/> Transactions History</v-tab>
        </v-tabs>
    </v-card>

    <v-window v-model="activeTab">
        
        <v-window-item value="summary">
            <v-row class="mb-4">
                <v-col cols="12" md="4">
                    <v-card elevation="2" class="pa-4 bg-red-lighten-5 border-red h-100">
                        <div class="d-flex align-center gap-3">
                            <div class="bg-red text-white pa-3 rounded-circle"><ReceiptIcon /></div>
                            <div>
                                <div class="text-subtitle-2 text-grey-darken-1">Total Biaya (Cost)</div>
                                <div class="text-h5 font-weight-bold text-red">Rp {{ Number(dashboardData.summary.cost).toLocaleString('id-ID') }}</div>
                            </div>
                        </div>
                    </v-card>
                </v-col>
                <v-col cols="12" md="4">
                    <v-card elevation="2" class="pa-4 bg-blue-lighten-5 border-blue h-100">
                        <div class="d-flex align-center gap-3">
                            <div class="bg-blue text-white pa-3 rounded-circle"><CurrencyDollarIcon /></div>
                            <div>
                                <div class="text-subtitle-2 text-grey-darken-1">Total Tagihan (Bill)</div>
                                <div class="text-h5 font-weight-bold text-blue">Rp {{ Number(dashboardData.summary.bill).toLocaleString('id-ID') }}</div>
                            </div>
                        </div>
                    </v-card>
                </v-col>
                <v-col cols="12" md="4">
                    <v-card elevation="2" class="pa-4 bg-green-lighten-5 border-green h-100">
                        <div class="d-flex align-center gap-3">
                            <div class="bg-green text-white pa-3 rounded-circle"><TrendingUpIcon /></div>
                            <div>
                                <div class="text-subtitle-2 text-grey-darken-1">Gross Profit (GP)</div>
                                <div class="text-h5 font-weight-bold text-green">Rp {{ Number(dashboardData.summary.gp).toLocaleString('id-ID') }}</div>
                            </div>
                        </div>
                    </v-card>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="12">
                    <v-card elevation="10" rounded="lg" class="border overflow-hidden">
                        <div class="bg-gradient-smooth px-6 py-4 d-flex align-center justify-space-between flex-wrap gap-3">
                            <div class="d-flex align-center">
                                <TrendingUpIcon size="24" class="text-white mr-2" />
                                <h3 class="text-h6 font-weight-bold text-white">Top 10 Job Order Profitability</h3>
                            </div>
                            
                            <div class="d-flex align-center gap-3 flex-wrap">
                                <div class="d-flex align-center gap-2 bg-white pa-1 rounded shadow-sm px-3" style="height: 40px;">
                                    <CalendarEventIcon size="18" class="text-grey" />
                                    <input type="date" v-model="filterDate.start" class="date-input text-body-2" />
                                    <span class="text-grey text-caption">-</span>
                                    <input type="date" v-model="filterDate.end" class="date-input text-body-2" />
                                </div>

                                <v-btn color="white" variant="outlined" class="text-white border-white" size="small" @click="handleExport('excel')">
                                    <DownloadIcon size="18" class="mr-1"/> Excel
                                </v-btn>
                                <v-btn color="white" variant="outlined" class="text-white border-white" size="small" @click="handleExport('pdf')">
                                    <PrinterIcon size="18" class="mr-1"/> Print
                                </v-btn>
                            </div>
                        </div>

                        <v-table density="compact" class="border rounded-md">
                            <thead>
                                <tr class="bg-grey-lighten-4">
                                    <th>Job Order</th>
                                    <th>Customer</th>
                                    <th class="text-right">Total Biaya</th>
                                    <th class="text-right">Total Tagihan</th>
                                    <th class="text-right">Gross Profit</th>
                                    <th class="text-center">Margin %</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="dashboardData.jo_performance.length === 0">
                                    <td colspan="6" class="text-center py-4 text-grey">Belum ada data pada periode ini</td>
                                </tr>
                                <tr v-for="jo in dashboardData.jo_performance" :key="jo.jo_number">
                                    <td class="font-weight-bold text-primary">{{ jo.jo_number }}</td>
                                    <td>{{ jo.customer }}</td>
                                    <td class="text-right text-red">Rp {{ Number(jo.cost).toLocaleString('id-ID') }}</td>
                                    <td class="text-right text-blue">Rp {{ Number(jo.bill).toLocaleString('id-ID') }}</td>
                                    <td class="text-right font-weight-bold text-green">Rp {{ Number(jo.gp).toLocaleString('id-ID') }}</td>
                                    <td class="text-center">
                                        <v-chip size="x-small" :color="jo.margin > 20 ? 'green' : (jo.margin > 0 ? 'orange' : 'red')" variant="flat">
                                            {{ jo.margin }}%
                                        </v-chip>
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
                    <v-card elevation="10" rounded="lg" class="border overflow-hidden">
                        <div class="bg-gradient-smooth px-6 py-4 d-flex align-center justify-space-between flex-wrap gap-2">
                            <div class="d-flex align-center">
                                <FileDescriptionIcon size="24" class="text-white mr-2" />
                                <h3 class="text-h6 font-weight-bold text-white">Expense History</h3>
                            </div>
                            
                            <div class="d-flex align-center gap-2">
                                <div class="bg-white rounded px-2 d-flex align-center" style="height: 40px; min-width: 250px;">
                                    <v-icon icon="mdi-magnify" color="grey" size="small" class="mr-2"></v-icon>
                                    <input 
                                        type="text" 
                                        v-model="search" 
                                        placeholder="Search Transaction..." 
                                        class="search-input text-body-2"
                                        style="outline: none; width: 100%;"
                                    />
                                </div>

                                <v-btn icon variant="text" color="white" @click="fetchList" :loading="loadingList" title="Refresh">
                                    <RefreshIcon size="20"/>
                                </v-btn>

                                <v-btn icon color="white" variant="flat" class="text-primary ml-2" @click="openCreateModal" title="New Expense Request">
                                    <PlusIcon size="24"/>
                                </v-btn>
                            </div>
                        </div>

                        <v-data-table :headers="headers" :items="kasbonList" :loading="loadingList" density="comfortable" class="rounded-0">
                            <template v-slot:item.number="{ item }"><span class="font-weight-bold text-primary">{{ item.number }}</span></template>
                            <template v-slot:item.amount="{ item }"><span class="font-weight-medium">Rp {{ Number(item.amount).toLocaleString('id-ID') }}</span></template>
                            <template v-slot:item.status="{ item }">
                                <v-chip size="small" variant="tonal" class="font-weight-bold" :color="item.status === 'APPROVED' ? 'green' : (item.status === 'REJECTED' ? 'red' : 'orange')">{{ item.status }}</v-chip>
                            </template>
                            <template v-slot:item.actions="{ item }">
                                <div class="d-flex justify-center">
                                    <v-btn icon variant="text" color="primary" size="small" @click="openDetail(item.id)" title="Detail"><EyeIcon size="20"/></v-btn>
                                    <v-btn v-if="item.status !== 'APPROVED'" icon variant="text" color="orange" size="small" @click="handleEdit(item)" title="Edit"><PencilIcon size="20"/></v-btn>
                                </div>
                            </template>
                        </v-data-table>
                    </v-card>
                </v-col>
            </v-row>
        </v-window-item>
    </v-window>

    <v-dialog v-model="dialogForm" max-width="900" persistent>
        <v-card class="rounded-lg">
            <div class="bg-gradient-smooth px-6 py-4 d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold text-white">
                    {{ isEditing ? 'Edit Expense Transaction' : 'New Expense Request' }}
                </span>
                <v-btn icon variant="text" color="white" @click="dialogForm = false"><XIcon size="24"/></v-btn>
            </div>
            
            <v-card-text class="pa-6" style="max-height: 80vh; overflow-y: auto;">
                 <v-row>
                    <v-col cols="12" md="6">
                        <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">Transaction Info</h6>
                        <v-text-field v-model="form.transDate" type="date" label="Transaction Date *" variant="outlined" density="comfortable"></v-text-field>
                        <div class="mb-4">
                            <AsyncSelect label="Source Fund (Kas/Bank) *" :apiEndpoint="`${API_BASE_URL}/Kasbon/MasterGlAccount.php`" filterType="CASH_BANK" v-model="form.bankName" item-title="name" item-value="name" @change="(o: any) => { if(o) { form.bankId = o.id; form.bankName = o.name; } }" />
                        </div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">Request Details</h6>
                        <v-textarea v-model="form.description" label="General Description" variant="outlined" rows="3" auto-grow></v-textarea>
                    </v-col>
                </v-row>
                <div class="mt-4">
                    <v-card variant="outlined" class="rounded-md bg-grey-lighten-5">
                        <v-table density="compact" class="bg-transparent">
                            <thead>
                                <tr>
                                    <th width="30">#</th>
                                    <th width="250">Target Account</th>
                                    <th>Notes</th>
                                    <th width="200">Job Order (Ref)</th>
                                    <th width="150" class="text-right">Biaya (Cost)</th>
                                    <th width="150" class="text-right">Tagihan (Bill)</th>
                                    <th width="50"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, idx) in form.items" :key="item.id">
                                    <td class="text-center pt-3">{{ idx + 1 }}</td>
                                    <td class="pt-2">
                                        <AsyncSelect :apiEndpoint="`${API_BASE_URL}/Kasbon/MasterGlAccount.php`" v-model="item.accountNo" label="Akun..." item-title="name" item-value="no" @change="(obj: any) => onItemChange(idx, obj)" />
                                    </td>
                                    <td>
                                        <v-text-field v-model="item.notes" placeholder="Note..." variant="outlined" density="compact" hide-details bg-color="white"></v-text-field>
                                    </td>
                                    <td class="pt-2">
                                        <AsyncSelect :apiEndpoint="`${API_BASE_URL}/JobOrder/List.php`" v-model="item.jobOrderNo" label="Pilih JO..." item-title="number" item-value="number" @change="(obj: any) => onJOChange(idx, obj)" />
                                    </td>
                                    <td>
                                        <v-text-field v-model.number="item.amount" type="number" variant="outlined" density="compact" hide-details class="text-right-input bg-white" prefix="Rp"></v-text-field>
                                    </td>
                                    <td>
                                        <v-text-field v-model.number="item.billAmount" type="number" variant="outlined" density="compact" hide-details class="text-right-input bg-blue-lighten-5" prefix="Rp"></v-text-field>
                                    </td>
                                    <td class="text-center">
                                        <v-btn icon color="error" variant="text" size="small" @click="removeItem(idx)" :disabled="form.items.length <= 1"><TrashIcon size="18"/></v-btn>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="bg-white">
                                    <td colspan="4" class="text-right font-weight-bold pt-3">TOTAL:</td>
                                    <td class="text-right font-weight-bold pt-3">Rp {{ totalAmount.toLocaleString('id-ID') }}</td>
                                    <td class="text-right font-weight-bold text-blue pt-3">Rp {{ totalBill.toLocaleString('id-ID') }}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </v-table>
                        <v-divider></v-divider>
                        <div class="px-2 py-2 bg-white">
                            <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="addItem">Add Row</v-btn>
                        </div>
                    </v-card>
                </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="pa-4 justify-end">
                <v-btn variant="outlined" color="error" @click="dialogForm = false">Batal</v-btn>
                <v-btn color="primary" variant="flat" @click="handleSubmit" :loading="saving">
                    <SendIcon size="18" class="mr-2"/> {{ isEditing ? 'Simpan Perubahan' : 'Simpan & Ajukan' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDetail" max-width="800" scrollable>
        <v-card class="rounded-lg">
            <div class="bg-gradient-smooth px-6 py-4 d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold text-white">Transaction Detail</span>
                <v-btn icon variant="text" color="white" @click="dialogDetail = false"><XIcon size="24"/></v-btn>
            </div>
            <v-card-text class="pa-0 bg-grey-lighten-5" style="max-height: 70vh;">
                <div v-if="loadingDetail" class="text-center py-10">Loading...</div>
                <div v-else-if="detailData">
                    <div class="bg-white pa-6 mb-4 shadow-sm border-bottom">
                         <v-row>
                            <v-col cols="12" sm="6">
                                <div class="text-overline text-medium-emphasis mb-1">Transaction Info</div>
                                <div class="text-h5 font-weight-bold text-primary mb-1">{{ detailData.number }}</div>
                                <div class="d-flex align-center gap-2 mb-2 text-grey-darken-1"><CalendarEventIcon size="18" /><span>{{ detailData.transDate }}</span></div>
                                <v-chip :color="detailData.status === 'APPROVED' ? 'green' : (detailData.status === 'REJECTED' ? 'red' : 'orange')" size="small" class="font-weight-bold">{{ detailData.status }}</v-chip>
                            </v-col>
                            <v-col cols="12" sm="6" class="text-sm-right">
                                <div class="text-overline text-medium-emphasis mb-1">Source Fund</div>
                                <div class="text-h6 font-weight-bold">{{ detailData.bank?.name }}</div>
                                <div class="bg-grey-lighten-4 pa-2 rounded border font-italic text-caption text-left mt-2">{{ detailData.description || 'No description' }}</div>
                            </v-col>
                         </v-row>
                    </div>
                    <div class="px-6 pb-6">
                        <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
                            <v-table density="compact">
                                <thead class="bg-grey-lighten-4">
                                    <tr><th>Account</th><th>Notes / JO Ref</th><th class="text-right">Cost</th><th class="text-right">Bill</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(d, i) in detailData.detailAccount" :key="i">
                                        <td><div class="font-weight-medium">{{ d.account?.name }}</div><div class="text-caption font-mono text-grey">{{ d.account?.no }}</div></td>
                                        <td><div>{{ d.detailNotes || '-' }}</div><div v-if="d.jobOrder" class="text-caption text-primary font-weight-bold">JO: {{ d.jobOrder.number }}</div></td>
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
            <v-card-actions class="bg-white pa-4 justify-end">
                <v-btn variant="text" @click="dialogDetail = false">Close</v-btn>
                <template v-if="detailData?.status === 'WAITING_APPROVAL' && canApprove">
                    <v-btn color="error" variant="tonal" @click="handleReject(detailData.id)" :loading="rejecting" class="mr-2"><BanIcon size="18" class="mr-2"/> Reject</v-btn>
                    <v-btn color="success" variant="flat" @click="handleApprove(detailData.id)" :loading="approving"><CheckIcon size="18" class="mr-2"/> Approve</v-btn>
                </template>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.text-right-input :deep(input) { text-align: right; }
.date-input { border: none; outline: none; font-size: 14px; width: 110px; background: transparent; }
.border-red { border-left: 4px solid #ef5350; }
.border-blue { border-left: 4px solid #42a5f5; }
.border-green { border-left: 4px solid #66bb6a; }
.border-white { border-color: rgba(255,255,255,0.7) !important; }
</style>