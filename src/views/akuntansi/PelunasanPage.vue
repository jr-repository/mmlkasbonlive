<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { format } from 'date-fns';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
    FilterIcon, 
    TrashIcon, 
    DeviceFloppyIcon, 
    CircleCheckIcon, 
    WalletIcon,
    RefreshIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

// --- STATE ---
const form = reactive({
    transDate: format(new Date(), 'yyyy-MM-dd'),
    customerNo: '',
    customerName: '',
    bankId: null as number | null,
    bankName: '',
    description: ''
});

const invoices = ref<any[]>([]);
const searchInv = ref('');
const loadingInv = ref(false);
const saving = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// --- COMPUTED ---
const totalOutstanding = computed(() => invoices.value.reduce((sum, inv) => sum + (Number(inv.outstanding) || 0), 0));
const totalBayar = computed(() => invoices.value.reduce((sum, inv) => sum + (Number(inv.payAmount) || 0), 0));

// --- METHODS ---
const fetchInvoices = async () => {
    if (!form.customerNo) return;
    loadingInv.value = true;
    try {
        let url = `${API_BASE_URL}/Pelunasan/MasterInvoice.php?customerNo=${form.customerNo}`;
        if (searchInv.value) url += `&q=${searchInv.value}`;
        
        const res = await fetch(url);
        const json = await res.json();
        if (json.s && Array.isArray(json.d)) {
            // Mapping data agar reaktif untuk input payAmount
            invoices.value = json.d.map((inv: any) => ({ ...inv, payAmount: 0 }));
        } else {
            invoices.value = [];
        }
    } catch { invoices.value = []; } 
    finally { loadingInv.value = false; }
};

// Debounce Search Invoice
let timeout: any;
watch(searchInv, () => {
    clearTimeout(timeout);
    timeout = setTimeout(fetchInvoices, 500);
});

// Watch Customer Change
watch(() => form.customerNo, () => {
    invoices.value = [];
    fetchInvoices();
});

const handlePayAll = (id: number) => {
    const inv = invoices.value.find(i => i.id === id);
    if(inv) inv.payAmount = inv.outstanding;
};

const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

const handleSubmit = async () => {
    if (!form.customerNo || !form.bankId) return showMsg('Lengkapi Data Customer & Bank', 'error');
    if (totalBayar.value <= 0) return showMsg('Belum ada nominal pembayaran', 'error');

    saving.value = true;
    try {
        const payload = {
            transDate: format(new Date(form.transDate), 'dd/MM/yyyy'),
            customerNo: form.customerNo,
            bankId: form.bankId,
            branchId: 50,
            description: form.description,
            invoices: invoices.value.filter(inv => inv.payAmount > 0).map(inv => ({ invoiceId: inv.id, payAmount: inv.payAmount }))
        };

        const res = await fetch(`${API_BASE_URL}/Pelunasan/Transaksi.php`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.s) {
            showMsg(`Sukses! Bukti: ${json.d?.r?.number || json.r?.number}`);
            invoices.value = []; // Clear list
            form.description = '';
            // Opsional: Reset customer agar flow mulai dari awal atau biarkan untuk input lagi
        } else {
            showMsg(Array.isArray(json.d) ? json.d.join(", ") : JSON.stringify(json.d), 'error');
        }
    } catch (e: any) { showMsg(e.message, 'error'); } 
    finally { saving.value = false; }
};
</script>

<template>
    <v-row>
        <v-col cols="12" md="4">
            <v-card variant="outlined" class="text-center pa-4">
                <div class="text-subtitle-2 text-grey">Total Receivables</div>
                <div class="text-h5 mt-1">Rp {{ totalOutstanding.toLocaleString('id-ID') }}</div>
            </v-card>
        </v-col>
        <v-col cols="12" md="4">
            <v-card variant="outlined" class="text-center pa-4 bg-green-lighten-5">
                <div class="text-subtitle-2 text-grey">Payment Amount</div>
                <div class="text-h5 mt-1 text-green">Rp {{ totalBayar.toLocaleString('id-ID') }}</div>
            </v-card>
        </v-col>
        <v-col cols="12" md="4">
            <v-card variant="outlined" class="text-center pa-4">
                <div class="text-subtitle-2 text-grey">Remaining Outstanding</div>
                <div class="text-h5 mt-1 text-red">Rp {{ (totalOutstanding - totalBayar).toLocaleString('id-ID') }}</div>
            </v-card>
        </v-col>

        <v-col cols="12">
            <UiParentCard title="Record Payment">
                <v-row>
                    <v-col cols="12" md="6">
                        <AsyncSelect 
                            label="Customer *" 
                            :apiEndpoint="`${API_BASE_URL}/Pelunasan/MasterCustomer.php`"
                            v-model="form.customerNo" item-title="name" item-value="customerNo"
                            @change="(o: any) => form.customerName = o?.name"
                        />
                        <div class="my-3"></div>
                        <AsyncSelect 
                            label="Bank / Cash Account *" 
                            :apiEndpoint="`${API_BASE_URL}/Pelunasan/MasterGlAccount.php`" filterType="CASH_BANK"
                            v-model="form.bankName" item-title="name" item-value="name"
                            @change="(o: any) => { if(o) { form.bankId = o.id; form.bankName = o.name; } }"
                        />
                    </v-col>
                    <v-col cols="12" md="6">
                         <v-text-field v-model="form.transDate" type="date" label="Payment Date" variant="outlined" density="compact"></v-text-field>
                         <v-textarea v-model="form.description" label="Notes / Reference" rows="2" variant="outlined" class="mt-2"></v-textarea>
                    </v-col>
                </v-row>

                <div class="mt-4">
                    <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-subtitle-2">Outstanding Invoices</div>
                        <div style="width: 250px">
                             <v-text-field 
                                v-model="searchInv" 
                                density="compact" 
                                variant="outlined" 
                                placeholder="Search Invoice No..." 
                                prepend-inner-icon="mdi-magnify" 
                                hide-details
                            ></v-text-field>
                        </div>
                    </div>
                    
                    <v-card variant="outlined">
                        <v-table density="compact">
                            <thead>
                                <tr class="bg-grey-lighten-4">
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th class="text-right">Outstanding</th>
                                    <th width="180" class="text-right">Pay Amount (Rp)</th>
                                    <th width="50"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="loadingInv">
                                    <td colspan="5" class="text-center py-4 text-caption">Loading invoices...</td>
                                </tr>
                                <tr v-else-if="invoices.length === 0">
                                    <td colspan="5" class="text-center py-4 text-caption font-italic">
                                        {{ form.customerNo ? 'No outstanding invoices found.' : 'Select a customer first.' }}
                                    </td>
                                </tr>
                                <tr v-for="inv in invoices" :key="inv.id" :class="inv.payAmount > 0 ? 'bg-blue-lighten-5' : ''">
                                    <td class="font-weight-medium text-primary">{{ inv.number }}</td>
                                    <td>{{ inv.date }}</td>
                                    <td class="text-right">{{ Number(inv.outstanding).toLocaleString('id-ID') }}</td>
                                    <td>
                                        <v-text-field 
                                            v-model.number="inv.payAmount" 
                                            type="number" 
                                            variant="outlined" 
                                            density="compact" 
                                            hide-details 
                                            class="text-right-input my-1"
                                        ></v-text-field>
                                    </td>
                                    <td class="text-center">
                                        <v-btn icon size="x-small" variant="text" color="success" @click="handlePayAll(inv.id)" title="Pay Full">
                                            <CircleCheckIcon size="18" />
                                        </v-btn>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card>
                </div>

                <div class="d-flex justify-end mt-4 gap-2">
                    <v-btn variant="outlined" color="secondary">Cancel</v-btn>
                    <v-btn color="primary" @click="handleSubmit" :loading="saving">
                        <WalletIcon size="18" class="mr-2"/> Record Payment
                    </v-btn>
                </div>
            </UiParentCard>
        </v-col>
    </v-row>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
</template>

<style scoped>.text-right-input :deep(input) { text-align: right; }</style>