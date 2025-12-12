<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
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

const API_BASE_URL = "https://multimitralogistik.id/Api";

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

let searchTimeout: any;
watch(search, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchList, 600);
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
            fetchList();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
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
</script>

<template>
    <v-card elevation="10" rounded="lg" class="mb-6 overflow-hidden">
        <div class="bg-gradient-smooth px-6 py-8">
            <div class="d-flex align-center gap-3">
                <div>
                    <h2 class="text-h4 font-weight-bold text-white mb-1" style="text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Job Order Management
                    </h2>
                    <div class="text-subtitle-1 text-white opacity-90">
                        Create, manage, and track your job order transactions efficiently.
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
                    <span class="text-h6 font-weight-bold text-white">New Job Order Entry</span>
                </div>

                <v-card-text class="pa-6">
                    <v-row>
                        <v-col cols="12" md="6">
                            <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">General Information</h6>
                            
                            <v-text-field 
                                v-model="form.jobNumber" 
                                label="Job Order Number" 
                                placeholder="e.g. JO-2023-001"
                                variant="outlined"
                                color="primary"
                                density="comfortable"
                                prepend-inner-icon="mdi-pound"
                                class="mb-2"
                            ></v-text-field>
                            
                            <div class="mb-4">
                                <AsyncSelect 
                                    label="Select Customer"
                                    :apiEndpoint="`${API_BASE_URL}/JobOrder/MasterCustomer.php`"
                                    v-model="form.customerNo"
                                    item-title="name"
                                    item-value="customerNo"
                                    @change="onCustomerChange"
                                />
                            </div>

                            <v-text-field 
                                v-model="form.pic" 
                                label="PIC Pelaksana Order" 
                                placeholder="Nama Penanggung Jawab"
                                variant="outlined"
                                color="primary"
                                density="comfortable"
                                class="mb-2"
                            >
                                <template v-slot:prepend-inner>
                                    <UserIcon size="20" class="text-grey" />
                                </template>
                            </v-text-field>

                            <v-textarea 
                                v-model="form.description" 
                                label="Project Description / Notes" 
                                variant="outlined"
                                color="primary"
                                rows="2"
                                auto-grow
                                placeholder="Enter details about this job order..."
                            ></v-textarea>
                        </v-col>
                        
                        <v-col cols="12" md="6">
                            <h6 class="text-subtitle-1 font-weight-bold mb-3 text-primary">Transaction Details</h6>
                            
                            <v-text-field 
                                v-model="form.transDate" 
                                type="date" 
                                label="Transaction Date" 
                                variant="outlined"
                                color="primary"
                                density="comfortable"
                                prepend-inner-icon="mdi-calendar"
                            ></v-text-field>

                            <v-card variant="outlined" class="rounded-md mt-2 bg-grey-lighten-5">
                                <div class="d-flex justify-space-between align-center px-4 pt-3 pb-2 bg-white border-bottom">
                                    <span class="text-subtitle-2 font-weight-bold text-uppercase text-grey-darken-1">
                                        Materials / Items List
                                    </span>
                                </div>
                                
                                <v-table density="compact" class="bg-transparent">
                                    <thead>
                                        <tr>
                                            <th class="font-weight-bold text-primary">Item Name</th>
                                            <th width="120" class="text-center font-weight-bold text-primary">Qty</th>
                                            <th width="50"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, index) in form.items" :key="item.id">
                                            <td class="py-2">
                                                <AsyncSelect 
                                                    :apiEndpoint="`${API_BASE_URL}/JobOrder/MasterItem.php`"
                                                    v-model="item.no"
                                                    label="Select Item"
                                                    item-title="name"
                                                    item-value="no"
                                                    @change="(obj: any) => onItemChange(index, obj)"
                                                />
                                            </td>
                                            <td class="align-top py-2">
                                                <v-text-field 
                                                    v-model.number="item.quantity" 
                                                    type="number" 
                                                    min="1" 
                                                    variant="outlined" 
                                                    density="compact" 
                                                    hide-details
                                                    class="centered-input bg-white"
                                                ></v-text-field>
                                            </td>
                                            <td class="text-center align-top py-2">
                                                <v-btn 
                                                    icon 
                                                    variant="text" 
                                                    color="error" 
                                                    size="small" 
                                                    @click="removeItem(index)" 
                                                    :disabled="form.items.length <= 1"
                                                >
                                                    <TrashIcon size="18" />
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
                                        size="small" 
                                        prepend-icon="mdi-plus" 
                                        @click="addItem"
                                        block
                                        class="text-none"
                                    >
                                        Add Another Item
                                    </v-btn>
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions class="bg-grey-lighten-5 px-6 py-4 justify-end">
                    <v-btn variant="outlined" color="secondary" size="large" @click="resetForm" class="px-6">Cancel</v-btn>
                    <v-btn color="primary" size="large" variant="flat" @click="handleSubmit" :loading="saving" class="px-6 ml-2">
                        <DeviceFloppyIcon size="20" class="mr-2" /> Save Job Order
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-col>

        <v-col cols="12" class="mt-4">
            <v-card elevation="10" rounded="lg" class="border overflow-hidden">
                <div class="bg-gradient-smooth px-6 py-4 d-flex align-center justify-space-between flex-wrap gap-2">
                    <div class="d-flex align-center">
                        <FileDescriptionIcon size="24" class="text-white mr-2" />
                        <div>
                            <h3 class="text-h6 font-weight-bold text-white">Transaction History</h3>
                            <div class="text-caption text-white opacity-80">Local Database Records</div>
                        </div>
                    </div>
                    
                    <div class="d-flex align-center gap-2" style="background: rgba(255,255,255,0.2); padding: 4px; border-radius: 8px;">
                        <v-text-field
                            v-model="search"
                            density="compact"
                            variant="solo"
                            label="Search Data..."
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
                    :items="jobOrderList"
                    :loading="loadingList"
                    density="comfortable"
                    hover
                    class="rounded-0"
                >
                    <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
                        <tr class="bg-gradient-smooth">
                          <template v-for="column in columns" :key="column.key ?? column.title">
                                <th class="text-subtitle-2 font-weight-bold text-uppercase text-white py-3 border-none">
                                    {{ column.title }}
                                </th>
                            </template>
                        </tr>
                    </template>

                    <template v-slot:item.number="{ item }">
                        <span class="font-weight-bold text-primary">{{ item.number }}</span>
                    </template>

                    <template v-slot:item.pic="{ item }">
                        <div class="d-flex align-center">
                            <UserIcon size="16" class="mr-2 text-grey"/>
                            <span class="font-weight-medium">{{ item.pic || '-' }}</span>
                        </div>
                    </template>
                    
                    <template v-slot:item.status="{ item }">
                        <v-chip 
                            size="small" 
                            variant="tonal"
                            class="font-weight-bold"
                            :color="item.status === 'Submitted' ? 'green' : 'grey'"
                        >
                            {{ item.status }}
                        </v-chip>
                    </template>
                    
                    <template v-slot:item.actions="{ item }">
                        <v-btn icon variant="text" color="primary" size="small" @click="openDetail(item.id)">
                            <EyeIcon size="20" />
                        </v-btn>
                    </template>
                </v-data-table>
            </v-card>
        </v-col>
    </v-row>

    <v-dialog v-model="dialogDetail" max-width="750" transition="dialog-bottom-transition" scrollable>
        <v-card class="rounded-lg overflow-hidden">
            <div class="bg-gradient-smooth px-6 py-4 d-flex justify-space-between align-center">
                <div class="d-flex align-center gap-3">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <FileDescriptionIcon size="20" class="text-primary" />
                    </div>
                    <div>
                        <span class="text-h6 font-weight-bold text-white d-block" style="line-height: 1.2;">Job Order Detail</span>
                        <span class="text-caption text-white opacity-80 font-weight-normal">View complete transaction info</span>
                    </div>
                </div>
                <v-btn icon variant="text" color="white" @click="dialogDetail = false">
                    <XIcon size="24" />
                </v-btn>
            </div>
            
            <v-card-text class="pa-0 bg-grey-lighten-5" style="max-height: 70vh;">
                <div v-if="loadingDetail" class="d-flex flex-column align-center justify-center py-10">
                    <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
                    <div class="mt-3 text-body-2 text-medium-emphasis">Mengambil data detail...</div>
                </div>

                <div v-else-if="detailData">
                    <div class="bg-white pa-6 mb-4 shadow-sm border-bottom">
                        <v-row>
                            <v-col cols="12" sm="6">
                                <div class="text-overline text-medium-emphasis mb-1">Transaction Info</div>
                                <div class="d-flex align-center gap-2 mb-2">
                                    <span class="text-h5 font-weight-bold text-primary">{{ detailData.number }}</span>
                                </div>
                                <div class="d-flex align-center gap-2 mb-2 text-grey-darken-1">
                                    <CalendarEventIcon size="18" />
                                    <span class="text-body-1">{{ detailData.transDate }}</span>
                                </div>
                                <div class="d-flex align-center gap-2 text-grey-darken-2 mt-2">
                                    <UserIcon size="18" />
                                    <span class="font-weight-bold">PIC: {{ detailData.pic || '-' }}</span>
                                </div>
                            </v-col>

                            <v-col cols="12" sm="6" class="text-sm-right">
                                <div class="text-overline text-medium-emphasis mb-1">Customer Info</div>
                                <div class="text-h6 font-weight-bold text-grey-darken-3 mb-1">{{ detailData.customer?.name }}</div>
                                <div class="text-body-2 text-primary font-mono bg-blue-lighten-5 d-inline-block px-3 py-1 rounded mb-3">
                                    {{ detailData.customer?.customerNo }}
                                </div>
                                <div class="text-caption text-grey-darken-1 mt-2 text-left text-sm-right bg-grey-lighten-4 pa-2 rounded border">
                                    <span class="font-weight-bold">Note:</span> "{{ detailData.description || 'No description provided' }}"
                                </div>
                            </v-col>
                        </v-row>
                    </div>

                    <div class="px-6 pb-6">
                        <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center text-primary">
                            <v-icon start color="primary" size="small">mdi-package-variant-closed</v-icon>
                            Items Breakdown
                        </div>
                        <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
                            <v-table density="comfortable">
                                <thead class="bg-grey-lighten-4">
                                    <tr>
                                        <th width="50" class="text-center">#</th>
                                        <th>Item Description</th>
                                        <th class="text-center">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in detailData.detailItem" :key="idx" class="hover-bg">
                                        <td class="text-center text-medium-emphasis">{{ idx + 1 }}</td>
                                        <td>
                                            <div class="font-weight-medium text-body-2">{{ item.item?.name }}</div>
                                            <div class="text-caption text-medium-emphasis font-mono">{{ item.item?.no }}</div>
                                        </td>
                                        <td class="text-center">
                                            <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
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
        <template v-slot:actions>
            <v-btn variant="text" icon="mdi-close" size="small" @click="snackbar.show = false"></v-btn>
        </template>
    </v-snackbar>
</template>

<style scoped>
.bg-gradient-smooth {
    background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}
:deep(th) {
    background-color: transparent !important;
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
</style>