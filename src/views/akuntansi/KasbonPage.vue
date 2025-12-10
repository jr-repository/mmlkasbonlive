<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { format } from 'date-fns';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
    PlusIcon, 
    TrashIcon, 
    EyeIcon, 
    RefreshIcon, 
    WalletIcon, 
    SendIcon, 
    AlignLeftIcon,
    XIcon,
    CalendarEventIcon,
    FileDescriptionIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

// --- STATE LIST ---
const loadingList = ref(false);
const kasbonList = ref<any[]>([]);
const search = ref('');

const headers = [
    { title: 'No', key: 'index', align: 'center' as const, sortable: false },
    { title: 'No. Transaksi', key: 'number', align: 'start' as const },
    { title: 'Tanggal', key: 'transDate', align: 'start' as const },
    { title: 'Keterangan', key: 'description', align: 'start' as const },
    { title: 'Total Amount', key: 'amount', align: 'end' as const },
    { title: 'Status', key: 'status', align: 'center' as const },
    { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false },
];

// --- STATE FORM ---
const form = reactive({
    transDate: format(new Date(), 'yyyy-MM-dd'),
    bankId: null as number | null,
    bankName: '',
    description: '',
    items: [{ id: Date.now(), accountNo: '', accountName: '', amount: 0, notes: '' }]
});
const saving = ref(false);

// --- STATE MODAL ---
const dialogDetail = ref(false);
const detailData = ref<any>(null);
const loadingDetail = ref(false);

// --- SNACKBAR ---
const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
    snackbar.text = text;
    snackbar.color = color;
    snackbar.show = true;
};

// --- COMPUTED ---
const totalAmount = computed(() => {
    return form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

// --- METHODS ---
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

let searchTimeout: any;
watch(search, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchList, 600);
});

// Form Methods
const addItem = () => {
    form.items.push({ id: Date.now(), accountNo: '', accountName: '', amount: 0, notes: '' });
};

const removeItem = (idx: number) => {
    if (form.items.length > 1) form.items.splice(idx, 1);
};

const onItemChange = (idx: number, obj: any) => {
    if (obj) {
        form.items[idx].accountName = obj.name;
    }
};

const onBankChange = (obj: any) => {
    if (obj) {
        form.bankId = obj.id;
        form.bankName = obj.name;
    }
};

const handleSubmit = async () => {
    if (!form.bankId) return showMsg('Pilih Sumber Dana (Kas/Bank)', 'error');
    if (form.items.some(i => !i.accountNo || i.amount <= 0)) return showMsg('Lengkapi rincian biaya', 'error');

    saving.value = true;
    try {
        const payload = {
            transDate: format(new Date(form.transDate), 'dd/MM/yyyy'),
            bankId: form.bankId,
            description: form.description || "Pengeluaran Kasbon/Biaya via Web",
            detailAccount: form.items.map(d => ({
                accountNo: d.accountNo,
                amount: d.amount,
                detailNotes: d.notes || form.description
            }))
        };

        const res = await fetch(`${API_BASE_URL}/Kasbon/Transaksi.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.s) {
            showMsg('Kasbon Berhasil Disimpan!');
            form.transDate = format(new Date(), 'yyyy-MM-dd');
            form.description = '';
            form.items = [{ id: Date.now(), accountNo: '', accountName: '', amount: 0, notes: '' }];
            fetchList();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showMsg(json.d?.message || 'Gagal simpan', 'error');
        }
    } catch (e: any) {
        showMsg(e.message || 'Error koneksi', 'error');
    } finally {
        saving.value = false;
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
            <div class="d-flex align-center gap-3">
               
                <div>
                    <h2 class="text-h4 font-weight-bold text-white mb-1" style="text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Expense & Kasbon
                    </h2>
                    <div class="text-subtitle-1 text-white opacity-90">
                        Manage cash disbursements and expense requests.
                    </div>
                </div>
            </div>
        </div>
    </v-card>

    <v-row>
        <v-col cols="12">
            <v-card elevation="10" rounded="lg" class="border overflow-hidden">
                <div class="bg-gradient-smooth px-6 py-4 d-flex align-center">
                    <PlusIcon size="24" class="text-white mr-2" />
                    <span class="text-h6 font-weight-bold text-white">New Expense Request</span>
                </div>

                <v-card-text class="pa-6">
                    <v-row>
                        <v-col cols="12" md="6">
                            <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">Transaction Info</h6>
                            <v-text-field
                                v-model="form.transDate"
                                type="date"
                                label="Transaction Date *"
                                variant="outlined"
                                color="primary"
                                density="comfortable"
                                prepend-inner-icon="mdi-calendar"
                            ></v-text-field>

                            <div class="mb-4">
                                <AsyncSelect
                                    label="Source Fund (Kas/Bank) *"
                                    :apiEndpoint="`${API_BASE_URL}/Kasbon/MasterGlAccount.php`"
                                    filterType="CASH_BANK"
                                    v-model="form.bankName" 
                                    item-title="name"
                                    item-value="name"
                                    @change="onBankChange"
                                />
                                <div class="text-caption text-medium-emphasis mt-1 pl-1">
                                    <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
                                    Select the source account for this expense
                                </div>
                            </div>
                        </v-col>
                        <v-col cols="12" md="6">
                            <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">Request Details</h6>
                            <v-text-field
                                label="Request Number"
                                placeholder="Auto-generated by System"
                                disabled
                                variant="outlined"
                                density="comfortable"
                                bg-color="grey-lighten-4"
                                prepend-inner-icon="mdi-pound"
                                class="mb-2"
                            ></v-text-field>

                            <v-textarea
                                v-model="form.description"
                                label="General Description"
                                placeholder="Purpose of this expense..."
                                variant="outlined"
                                color="primary"
                                rows="3"
                                auto-grow
                            ></v-textarea>
                        </v-col>
                    </v-row>

                    <div class="mt-4">
                        <v-card variant="outlined" class="rounded-md bg-grey-lighten-5">
                            <div class="d-flex justify-space-between align-center px-4 pt-3 pb-2 bg-white border-bottom">
                                <span class="text-subtitle-2 font-weight-bold text-uppercase text-grey-darken-1">
                                    Expense Allocation Details
                                </span>
                            </div>
                            
                            <v-table density="compact" class="bg-transparent">
                                <thead>
                                    <tr>
                                        <th width="40" class="text-center font-weight-bold text-primary">#</th>
                                        <th class="font-weight-bold text-primary">Target Account (Cost Center)</th>
                                        <th class="font-weight-bold text-primary">Specific Notes</th>
                                        <th width="180" class="text-right font-weight-bold text-primary">Amount (Rp)</th>
                                        <th width="50"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in form.items" :key="item.id">
                                        <td class="text-center pt-3 text-medium-emphasis">{{ idx + 1 }}</td>
                                        <td class="pt-2">
                                            <AsyncSelect
                                                :apiEndpoint="`${API_BASE_URL}/Kasbon/MasterGlAccount.php`"
                                                v-model="item.accountNo"
                                                label="Search Account..."
                                                item-title="name"
                                                item-value="no"
                                                @change="(obj: any) => onItemChange(idx, obj)"
                                            />
                                        </td>
                                        <td>
                                            <v-text-field
                                                v-model="item.notes"
                                                placeholder="Note..."
                                                variant="outlined"
                                                density="compact"
                                                hide-details
                                                bg-color="white"
                                            ></v-text-field>
                                        </td>
                                        <td>
                                            <v-text-field
                                                v-model.number="item.amount"
                                                type="number"
                                                variant="outlined"
                                                density="compact"
                                                hide-details
                                                class="text-right-input bg-white"
                                                prefix="Rp"
                                            ></v-text-field>
                                        </td>
                                        <td class="text-center">
                                            <v-btn icon color="error" variant="text" size="small" @click="removeItem(idx)" :disabled="form.items.length <= 1">
                                                <TrashIcon size="18"/>
                                            </v-btn>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr class="bg-white">
                                        <td colspan="3" class="text-right text-subtitle-2 font-weight-bold pt-4">Total Expense:</td>
                                        <td class="text-right text-h6 font-weight-bold text-primary pt-4">Rp {{ totalAmount.toLocaleString('id-ID') }}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </v-table>
                            <v-divider></v-divider>
                            <div class="px-2 py-2 bg-white">
                                <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="addItem" block class="text-none">
                                    <PlusIcon size="16" class="mr-1"/> Add Allocation Row
                                </v-btn>
                            </div>
                        </v-card>
                    </div>

                    <v-divider class="my-6 border-dashed"></v-divider>

                    <div class="d-flex justify-end gap-2">
                        <v-btn variant="outlined" color="secondary" size="large" class="px-6">Cancel</v-btn>
                        <v-btn color="primary" variant="flat" size="large" @click="handleSubmit" :loading="saving" class="px-6">
                            <SendIcon size="18" class="mr-2"/> Submit Request
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12">
            <v-card elevation="10" rounded="lg" class="border overflow-hidden">
                 <div class="bg-gradient-smooth px-6 py-4 d-flex align-center justify-space-between flex-wrap gap-2">
                    <div class="d-flex align-center">
                        <FileDescriptionIcon size="24" class="text-white mr-2" />
                        <div>
                            <h3 class="text-h6 font-weight-bold text-white">Expense History</h3>
                            <div class="text-caption text-white opacity-80">List of transactions</div>
                        </div>
                    </div>
                     <div class="d-flex align-center gap-2" style="background: rgba(255,255,255,0.2); padding: 4px; border-radius: 8px;">
                        <v-text-field
                            v-model="search"
                            density="compact"
                            variant="solo"
                            label="Search Transaction..."
                            prepend-inner-icon="mdi-magnify"
                            hide-details
                            single-line
                            bg-color="white"
                            style="min-width: 250px;"
                            class="rounded"
                        ></v-text-field>
                        <v-btn icon variant="text" color="white" @click="fetchList" :loading="loadingList" title="Refresh">
                            <RefreshIcon size="20"/>
                        </v-btn>
                    </div>
                </div>

                <v-data-table
                    :headers="headers"
                    :items="kasbonList"
                    :loading="loadingList"
                    density="comfortable"
                    hover
                    class="rounded-0"
                >
                    <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
                        <tr class="bg-gradient-smooth">
                            <template v-for="column in columns" :key="column.key">
                                <th class="text-subtitle-2 font-weight-bold text-uppercase text-white py-3 border-none">
                                    {{ column.title }}
                                </th>
                            </template>
                        </tr>
                    </template>

                    <template v-slot:item.number="{ item }">
                        <span class="font-weight-bold text-primary">{{ item.number }}</span>
                    </template>
                    <template v-slot:item.amount="{ item }">
                        <span class="font-weight-medium font-mono">
                            Rp {{ Number(item.amount).toLocaleString('id-ID') }}
                        </span>
                    </template>
                    <template v-slot:item.status="{ item }">
                        <v-chip 
                            size="small" 
                            variant="tonal"
                            class="font-weight-bold"
                            :color="item.status === 'APPROVED' ? 'green' : 'orange'"
                        >
                            {{ item.status }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-btn icon variant="text" color="primary" size="small" @click="openDetail(item.id)">
                            <EyeIcon size="20"/>
                        </v-btn>
                    </template>
                </v-data-table>
            </v-card>
        </v-col>
    </v-row>

    <v-dialog v-model="dialogDetail" max-width="700" scrollable>
        <v-card class="rounded-lg overflow-hidden">
            <div class="bg-gradient-smooth px-6 py-4 d-flex justify-space-between align-center">
                 <div class="d-flex align-center gap-3">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <AlignLeftIcon size="20" class="text-primary" />
                    </div>
                    <div>
                        <span class="text-h6 font-weight-bold text-white d-block" style="line-height: 1.2;">Transaction Detail</span>
                        <span class="text-caption text-white opacity-80 font-weight-normal">Expense Breakdown</span>
                    </div>
                </div>
                <v-btn icon variant="text" color="white" @click="dialogDetail = false"><XIcon size="24"/></v-btn>
            </div>

            <v-card-text class="pa-0 bg-grey-lighten-5" style="max-height: 70vh;">
                <div v-if="loadingDetail" class="text-center py-10">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <div class="mt-2 text-caption">Loading details...</div>
                </div>
                <div v-else-if="detailData">
                    <div class="bg-white pa-6 mb-4 shadow-sm border-bottom">
                         <v-row>
                            <v-col cols="12" sm="6">
                                <div class="text-overline text-medium-emphasis mb-1">Transaction Info</div>
                                <div class="text-h5 font-weight-bold text-primary mb-1">{{ detailData.number }}</div>
                                <div class="d-flex align-center gap-2 mb-2 text-grey-darken-1">
                                    <CalendarEventIcon size="18" />
                                    <span class="text-body-1">{{ detailData.transDate }}</span>
                                </div>
                            </v-col>
                            <v-col cols="12" sm="6" class="text-sm-right">
                                <div class="text-overline text-medium-emphasis mb-1">Total Amount</div>
                                <div class="text-h5 font-weight-bold text-red mb-1">Rp {{ detailData.amount.toLocaleString('id-ID') }}</div>
                                <div class="bg-grey-lighten-4 pa-2 rounded border font-italic text-caption text-left mt-2">
                                    {{ detailData.description || 'No description' }}
                                </div>
                            </v-col>
                         </v-row>
                         <v-divider class="my-3"></v-divider>
                         <div>
                             <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Source Fund</div>
                             <div class="font-weight-medium">{{ detailData.bank?.name }}</div>
                             <div class="text-caption font-mono text-grey">{{ detailData.bank?.no }}</div>
                         </div>
                    </div>

                    <div class="px-6 pb-6">
                        <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center text-primary">
                            <v-icon start color="primary" size="small">mdi-file-tree</v-icon>
                            Allocation Breakdown
                        </div>
                        <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
                            <v-table density="compact">
                                <thead class="bg-grey-lighten-4">
                                    <tr>
                                        <th width="40" class="text-center">#</th>
                                        <th>Account Info</th>
                                        <th>Notes</th>
                                        <th class="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(d, i) in detailData.detailAccount" :key="i" class="hover-bg">
                                        <td class="text-center text-medium-emphasis">{{ i+1 }}</td>
                                        <td>
                                            <div class="font-weight-medium text-body-2">{{ d.account?.name }}</div>
                                            <div class="text-caption font-mono text-grey">{{ d.account?.no }}</div>
                                        </td>
                                        <td class="font-italic text-grey text-caption">{{ d.detailNotes || '-' }}</td>
                                        <td class="text-right font-weight-bold text-body-2">Rp {{ d.amount.toLocaleString('id-ID') }}</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card>
                     </div>
                </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="bg-white pa-4 justify-end">
                <v-btn variant="outlined" color="primary" @click="dialogDetail = false" class="px-6">Close Detail</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" variant="elevated">
        <div class="d-flex align-center">
            <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" class="mr-2"></v-icon>
            {{ snackbar.text }}
        </div>
        <template v-slot:actions><v-btn variant="text" icon="mdi-close" size="small" @click="snackbar.show = false"></v-btn></template>
    </v-snackbar>
</template>

<style scoped>
/* Gradient Konsisten */
.bg-gradient-smooth {
    background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}
:deep(th) {
    background-color: transparent !important;
}

.font-mono {
    font-family: 'Roboto Mono', monospace;
}
.text-right-input :deep(input) {
    text-align: right;
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
</style>