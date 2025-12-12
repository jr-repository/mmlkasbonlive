<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
    PlusIcon, TrashIcon, EyeIcon, DeviceFloppyIcon, XIcon, WalletIcon,
    CheckIcon, BanIcon, PencilIcon, FileInvoiceIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";
const authStore = useAuthStore();

const loadingList = ref(false);
const billList = ref<any[]>([]);
const search = ref('');
const taxList = ref<any[]>([]); 

const form = reactive({
    id: 0, 
    transDate: format(new Date(), 'yyyy-MM-dd'),
    vendorNo: '',
    vendorName: '',
    description: '',
    globalDiscPercent: 0,
    downPayment: 0,
    items: [
        { 
            id: Date.now(), itemNo: '', itemName: '', quantity: 1, unitPrice: 0, itemDiscPercent: '', 
            ppnRate: 0, pphRate: 0 
        }
    ]
});
const saving = ref(false);
const isEditing = ref(false);

const dialogDetail = ref(false);
const detailData = ref<any>(null);
const approving = ref(false);
const rejecting = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
    snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

const canApprove = computed(() => {
    return authStore.userData?.approvals?.includes('BILL') || authStore.userData?.role === 'admin';
});

const ppnOptions = computed(() => [{name:'Non PPN', rate:0}, ...taxList.value.filter(x => x.type === 'PPN')]);
const pphOptions = computed(() => [{name:'Non PPh', rate:0}, ...taxList.value.filter(x => x.type === 'PPH')]);

const subtotal = computed(() => {
    return form.items.reduce((acc, item) => {
        let price = Number(item.unitPrice) || 0;
        let qty = Number(item.quantity) || 0;
        let discVal = parseFloat(item.itemDiscPercent || '0') || 0;
        let gross = price * qty;
        let net = gross - (gross * discVal / 100);
        return acc + net;
    }, 0);
});

const discountAmount = computed(() => subtotal.value * (form.globalDiscPercent / 100));
const taxableAmount = computed(() => subtotal.value - discountAmount.value);

const totalPPN = computed(() => {
    let tot = 0;
    form.items.forEach(item => {
        let price = Number(item.unitPrice) * Number(item.quantity);
        let discVal = parseFloat(item.itemDiscPercent || '0') || 0;
        let net = price - (price * discVal/100);
        tot += (net * (Number(item.ppnRate)/100));
    });
    return tot * (1 - (form.globalDiscPercent/100));
});

const totalPPh = computed(() => {
    let tot = 0;
    form.items.forEach(item => {
        let price = Number(item.unitPrice) * Number(item.quantity);
        let discVal = parseFloat(item.itemDiscPercent || '0') || 0;
        let net = price - (price * discVal/100);
        tot += (net * (Number(item.pphRate)/100));
    });
    return tot * (1 - (form.globalDiscPercent/100));
});

const grandTotal = computed(() => taxableAmount.value + totalPPN.value);
const netBalance = computed(() => grandTotal.value - form.downPayment);

const fetchTaxes = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/MasterData/Tax/List.php`);
        const json = await res.json();
        if(json.s) taxList.value = json.d;
    } catch {}
};

const getDefaultTax = (type: string) => {
    const t = taxList.value.find(x => x.type === type && x.isDefault);
    return t ? t.rate : 0;
};

const fetchList = async () => {
    loadingList.value = true;
    try {
        const url = new URL(`${API_BASE_URL}/Bill/List.php`);
        if(search.value) url.searchParams.append('q', search.value);
        const res = await fetch(url.toString());
        const json = await res.json();
        if(json.s) billList.value = json.d.map((x:any, i:number) => ({...x, index: i+1}));
    } finally { loadingList.value = false; }
};

const addItem = () => {
    form.items.push({ 
        id: Date.now(), itemNo: '', itemName: '', quantity: 1, unitPrice: 0, itemDiscPercent: '', 
        ppnRate: getDefaultTax('PPN'), pphRate: getDefaultTax('PPH') 
    });
};

const removeItem = (idx: number) => {
    if(form.items.length > 1) form.items.splice(idx, 1);
};

const onVendorChange = (obj: any) => {
    if(obj) {
        form.vendorNo = obj.vendorNo;
        form.vendorName = obj.name;
    }
};

const onItemChange = (idx: number, obj: any) => {
    if(obj) {
        form.items[idx].itemNo = obj.no;
        form.items[idx].itemName = obj.name;
        form.items[idx].unitPrice = obj.unitPrice || 0;
    }
};

const resetForm = () => {
    form.id = 0;
    form.vendorNo = ''; 
    form.vendorName = '';
    form.description = '';
    form.items = [{ id: Date.now(), itemNo: '', itemName: '', quantity: 1, unitPrice: 0, itemDiscPercent: '', ppnRate: getDefaultTax('PPN'), pphRate: getDefaultTax('PPH') }];
    form.downPayment = 0; 
    form.globalDiscPercent = 0;
    isEditing.value = false;
};

const handleEdit = async (item: any) => {
    const res = await fetch(`${API_BASE_URL}/Bill/Detail.php?id=${item.id}`);
    const json = await res.json();
    if(json.s) {
        const d = json.d;
        form.id = d.id;
        form.transDate = d.transDate; 
        form.vendorNo = d.vendor.vendorNo;
        form.vendorName = d.vendor.name;
        form.description = d.description;
        form.globalDiscPercent = d.globalDiscPercent;
        form.downPayment = d.downPayment;
        
        form.items = d.items.map((x:any) => ({
            id: Date.now() + Math.random(),
            itemNo: x.itemNo,
            itemName: x.itemName,
            quantity: x.quantity,
            unitPrice: x.unitPrice,
            itemDiscPercent: x.itemDiscPercent,
            ppnRate: x.ppnRate,
            pphRate: x.pphRate
        }));
        
        isEditing.value = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const handleSubmit = async () => {
    if(!form.vendorNo) return showMsg("Pilih Vendor", "error");
    saving.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Bill/Transaksi.php`, {
            method: 'POST', body: JSON.stringify(form)
        });
        const json = await res.json();
        if(json.s) {
            showMsg(json.message);
            fetchList();
            resetForm();
        } else {
            showMsg(json.message, "error");
        }
    } catch(e: any) { showMsg(e.message, "error"); } 
    finally { saving.value = false; }
};

const handleApprove = async (id: number) => {
    if(!confirm("Yakin Approve? Data akan dikirim ke Accurate.")) return;
    approving.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Bill/Approve.php`, {
            method: 'POST', body: JSON.stringify({ id, user_id: authStore.userData?.id })
        });
        const json = await res.json();
        if(json.s) {
            showMsg(json.message);
            fetchList();
            dialogDetail.value = false;
        } else {
            showMsg(json.message, "error");
        }
    } catch { showMsg("Error koneksi", "error"); }
    finally { approving.value = false; }
};

const handleReject = async (id: number) => {
    if(!confirm("Yakin Reject?")) return;
    rejecting.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Bill/Reject.php`, {
            method: 'POST', body: JSON.stringify({ id, user_id: authStore.userData?.id })
        });
        const json = await res.json();
        if(json.s) {
            showMsg(json.message, "warning");
            fetchList();
            dialogDetail.value = false;
        } else {
            showMsg(json.message, "error");
        }
    } catch { showMsg("Error koneksi", "error"); }
    finally { rejecting.value = false; }
};

const openDetail = async (id: number) => {
    dialogDetail.value = true;
    detailData.value = null;
    const res = await fetch(`${API_BASE_URL}/Bill/Detail.php?id=${id}`);
    const json = await res.json();
    if(json.s) detailData.value = json.d;
};

onMounted(() => {
    fetchTaxes().then(() => {
        if(form.items.length > 0) {
            form.items[0].ppnRate = getDefaultTax('PPN');
            form.items[0].pphRate = getDefaultTax('PPH');
        }
    });
    fetchList();
});
</script>

<template>
    <v-row>
        <v-col cols="12">
            <UiParentCard :title="isEditing ? 'Edit Tagihan (AP)' : 'Input Tagihan Vendor (AP)'">
                <template v-slot:action v-if="isEditing">
                    <v-btn color="error" variant="text" @click="resetForm">Batal Edit</v-btn>
                </template>

                <v-row>
                    <v-col cols="12" md="4">
                        <v-text-field type="date" label="Tanggal" v-model="form.transDate" variant="outlined" density="compact"></v-text-field>
                        
                        <AsyncSelect 
                            label="Vendor" 
                            :apiEndpoint="`${API_BASE_URL}/Bill/MasterVendor.php`" 
                            item-title="name" 
                            item-value="vendorNo"
                            v-model="form.vendorNo"
                            @change="onVendorChange"
                        />
                        <v-textarea label="Keterangan" v-model="form.description" rows="2" variant="outlined" class="mt-3"></v-textarea>
                    </v-col>
                    
                    <v-col cols="12" md="8">
                        <v-card variant="outlined" class="pa-0 overflow-hidden">
                            <v-table density="compact">
                                <thead class="bg-grey-lighten-4">
                                    <tr>
                                        <th width="250">Item</th>
                                        <th width="70">Qty</th>
                                        <th width="120">Harga Beli</th>
                                        <th width="80">Disc</th>
                                        <th width="100">PPN</th>
                                        <th width="100">PPh</th>
                                        <th width="40"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, i) in form.items" :key="item.id">
                                        <td class="py-2">
                                            <AsyncSelect 
                                                :apiEndpoint="`${API_BASE_URL}/Bill/MasterItem.php`"
                                                item-title="name" item-value="no"
                                                v-model="item.itemNo"
                                                label="Item..."
                                                @change="(o:any)=>onItemChange(i,o)"
                                            />
                                        </td>
                                        <td><v-text-field type="number" v-model="item.quantity" density="compact" hide-details variant="outlined"></v-text-field></td>
                                        <td><v-text-field type="number" v-model="item.unitPrice" density="compact" hide-details variant="outlined"></v-text-field></td>
                                        <td><v-text-field v-model="item.itemDiscPercent" placeholder="%" density="compact" hide-details variant="outlined"></v-text-field></td>
                                        <td>
                                            <v-select v-model="item.ppnRate" :items="ppnOptions" item-title="name" item-value="rate" density="compact" hide-details variant="outlined" class="small-select"></v-select>
                                        </td>
                                        <td>
                                            <v-select v-model="item.pphRate" :items="pphOptions" item-title="name" item-value="rate" density="compact" hide-details variant="outlined" class="small-select"></v-select>
                                        </td>
                                        <td>
                                            <v-btn icon color="error" variant="text" size="small" @click="removeItem(i)"><TrashIcon size="18"/></v-btn>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                            <v-btn block color="primary" variant="tonal" class="rounded-0" @click="addItem"><PlusIcon size="18"/> Tambah Item</v-btn>
                        </v-card>

                        <v-row class="mt-4 justify-end">
                            <v-col cols="12" md="6">
                                <v-card variant="outlined" class="pa-3 bg-grey-lighten-5">
                                    <div class="d-flex justify-space-between mb-1">
                                        <span>Subtotal:</span>
                                        <span class="font-weight-bold">Rp {{ subtotal.toLocaleString('id-ID') }}</span>
                                    </div>
                                    <div class="d-flex align-center justify-space-between mb-1">
                                        <div class="d-flex align-center" style="width: 140px;">
                                            <span class="mr-2 text-caption">Disc Global (%):</span>
                                            <v-text-field v-model="form.globalDiscPercent" type="number" density="compact" hide-details variant="outlined" class="tiny-input"></v-text-field>
                                        </div>
                                        <span class="text-red">- Rp {{ discountAmount.toLocaleString('id-ID') }}</span>
                                    </div>
                                    <div class="d-flex justify-space-between mb-1">
                                        <span class="text-caption">Total PPN:</span>
                                        <span class="text-caption">Rp {{ totalPPN.toLocaleString('id-ID') }}</span>
                                    </div>
                                    <div class="d-flex justify-space-between mb-2">
                                        <span class="text-caption">Total PPh (Potongan):</span>
                                        <span class="text-caption">Rp {{ totalPPh.toLocaleString('id-ID') }}</span>
                                    </div>
                                    <v-divider class="mb-2"></v-divider>
                                    <div class="d-flex justify-space-between mb-2">
                                        <span class="font-weight-bold">Grand Total:</span>
                                        <span class="font-weight-bold text-primary">Rp {{ grandTotal.toLocaleString('id-ID') }}</span>
                                    </div>
                                    <div class="d-flex align-center justify-space-between mb-2 bg-white pa-2 rounded border">
                                        <div class="d-flex align-center">
                                            <WalletIcon size="18" class="mr-2 text-grey"/>
                                            <span>DP:</span>
                                        </div>
                                        <v-text-field v-model="form.downPayment" type="number" density="compact" hide-details variant="plain" class="text-right-input" prefix="Rp"></v-text-field>
                                    </div>
                                    <div class="d-flex justify-space-between mt-2">
                                        <span class="font-weight-bold">Net Balance:</span>
                                        <span class="font-weight-bold text-red">Rp {{ netBalance.toLocaleString('id-ID') }}</span>
                                    </div>
                                </v-card>
                                <v-btn block color="primary" size="large" class="mt-4" @click="handleSubmit" :loading="saving">
                                    <DeviceFloppyIcon size="20" class="mr-2"/> {{ isEditing ? 'Simpan Perubahan' : 'Simpan Tagihan' }}
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </UiParentCard>
        </v-col>
        
        <v-col cols="12">
            <UiParentCard title="Riwayat Tagihan Vendor">
                <v-data-table :headers="[
                    { title: 'No', key: 'index' },
                    { title: 'Bill #', key: 'number' },
                    { title: 'Vendor', key: 'vendorName' },
                    { title: 'Total', key: 'totalAmount', align:'end' },
                    { title: 'Status', key: 'status', align:'center' },
                    { title: 'Action', key: 'actions', align:'center' }
                ]" :items="billList" :loading="loadingList" density="compact">
                    <template v-slot:item.totalAmount="{ item }">Rp {{ Number(item.totalAmount).toLocaleString('id-ID') }}</template>
                    <template v-slot:item.status="{ item }">
                        <v-chip size="small" :color="item.status === 'SUBMITTED' ? 'green' : (item.status === 'REJECTED' ? 'red' : 'orange')">
                            {{ item.status }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-btn icon color="primary" variant="text" size="small" @click="openDetail(item.id)"><EyeIcon size="20"/></v-btn>
                        <v-btn v-if="['WAITING_APPROVAL', 'REJECTED', 'DRAFT'].includes(item.status)" 
                               icon color="orange" variant="text" size="small" @click="handleEdit(item)">
                            <PencilIcon size="20"/>
                        </v-btn>
                    </template>
                </v-data-table>
            </UiParentCard>
        </v-col>
    </v-row>

    <v-dialog v-model="dialogDetail" max-width="800">
        <v-card v-if="detailData">
            <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
                <span>Bill #{{ detailData.number }}</span>
                <v-btn icon variant="text" color="white" @click="dialogDetail = false"><XIcon/></v-btn>
            </v-card-title>
            <v-card-text class="pt-4">
                <v-row>
                    <v-col cols="6">
                        <strong>Vendor:</strong> {{ detailData.vendor.name }}<br>
                        <strong>Date:</strong> {{ detailData.transDate }}<br>
                        <strong>Status:</strong> <v-chip size="x-small" :color="detailData.status==='REJECTED'?'red':'blue'">{{ detailData.status }}</v-chip>
                    </v-col>
                </v-row>
                <v-table density="compact" class="mt-4 border">
                    <thead>
                        <tr class="bg-grey-lighten-3">
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Disc</th>
                            <th>Tax</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, i) in detailData.items" :key="i">
                            <td>{{ item.itemName }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ Number(item.unitPrice).toLocaleString() }}</td>
                            <td>{{ item.itemDiscPercent || '-' }}</td>
                            <td>
                                <span v-if="item.ppnRate > 0" class="text-blue text-caption font-weight-bold mr-1">PPN</span>
                                <span v-if="item.pphRate > 0" class="text-red text-caption font-weight-bold">PPh</span>
                            </td>
                            <td class="text-right">{{ Number(item.lineTotal).toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </v-table>
                <div class="d-flex justify-end mt-4">
                    <div style="width: 250px;">
                        <div class="d-flex justify-space-between"><span>Subtotal:</span> <span>{{ Number(detailData.summary.subtotal).toLocaleString() }}</span></div>
                        <div class="d-flex justify-space-between text-red"><span>Disc Global:</span> <span>-</span></div>
                        <div class="d-flex justify-space-between"><span>PPN:</span> <span>{{ Number(detailData.summary.ppn).toLocaleString() }}</span></div>
                        <div class="d-flex justify-space-between"><span>Total:</span> <span class="font-weight-bold">{{ Number(detailData.summary.total).toLocaleString() }}</span></div>
                        <div class="d-flex justify-space-between bg-grey-lighten-4 pa-1"><span>DP:</span> <span>{{ Number(detailData.downPayment).toLocaleString() }}</span></div>
                        <div class="d-flex justify-space-between mt-2 pt-2 border-top"><span>Net Balance:</span> <span class="font-weight-bold text-primary">{{ Number(detailData.summary.net).toLocaleString() }}</span></div>
                    </div>
                </div>
            </v-card-text>
            
            <v-divider></v-divider>
            
            <v-card-actions v-if="detailData.status === 'WAITING_APPROVAL' && canApprove" class="justify-end pa-4">
                <v-btn color="error" variant="tonal" @click="handleReject(detailData.id)" :loading="rejecting">
                    <BanIcon size="18" class="mr-2"/> Reject
                </v-btn>
                <v-btn color="success" variant="flat" @click="handleApprove(detailData.id)" :loading="approving">
                    <CheckIcon size="18" class="mr-2"/> Approve & Kirim
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.text-right-input :deep(input) { text-align: right; }
.tiny-input { width: 60px; }
.small-select :deep(.v-field__input) { font-size: 11px; padding: 4px; min-height: 32px; }
</style>