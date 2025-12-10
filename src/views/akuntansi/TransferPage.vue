<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { format } from 'date-fns';
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
    ArrowsTransferDownIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

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

const dialogDetail = ref(false);
const detailData = ref<any>(null);
const loadingDetail = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

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
    } catch { transferList.value = []; } 
    finally { loadingList.value = false; }
};

// Search Watcher
let searchTimeout: any;
watch(search, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchList, 600);
});

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
            description: form.description || "Transfer Antar Bank"
        };
        const res = await fetch(`${API_BASE_URL}/Transfer/Transaksi.php`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
        const json = await res.json();
        if(json.s) {
            showMsg('Transfer Berhasil');
            form.amount = 0; form.description = '';
            fetchList();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showMsg(json.d?.message || 'Gagal', 'error');
        }
    } catch { showMsg('Error koneksi', 'error'); } 
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
    } catch { showMsg('Gagal load detail', 'error'); }
    finally { loadingDetail.value = false; }
};

onMounted(fetchList);
</script>

<template>
    <v-card elevation="10" rounded="lg" class="mb-6 overflow-hidden">
        <div class="bg-gradient-smooth px-6 py-8">
            <div class="d-flex align-center gap-3">

                <div>
                    <h2 class="text-h4 font-weight-bold text-white mb-1" style="text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Bank Transfer
                    </h2>
                    <div class="text-subtitle-1 text-white opacity-90">
                        Move funds between your bank accounts or cash.
                    </div>
                </div>
            </div>
        </div>
    </v-card>

    <v-row>
        <v-col cols="12" md="4">
            <v-card elevation="10" rounded="lg" class="border overflow-hidden h-100">
                <div class="bg-gradient-smooth px-6 py-4 d-flex align-center">
                    <SendIcon size="24" class="text-white mr-2" />
                    <span class="text-h6 font-weight-bold text-white">New Transfer</span>
                </div>

                <v-card-text class="pa-6">
                    <div class="mb-4">
                        <label class="text-caption font-weight-bold text-grey-darken-1 mb-1 d-block">Tanggal Transfer</label>
                        <v-text-field 
                            v-model="form.transDate" 
                            type="date" 
                            variant="outlined" 
                            density="comfortable" 
                            hide-details
                            prepend-inner-icon="mdi-calendar"
                        ></v-text-field>
                    </div>

                    <v-card variant="outlined" class="bg-grey-lighten-5 pa-4 mb-4 border-dashed">
                        <div class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center">
                            <BuildingBankIcon size="18" class="mr-2"/> Source Fund
                        </div>
                        <AsyncSelect 
                            label="From Account (Dari)" 
                            :apiEndpoint="`${API_BASE_URL}/Transfer/MasterGlAccount.php`" filterType="CASH_BANK"
                            :model-value="form.fromBankName" item-title="name" item-value="name"
                            @update:model-value="(val: any) => form.fromBankName = val"
                            @change="(o: any) => { if(o) { form.fromBankId = o.id; form.fromBankName = o.name; } }"
                        />
                        
                        <div class="d-flex justify-center my-2">
                            <v-icon color="grey" icon="mdi-arrow-down"></v-icon>
                        </div>

                        <div class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center">
                            <BuildingBankIcon size="18" class="mr-2"/> Destination
                        </div>
                        <AsyncSelect 
                            label="To Account (Ke)" 
                            :apiEndpoint="`${API_BASE_URL}/Transfer/MasterGlAccount.php`" filterType="CASH_BANK"
                            :model-value="form.toBankName" item-title="name" item-value="name"
                            @update:model-value="(val: any) => form.toBankName = val"
                            @change="(o: any) => { if(o) { form.toBankId = o.id; form.toBankName = o.name; } }"
                        />
                    </v-card>

                    <div class="mb-4">
                        <label class="text-caption font-weight-bold text-grey-darken-1 mb-1 d-block">Nominal Transfer (Rp)</label>
                        <v-text-field 
                            v-model.number="form.amount" 
                            type="number" 
                            variant="outlined" 
                            density="comfortable" 
                            prefix="Rp"
                            class="text-right-input font-weight-bold"
                        ></v-text-field>
                    </div>

                    <v-textarea 
                        label="Description" 
                        placeholder="e.g. Setor tunai ke bank..."
                        v-model="form.description" 
                        variant="outlined" 
                        rows="2"
                    ></v-textarea>
                    
                    <v-divider class="my-4"></v-divider>
                    
                    <v-btn block color="primary" size="large" variant="flat" @click="handleSubmit" :loading="saving">
                        <ArrowsLeftRightIcon size="18" class="mr-2"/> Process Transfer
                    </v-btn>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" md="8">
            <v-card elevation="10" rounded="lg" class="border overflow-hidden h-100">
                <div class="bg-gradient-smooth px-6 py-4 d-flex align-center justify-space-between flex-wrap gap-2">
                    <div class="d-flex align-center">
                        <ArrowsLeftRightIcon size="24" class="text-white mr-2" />
                        <div>
                            <h3 class="text-h6 font-weight-bold text-white">Transfer History</h3>
                        </div>
                    </div>
                    
                    <div class="d-flex align-center gap-2" style="background: rgba(255,255,255,0.2); padding: 4px; border-radius: 8px;">
                        <v-text-field
                            v-model="search"
                            density="compact"
                            variant="solo"
                            label="Search..."
                            prepend-inner-icon="mdi-magnify"
                            hide-details
                            single-line
                            bg-color="white"
                            style="min-width: 200px;"
                            class="rounded"
                        ></v-text-field>
                        <v-btn icon variant="text" color="white" @click="fetchList" :loading="loadingList" title="Refresh">
                            <RefreshIcon size="20"/>
                        </v-btn>
                    </div>
                </div>

                <v-data-table 
                    :headers="headers" 
                    :items="transferList" 
                    :loading="loadingList" 
                    density="comfortable" 
                    class="rounded-0"
                    hover
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

                    <template v-slot:item.banks="{ item }">
                        <div class="py-2">
                            <div class="d-flex align-center mb-1">
                                <v-icon size="small" color="grey" class="mr-2">mdi-bank-minus</v-icon>
                                <span class="text-body-2 font-weight-medium">{{ item.fromBankName }}</span>
                            </div>
                            <div class="ml-1 pl-3 border-s-md border-opacity-25" style="border-color: #ccc;">
                                <div class="d-flex align-center text-primary">
                                    <ArrowRightIcon size="14" class="mr-1"/> 
                                    <span class="text-caption font-weight-bold">TO</span>
                                    <v-icon size="small" class="mx-1" color="grey">mdi-bank-plus</v-icon>
                                    <span class="text-body-2 font-weight-bold">{{ item.toBankName }}</span>
                                </div>
                            </div>
                        </div>
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

    <v-dialog v-model="dialogDetail" max-width="500">
        <v-card class="rounded-lg overflow-hidden">
            <div class="bg-gradient-smooth px-6 py-4 d-flex justify-space-between align-center">
                 <div class="d-flex align-center gap-3">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <ArrowsLeftRightIcon size="20" class="text-primary" />
                    </div>
                    <div>
                        <span class="text-h6 font-weight-bold text-white d-block" style="line-height: 1.2;">Transaction Detail</span>
                    </div>
                </div>
                <v-btn icon variant="text" color="white" @click="dialogDetail = false"><XIcon size="24"/></v-btn>
            </div>

            <v-card-text v-if="loadingDetail" class="text-center py-10">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </v-card-text>

            <v-card-text v-else-if="detailData" class="pt-6 text-center">
                <div class="text-overline text-medium-emphasis mb-1">Transfer Amount</div>
                <div class="text-h3 font-weight-bold text-primary mb-2">
                    Rp {{ (detailData.amount || detailData.fromBankAmount || 0).toLocaleString('id-ID') }}
                </div>
                
                <div class="d-flex justify-center align-center gap-2 mb-6">
                    <v-chip size="small" variant="outlined" color="grey-darken-1" class="font-mono">
                        {{ detailData.number }}
                    </v-chip>
                    <div class="text-caption text-grey">
                        <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                        {{ detailData.transDate }}
                    </div>
                </div>
                
                <v-card variant="outlined" class="bg-grey-lighten-5 pa-0 overflow-hidden mb-4">
                    <div class="d-flex align-center">
                        <div class="w-50 pa-4 border-e">
                            <div class="text-caption font-weight-bold text-grey mb-1">SOURCE</div>
                            <div class="text-body-1 font-weight-bold text-truncate">{{ detailData.fromBank?.name }}</div>
                            <div class="text-caption text-grey font-mono">{{ detailData.fromBank?.no }}</div>
                        </div>
                         <div class="bg-white rounded-circle border d-flex align-center justify-center position-absolute" style="left: 50%; width: 32px; height: 32px; margin-left: -16px;">
                            <ArrowRightIcon size="16" class="text-primary"/>
                        </div>
                        <div class="w-50 pa-4">
                            <div class="text-caption font-weight-bold text-grey mb-1">DESTINATION</div>
                            <div class="text-body-1 font-weight-bold text-truncate">{{ detailData.toBank?.name }}</div>
                            <div class="text-caption text-grey font-mono">{{ detailData.toBank?.no }}</div>
                        </div>
                    </div>
                    <v-divider></v-divider>
                    <div class="pa-3 bg-white text-left">
                        <div class="text-caption font-weight-bold text-grey mb-1">DESCRIPTION</div>
                        <div class="text-body-2 font-italic">{{ detailData.description || 'No description' }}</div>
                    </div>
                </v-card>
            </v-card-text>

            <v-divider></v-divider>
            <v-card-actions class="bg-white pa-4">
                <v-btn block color="primary" variant="outlined" @click="dialogDetail=false">Close Detail</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right">
        {{ snackbar.text }}
        <template v-slot:actions><v-btn variant="text" @click="snackbar.show = false">Close</v-btn></template>
    </v-snackbar>
</template>

<style scoped>
.bg-gradient-smooth {
    background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}
:deep(th) {
    background-color: transparent !important;
}
.font-mono { font-family: 'Roboto Mono', monospace; }
.text-right-input :deep(input) { text-align: right; }
.border-dashed { border-style: dashed !important; }
.border-none { border: none !important; box-shadow: none !important; }
</style>