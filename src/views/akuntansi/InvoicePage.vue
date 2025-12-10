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
    FileInvoiceIcon, 
    SendIcon,
    XIcon,
    CalendarEventIcon,
    UserIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

// --- STATE LIST ---
const loadingList = ref(false);
const invoiceList = ref<any[]>([]);
const search = ref('');
const headers = [
    { title: 'No', key: 'index', align: 'center' as const, sortable: false },
    { title: 'Invoice #', key: 'number', align: 'start' as const },
    { title: 'Customer', key: 'customerName', align: 'start' as const },
    { title: 'Date', key: 'transDate', align: 'start' as const },
    { title: 'Total', key: 'totalAmount', align: 'end' as const },
    { title: 'Actions', key: 'actions', align: 'center' as const, sortable: false },
];

// --- STATE FORM ---
const form = reactive({
    transDate: format(new Date(), 'yyyy-MM-dd'),
    customerNo: '',
    customerName: '',
    description: '',
    items: [{ id: Date.now(), itemNo: '', itemName: '', qty: 1, price: 0 }]
});
const saving = ref(false);

// --- STATE DETAIL ---
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
const subTotal = computed(() => {
    return form.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
});
const taxTotal = computed(() => subTotal.value * 0.12); // PPN 12%
const grandTotal = computed(() => subTotal.value + taxTotal.value);

// --- METHODS ---
const fetchList = async () => {
    loadingList.value = true;
    try {
        const url = new URL(`${API_BASE_URL}/Invoice/List.php`);
        if (search.value) url.searchParams.append("q", search.value);
        const res = await fetch(url.toString());
        const json = await res.json();
        if (json.s && Array.isArray(json.d)) {
            invoiceList.value = json.d.map((item: any, idx: number) => ({...item, index: idx + 1}));
        } else {
            invoiceList.value = [];
        }
    } catch {
        invoiceList.value = [];
    } finally {
        loadingList.value = false;
    }
};

let searchTimeout: any;
watch(search, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchList, 600);
});

// Form Logic
const addItem = () => {
    form.items.push({ id: Date.now(), itemNo: '', itemName: '', qty: 1, price: 0 });
};
const removeItem = (idx: number) => {
    if (form.items.length > 1) form.items.splice(idx, 1);
};
const onItemChange = (idx: number, obj: any) => {
    if (obj) {
        form.items[idx].itemName = obj.name;
        form.items[idx].price = Number(obj.price) || 0; // Set harga otomatis jika ada di API
    }
};

const handleSubmit = async () => {
    if (!form.customerNo) return showMsg('Pilih Customer dahulu', 'error');
    if (form.items.some(i => !i.itemNo)) return showMsg('Pilih Barang/Item', 'error');

    saving.value = true;
    try {
        const payload = {
            customerNo: form.customerNo,
            transDate: format(new Date(form.transDate), 'dd/MM/yyyy'),
            description: form.description || "Invoice via Integration App",
            detailItem: form.items.map(i => ({ itemNo: i.itemNo, quantity: i.qty, unitPrice: i.price }))
        };

        const res = await fetch(`${API_BASE_URL}/Invoice/Transaksi.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.s) {
            showMsg(`Invoice Berhasil: ${json.r?.number || 'Tersimpan'}`);
            form.transDate = format(new Date(), 'yyyy-MM-dd');
            form.customerNo = '';
            form.description = '';
            form.items = [{ id: Date.now(), itemNo: '', itemName: '', qty: 1, price: 0 }];
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
        const res = await fetch(`${API_BASE_URL}/Invoice/Detail.php?id=${id}`);
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
                        Sales Invoice
                    </h2>
                    <div class="text-subtitle-1 text-white opacity-90">
                        Create and manage customer invoices efficiently.
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
                    <span class="text-h6 font-weight-bold text-white">New Invoice Entry</span>
                </div>

                <v-card-text class="pa-6">
                    <v-row>
                        <v-col cols="12" md="6">
                            <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">Customer Information</h6>
                            <div class="mb-4">
                                <AsyncSelect
                                    label="Select Customer *"
                                    :apiEndpoint="`${API_BASE_URL}/Invoice/MasterCustomer.php`"
                                    v-model="form.customerNo"
                                    item-title="name"
                                    item-value="customerNo"
                                />
                                <div class="text-caption text-medium-emphasis mt-1 ml-1">
                                    <v-icon size="small" class="mr-1">mdi-account</v-icon>
                                    Bill to this customer
                                </div>
                            </div>
                            <v-text-field
                                label="Invoice Number"
                                placeholder="Auto-generated by System"
                                disabled
                                variant="outlined"
                                density="comfortable"
                                bg-color="grey-lighten-4"
                                prepend-inner-icon="mdi-pound"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">Invoice Details</h6>
                            <v-row>
                                <v-col cols="6">
                                    <v-text-field
                                        v-model="form.transDate"
                                        type="date"
                                        label="Invoice Date *"
                                        variant="outlined"
                                        color="primary"
                                        density="comfortable"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field
                                        model-value="PPN 12%"
                                        label="Tax Type"
                                        readonly
                                        variant="outlined"
                                        density="comfortable"
                                        bg-color="grey-lighten-4"
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                            <v-textarea
                                v-model="form.description"
                                label="Notes / Terms"
                                placeholder="Additional notes for invoice..."
                                variant="outlined"
                                rows="2"
                                auto-grow
                                color="primary"
                            ></v-textarea>
                        </v-col>
                    </v-row>

                    <div class="mt-4">
                        <v-card variant="outlined" class="rounded-md bg-grey-lighten-5">
                            <div class="d-flex justify-space-between align-center px-4 pt-3 pb-2 bg-white border-bottom">
                                <span class="text-subtitle-2 font-weight-bold text-uppercase text-grey-darken-1">
                                    Items & Services
                                </span>
                            </div>
                            
                            <v-table density="compact" class="bg-transparent">
                                <thead>
                                    <tr>
                                        <th width="40" class="text-center font-weight-bold text-primary">#</th>
                                        <th class="font-weight-bold text-primary">Description / Item</th>
                                        <th width="100" class="text-center font-weight-bold text-primary">Qty</th>
                                        <th width="160" class="text-right font-weight-bold text-primary">Unit Price</th>
                                        <th width="160" class="text-right font-weight-bold text-primary">Total</th>
                                        <th width="50"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in form.items" :key="item.id">
                                        <td class="text-center pt-3 text-medium-emphasis">{{ idx + 1 }}</td>
                                        <td class="pt-2">
                                            <AsyncSelect
                                                :apiEndpoint="`${API_BASE_URL}/Invoice/MasterItem.php`"
                                                v-model="item.itemNo"
                                                label="Select Item..."
                                                item-title="name"
                                                item-value="no"
                                                @change="(obj: any) => onItemChange(idx, obj)"
                                            />
                                        </td>
                                        <td>
                                            <v-text-field
                                                v-model.number="item.qty"
                                                type="number"
                                                min="1"
                                                variant="outlined"
                                                density="compact"
                                                hide-details
                                                bg-color="white"
                                                class="text-center-input"
                                            ></v-text-field>
                                        </td>
                                        <td>
                                            <v-text-field
                                                v-model.number="item.price"
                                                type="number"
                                                variant="outlined"
                                                density="compact"
                                                hide-details
                                                bg-color="white"
                                                class="text-right-input"
                                                prefix="Rp"
                                            ></v-text-field>
                                        </td>
                                        <td class="text-right pt-4 font-weight-bold text-body-2">
                                            Rp {{ (item.qty * item.price).toLocaleString('id-ID') }}
                                        </td>
                                        <td class="text-center">
                                            <v-btn icon color="error" variant="text" size="small" @click="removeItem(idx)" :disabled="form.items.length <= 1">
                                                <TrashIcon size="18"/>
                                            </v-btn>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                            
                            <v-divider></v-divider>
                            <div class="px-2 py-2 bg-white">
                                <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="addItem" block class="text-none">
                                    <PlusIcon size="16" class="mr-1"/> Add Item Line
                                </v-btn>
                            </div>
                        </v-card>
                    </div>

                    <v-row class="mt-4 justify-end">
                        <v-col cols="12" md="4" lg="3">
                            <v-card variant="outlined" class="pa-4 bg-grey-lighten-5 rounded-lg">
                                <div class="d-flex justify-space-between mb-2">
                                    <span class="text-grey-darken-1">Subtotal</span>
                                    <span class="font-weight-bold">Rp {{ subTotal.toLocaleString('id-ID') }}</span>
                                </div>
                                <div class="d-flex justify-space-between mb-3">
                                    <span class="text-grey-darken-1">PPN (12%)</span>
                                    <span class="font-weight-bold">Rp {{ taxTotal.toLocaleString('id-ID') }}</span>
                                </div>
                                <v-divider class="mb-3 border-dashed"></v-divider>
                                <div class="d-flex justify-space-between align-center">
                                    <span class="text-h6 text-primary font-weight-bold">Total</span>
                                    <span class="text-h6 text-primary font-weight-bold">Rp {{ grandTotal.toLocaleString('id-ID') }}</span>
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <v-divider class="my-6 border-dashed"></v-divider>

                    <div class="d-flex justify-end gap-2">
                        <v-btn variant="outlined" color="secondary" size="large" class="px-6">Cancel</v-btn>
                        <v-btn color="primary" variant="flat" size="large" @click="handleSubmit" :loading="saving" class="px-6">
                            <SendIcon size="18" class="mr-2"/> Create Invoice
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12">
            <v-card elevation="10" rounded="lg" class="border overflow-hidden">
                <div class="bg-gradient-smooth px-6 py-4 d-flex align-center justify-space-between flex-wrap gap-2">
                    <div class="d-flex align-center">
                        <FileInvoiceIcon size="24" class="text-white mr-2" />
                        <div>
                            <h3 class="text-h6 font-weight-bold text-white">Invoice History</h3>
                            <div class="text-caption text-white opacity-80">Track created invoices</div>
                        </div>
                    </div>
                    
                    <div class="d-flex align-center gap-2" style="background: rgba(255,255,255,0.2); padding: 4px; border-radius: 8px;">
                        <v-text-field
                            v-model="search"
                            density="compact"
                            variant="solo"
                            label="Search Invoice..."
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
                    :items="invoiceList"
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
                    <template v-slot:item.totalAmount="{ item }">
                        <span class="font-weight-bold font-mono text-high-emphasis">
                            Rp {{ Number(item.totalAmount).toLocaleString('id-ID') }}
                        </span>
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

    <v-dialog v-model="dialogDetail" max-width="800" scrollable>
        <v-card class="rounded-lg overflow-hidden">
            <div class="bg-gradient-smooth px-6 py-4 d-flex justify-space-between align-center">
                 <div class="d-flex align-center gap-3">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <FileInvoiceIcon size="20" class="text-primary" />
                    </div>
                    <div>
                        <span class="text-h6 font-weight-bold text-white d-block" style="line-height: 1.2;">Invoice Detail</span>
                        <span class="text-caption text-white opacity-80 font-weight-normal">View transaction breakdown</span>
                    </div>
                </div>
                <v-btn icon variant="text" color="white" @click="dialogDetail = false"><XIcon size="24"/></v-btn>
            </div>
            
            <v-card-text class="pa-0 bg-grey-lighten-5" style="max-height: 70vh;">
                <div v-if="loadingDetail" class="text-center py-10">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <div class="mt-2 text-caption">Loading Invoice...</div>
                </div>

                <div v-else-if="detailData">
                    <div class="bg-white pa-6 mb-4 shadow-sm border-bottom">
                         <div class="d-flex justify-space-between align-start mb-4">
                            <div>
                                <div class="text-overline text-medium-emphasis mb-1">Invoice Number</div>
                                <div class="text-h4 font-weight-bold text-primary">{{ detailData.number }}</div>
                                <div class="d-flex align-center gap-2 mt-2 text-grey-darken-1">
                                    <CalendarEventIcon size="18" />
                                    <span class="text-body-1">{{ detailData.transDate }}</span>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-overline text-medium-emphasis mb-1">Total Amount</div>
                                <div class="text-h4 font-weight-bold text-primary">Rp {{ detailData.totalAmount.toLocaleString('id-ID') }}</div>
                                <v-chip 
                                    class="mt-2 font-weight-bold" 
                                    :color="detailData.status === 'PAID' ? 'green' : 'orange'" 
                                    variant="tonal"
                                    size="small"
                                >
                                    {{ detailData.status || 'UNPAID' }}
                                </v-chip>
                            </div>
                        </div>
                        
                        <v-divider class="mb-4 border-dashed"></v-divider>
                        
                        <v-row>
                            <v-col cols="12" sm="8">
                                <div class="d-flex align-center gap-2 mb-1">
                                    <UserIcon size="18" class="text-primary"/>
                                    <span class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis">Customer</span>
                                </div>
                                <div class="text-h6 text-high-emphasis">{{ detailData.customerName }}</div>
                                <div class="text-body-2 text-medium-emphasis mt-1 bg-grey-lighten-4 pa-2 rounded border d-inline-block" style="min-width: 200px;">
                                    Notes: {{ detailData.description || '-' }}
                                </div>
                            </v-col>
                        </v-row>
                    </div>

                    <div class="px-6 pb-6">
                        <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center text-primary">
                            <v-icon start color="primary" size="small">mdi-basket-outline</v-icon>
                            Items Purchased
                        </div>
                        <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
                            <v-table density="compact">
                                <thead class="bg-grey-lighten-4">
                                    <tr>
                                        <th width="40" class="text-center">#</th>
                                        <th>Item Description</th>
                                        <th class="text-center">Qty</th>
                                        <th class="text-right">Unit Price</th>
                                        <th class="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(d, i) in detailData.detailItem" :key="i" class="hover-bg">
                                        <td class="text-center text-medium-emphasis">{{ i+1 }}</td>
                                        <td>
                                            <div class="font-weight-medium text-body-2">{{ d.item?.name }}</div>
                                            <div class="text-caption font-mono text-grey">{{ d.item?.no }}</div>
                                        </td>
                                        <td class="text-center">
                                            <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">
                                                {{ d.quantity }}
                                            </v-chip>
                                        </td>
                                        <td class="text-right text-body-2">{{ d.unitPrice.toLocaleString('id-ID') }}</td>
                                        <td class="text-right font-weight-bold text-body-2">{{ d.totalPrice.toLocaleString('id-ID') }}</td>
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
.text-center-input :deep(input) { text-align: center; }
.hover-bg:hover { background-color: #f5f5f5; }
.border-bottom { border-bottom: 1px solid rgba(0,0,0,0.12); }
.border-none { border: none !important; box-shadow: none !important; }
</style>