<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
 PlusIcon, TrashIcon, EyeIcon, DeviceFloppyIcon, XIcon, WalletIcon,
 CheckIcon, BanIcon, PencilIcon, SearchIcon, FileInvoiceIcon, ListCheckIcon, FormsIcon, ClockIcon 
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";
const authStore = useAuthStore();

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// --- STATE NAVIGASI TAB BARU ---
const tab = ref(1); 
const filterStatus = ref('ALL'); 

// --- STATE ---
const loadingList = ref(false);
const invoiceList = ref<any[]>([]);
const search = ref('');
const taxList = ref<any[]>([]); 

// --- FORM STATE ---
const form = reactive({
 id: 0, 
 transDate: format(new Date(), 'yyyy-MM-dd'),
 dueDate: format(new Date(), 'yyyy-MM-dd'), 
 customerNo: '',
 customerName: '',
 description: '',
 globalDiscPercent: 0,
 downPayment: 0,
 items: [
  { 
   id: Date.now(), 
   itemNo: '', 
   itemName: '', 
   quantity: 1, 
   unitPrice: 0, 
   itemDiscPercent: '', 
   ppnRate: 0, 
   pphRate: 0
  }
 ]
});
const saving = ref(false);
const isEditing = ref(false);

// --- MODAL DETAIL ITEM STATE BARU ---
const dialogItemDetail = ref(false);
const editingItemIndex = ref(-1); 
const itemDetailForm = reactive({
 itemNo: '', 
 itemName: '', 
 quantity: 1, 
 unitPrice: 0, 
 itemDiscPercent: '', 
 ppnRate: 0, 
 pphRate: 0,
 asyncSelectValue: null as any 
});

// --- DETAIL STATE ---
const dialogDetail = ref(false);
const detailData = ref<any>(null);
const dialogPayment = ref(false); 
const paymentForm = reactive({ 
    invoiceId: 0,
    paidAmount: 0,
    paidDate: format(new Date(), 'yyyy-MM-dd'),
    files: [] as File[],
    note: ''
});
const updatingPayment = ref(false);
const approving = ref(false);
const rejecting = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
 snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

// --- COMPUTED ---
const canApprove = computed(() => {
 return authStore.userData?.approvals?.includes('INVOICE') || authStore.userData?.role === 'admin';
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

const grandTotal = computed(() => taxableAmount.value + totalPPN.value - totalPPh.value); 
const netBalance = computed(() => grandTotal.value - form.downPayment);

const filteredInvoiceList = computed(() => {
  let list = invoiceList.value;
  if(filterStatus.value !== 'ALL') {
    list = list.filter(item => item.status === filterStatus.value || (filterStatus.value === 'SUBMITTED' && item.status === 'WAITING_PAYMENT'));
  }
  return list;
});

const isOverdue = (days: number) => days > 0;

// --- METHODS ---
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

const fetchListDebounced = () => {
 if (searchTimeout) clearTimeout(searchTimeout);
 searchTimeout = setTimeout(fetchList, 400); 
};

const fetchList = async () => {
 loadingList.value = true;
 try {
  const url = new URL(`${API_BASE_URL}/Invoice/List.php`);
  if(search.value) url.searchParams.append('q', search.value);
  const res = await fetch(url.toString());
  const json = await res.json();
  if(json.s) invoiceList.value = json.d.map((x:any, i:number) => ({
    ...x, 
    index: i+1,
    dueDate: x.dueDate,
    agingDays: x.agingDays
  }));
 } finally { loadingList.value = false; }
};

const addItem = () => {
 form.items.push({ 
  id: Date.now(), itemNo: '', itemName: '', quantity: 1, unitPrice: 0, itemDiscPercent: '', 
  ppnRate: getDefaultTax('PPN'), pphRate: getDefaultTax('PPH') 
 });
 openItemDetailModal(form.items[form.items.length - 1], form.items.length - 1);
};

const removeItem = (idx: number) => {
 if(form.items.length > 1) form.items.splice(idx, 1);
};

const onCustChange = (obj: any) => {
 if(obj) {
  form.customerNo = obj.customerNo;
  form.customerName = obj.name;
 }
};

const onItemChange = (obj: any) => {
 if(obj) {
  itemDetailForm.itemNo = obj.no;
  itemDetailForm.itemName = obj.name;
  itemDetailForm.unitPrice = obj.unitPrice || 0;
 }
};

const resetForm = () => {
 form.id = 0;
 form.transDate = format(new Date(), 'yyyy-MM-dd');
 form.dueDate = format(new Date(), 'yyyy-MM-dd'); 
 form.customerNo = ''; 
 form.customerName = '';
 form.description = '';
 form.items = [{ id: Date.now(), itemNo: '', itemName: '', quantity: 1, unitPrice: 0, itemDiscPercent: '', ppnRate: getDefaultTax('PPN'), pphRate: getDefaultTax('PPH') }];
 form.downPayment = 0; 
 form.globalDiscPercent = 0;
 isEditing.value = false;
};

const handleEdit = async (item: any) => {
 const res = await fetch(`${API_BASE_URL}/Invoice/Detail.php?id=${item.id}`);
 const json = await res.json();
 if(json.s) {
  const d = json.d;
  form.id = d.id;
  form.transDate = d.transDate; 
  form.dueDate = d.dueDate; 
  form.customerNo = d.customer.customerNo;
  form.customerName = d.customer.name;
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
   ppnRate: x.ppnRate || getDefaultTax('PPN'), 
   pphRate: x.pphRate || getDefaultTax('PPH')
  }));
  
  isEditing.value = true;
  tab.value = 2; 
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }
};

const handleSubmit = async () => {
 if(!form.customerNo) return showMsg("Pilih Customer", "error");
 if(form.items.some(i => !i.itemNo)) return showMsg("Ada Item yang belum dipilih", "error");
 saving.value = true;
 try {
  const payload = {
      ...form,
      dueDate: form.dueDate || format(new Date(), 'yyyy-MM-dd'),
      user_id: authStore.userData?.id,
      user_name: authStore.userData?.name
  }
  const res = await fetch(`${API_BASE_URL}/Invoice/Transaksi.php`, {
   method: 'POST', body: JSON.stringify(payload)
  });
  const json = await res.json();
  if(json.s) {
   showMsg(json.message);
   fetchList(); 
   resetForm();
      tab.value = 1; 
  } else {
   showMsg(json.message, "error");
  }
 } catch(e: any) { showMsg(e.message, "error"); } 
 finally { saving.value = false; }
};

const handleApprove = async (id: number) => {
 if(!confirm("Yakin Approve? Transaksi akan dikirim ke Accurate dan status berubah menjadi Waiting Payment (SUBMITTED).")) return;
 approving.value = true;
 try {
  const res = await fetch(`${API_BASE_URL}/Invoice/Approve.php`, {
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
  const res = await fetch(`${API_BASE_URL}/Invoice/Reject.php`, {
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
 const res = await fetch(`${API_BASE_URL}/Invoice/Detail.php?id=${id}`);
 const json = await res.json();
 if(json.s) {
    const d = json.d;
    detailData.value = d;
    // Inisiasi form payment saat membuka detail (walaupun modalnya belum dibuka)
    paymentForm.invoiceId = d.id;
    paymentForm.paidAmount = d.summary.net;
    paymentForm.paidDate = format(new Date(), 'yyyy-MM-dd');
    paymentForm.files = [];
    paymentForm.note = '';
 }
};

const openPaymentModal = (item: any) => {
  paymentForm.invoiceId = item.id;
  paymentForm.paidAmount = item.netBalance;
  paymentForm.paidDate = format(new Date(), 'yyyy-MM-dd');
  paymentForm.files = [];
  paymentForm.note = '';
  dialogPayment.value = true;
};

const handlePaymentSubmit = async () => {
    if(paymentForm.paidAmount <= 0) return showMsg("Jumlah pembayaran harus lebih dari 0", "error");

    updatingPayment.value = true;
    const formData = new FormData();
    formData.append("id", String(paymentForm.invoiceId));
    formData.append("paidAmount", String(paymentForm.paidAmount));
    formData.append("paidDate", paymentForm.paidDate);
    formData.append("user_id", String(authStore.userData?.id || 0));
    formData.append("note", paymentForm.note);
    
    if(paymentForm.files.length === 0) {
        showMsg("Wajib mengupload bukti pembayaran", "error");
        updatingPayment.value = false;
        return;
    }
    paymentForm.files.forEach((file) => {
        formData.append("files[]", file);
    });

    try {
        const res = await fetch(`${API_BASE_URL}/Invoice/Pay.php`, { 
            method: "POST", 
            body: formData 
        });
        const json = await res.json();
        
        if (json.s) {
            showMsg(json.message, "success");
            dialogPayment.value = false;
            fetchList();
        } else {
            showMsg(json.message || "Gagal update status PAID", "error");
        }
    } catch {
        showMsg("Terjadi kesalahan koneksi saat update status PAID.", "error");
    } finally {
        updatingPayment.value = false;
    }
};

const openItemDetailModal = (item: any, index: number) => {
 editingItemIndex.value = index;
 itemDetailForm.itemNo = item.itemNo;
 itemDetailForm.itemName = item.itemName;
 itemDetailForm.quantity = item.quantity;
 itemDetailForm.unitPrice = item.unitPrice;
 itemDetailForm.itemDiscPercent = item.itemDiscPercent;
 itemDetailForm.ppnRate = item.ppnRate;
 itemDetailForm.pphRate = item.pphRate;
 itemDetailForm.asyncSelectValue = item.itemNo;
 dialogItemDetail.value = true;
};

const saveItemDetail = () => {
 if (editingItemIndex.value >= 0) {
  if(!itemDetailForm.itemName) {
   return showMsg("Pilih Item terlebih dahulu!", "error");
  }

  const index = editingItemIndex.value;
  form.items[index].itemNo = itemDetailForm.itemNo;
  form.items[index].itemName = itemDetailForm.itemName;
  form.items[index].quantity = Number(itemDetailForm.quantity);
  form.items[index].unitPrice = Number(itemDetailForm.unitPrice);
  form.items[index].itemDiscPercent = String(itemDetailForm.itemDiscPercent);
  form.items[index].ppnRate = Number(itemDetailForm.ppnRate);
  form.items[index].pphRate = Number(itemDetailForm.pphRate);
 }
 dialogItemDetail.value = false;
 editingItemIndex.value = -1;
};

// --- HOOKS & WATCHERS ---
watch(search, fetchListDebounced); 
watch(filterStatus, fetchListDebounced); 

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
 <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
  <div class="bg-gradient-smooth px-4 py-3">
   <div class="d-flex align-center gap-2">
    <div>
     <h2 class="text-h6 font-weight-bold text-white mb-0">
      Sales Invoice Management
     </h2>
     <div class="text-caption text-white opacity-90">
      Create, track, and manage all your sales invoices.
     </div>
    </div>
   </div>
  </div>
 </v-card>

 <v-row class="mt-0">
  <v-col cols="12">
   <v-card elevation="4" rounded="lg" class="border overflow-hidden">
    
        <v-tabs v-model="tab" color="primary" class="bg-grey-lighten-4" density="compact" grow>
     <v-tab :value="1" class="text-none font-weight-bold">
      <ListCheckIcon size="18" class="mr-2"/> Transaction History
     </v-tab>
     <v-tab :value="2" class="text-none font-weight-bold">
      <FormsIcon size="18" class="mr-2"/> New Sales Invoice Entry
     </v-tab>
    </v-tabs>

        <v-window v-model="tab">
     
          <v-window-item :value="1">
      <v-card class="compact-data-card" flat>
       <div class="px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="d-flex align-center">
         <h3 class="text-subtitle-1 font-weight-bold text-primary">All Invoice Records</h3>
        </div>
        
        <div class="d-flex align-center gap-1" style="min-width: 350px;">
          <v-select
              v-model="filterStatus"
              :items="['ALL', 'DRAFT', 'WAITING_APPROVAL', 'REJECTED', 'SUBMITTED', 'PAID']"
              label="Filter Status"
              density="compact"
              variant="solo-filled"
              hide-details
              bg-color="white"
              class="rounded small-search-input"
          ></v-select>
         <v-text-field
          v-model="search"
          density="compact"
          variant="solo-filled"
          label="Search Data..."
          hide-details
          single-line
          bg-color="white"
          class="rounded small-search-input"
         >
          <template v-slot:prepend-inner>
           <SearchIcon size="18" class="text-grey-darken-1" />
          </template>
         </v-text-field>
        </div>
       </div>

       <v-data-table 
        :headers="[
         { title: 'No', key: 'index', align:'center' as const, width:'30px' },
         { title: 'Invoice #', key: 'number', align:'start' as const, width:'100px' },
         { title: 'Customer', key: 'customerName', align:'start' as const },
         { title: 'Due Date', key: 'dueDate', align:'center' as const, width:'100px' },
         { title: 'Aging Days', key: 'agingDays', align:'center' as const, width:'100px' },
         { title: 'Net Balance', key: 'netBalance', align:'end' as const, width:'120px' },
         { title: 'Status', key: 'status', align:'center' as const, width:'120px' },
         { title: 'Action', key: 'actions', align:'center' as const, width:'80px' }
        ]" 
        :items="filteredInvoiceList" 
        :loading="loadingList" 
        density="compact"
        hover
        class="rounded-0 compact-data-table"
       >
        <template v-slot:headers="{ columns }">
         <tr class="bg-gradient-smooth">
         <template v-for="column in columns" :key="column.key ?? column.title">
           <th class="text-caption font-weight-bold text-uppercase text-white py-2 border-none" :class="`text-${column.align}`">
            {{ column.title }}
           </th>
          </template>
         </tr>
        </template>
        
        <template v-slot:item.number="{ item }">
         <span class="font-weight-bold text-primary text-caption">{{ item.number }}</span>
        </template>
        
        <template v-slot:item.dueDate="{ item }">
          <span class="text-caption">{{ item.dueDate }}</span>
        </template>

        <template v-slot:item.agingDays="{ item }">
          <v-chip
            v-if="['SUBMITTED', 'WAITING_APPROVAL', 'DRAFT'].includes(item.status) && item.dueDate !== '-'"
            size="x-small" 
            label
            :color="isOverdue(item.agingDays) ? 'red' : (item.agingDays < 0 ? 'grey' : 'orange')"
            variant="flat"
            class="font-weight-bold text-caption"
          >
            <ClockIcon size="14" class="mr-1" v-if="item.agingDays < 0"/>
            {{ item.agingDays < 0 ? `T-${Math.abs(item.agingDays)}` : `${item.agingDays} Hari` }}
          </v-chip>
          <span v-else class="text-caption">-</span>
        </template>
        
        <template v-slot:item.netBalance="{ item }">
         <span class="text-caption font-weight-bold">Rp {{ Number(item.netBalance).toLocaleString('id-ID') }}</span>
        </template>
        
        <template v-slot:item.status="{ item }">
         <v-chip 
          size="x-small" 
          variant="tonal"
          class="font-weight-bold text-uppercase text-caption"
          :color="item.status === 'SUBMITTED' ? 'orange' : (item.status === 'REJECTED' ? 'red' : (item.status === 'PAID' ? 'green' : (item.status === 'WAITING_APPROVAL' ? 'blue' : 'grey')))"
         >
          {{ item.status === 'SUBMITTED' ? 'WAITING PAYMENT' : item.status.replace('_', ' ') }}
         </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
         <v-btn icon variant="text" color="primary" size="x-small" @click="openDetail(item.id)" title="View Detail">
          <EyeIcon size="16" />
         </v-btn>
         <v-btn 
            v-if="['DRAFT', 'WAITING_APPROVAL', 'REJECTED'].includes(item.status)" 
            icon color="orange" 
            variant="text" 
            size="x-small" 
            @click="handleEdit(item)"
            title="Edit"
        >
          <PencilIcon size="16"/>
         </v-btn>
         <v-btn 
            v-if="item.status === 'SUBMITTED'" 
            icon 
            color="success" 
            variant="text" 
            size="x-small" 
            @click="openPaymentModal(item)"
            title="Input Payment"
        >
          <WalletIcon size="16"/>
         </v-btn>
        </template>
       </v-data-table>
      </v-card>
     </v-window-item>

          <v-window-item :value="2">
      <v-card-text class="pa-3">
       <div class="bg-grey-lighten-5 pa-3 rounded mb-4 d-flex align-center justify-space-between">
        <span class="text-subtitle-1 font-weight-bold text-primary">{{ isEditing ? 'Edit Invoice' : 'New Sales Invoice Entry' }}</span>
        <v-btn v-if="isEditing" color="primary" variant="tonal" size="small" @click="resetForm" class="text-caption text-none">Batal Edit</v-btn>
       </div>
       
       <v-row>
        <v-col cols="12" md="4" class="py-1">
         <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">General Information</h6>
         <v-text-field 
          type="date" 
          label="Transaction Date" 
          v-model="form.transDate" 
          variant="outlined" 
          density="compact"
          hide-details
          class="mb-2 small-input"
         ></v-text-field>
         
         <v-text-field 
          type="date" 
          label="Due Date" 
          v-model="form.dueDate" 
          variant="outlined" 
          density="compact"
          hide-details
          class="mb-2 small-input"
         ></v-text-field>

         <AsyncSelect 
          label="Select Customer" 
          :apiEndpoint="`${API_BASE_URL}/Invoice/MasterCustomer.php`" 
          item-title="name" 
          item-value="customerNo"
          v-model="form.customerNo"
          @change="onCustChange"
          density="compact"
          hide-details
          class="mb-2 small-input"
         />
         <v-textarea 
          label="Keterangan / Notes" 
          v-model="form.description" 
          rows="2" 
          variant="outlined" 
          density="compact"
          hide-details
          class="small-input small-textarea"
         ></v-textarea>
        </v-col>
        <v-col cols="12" md="8" class="py-1">
         <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Item Details</h6>
         <v-card variant="outlined" class="rounded-md mt-2 bg-grey-lighten-5 compact-list-card">
          <v-table density="compact" class="bg-transparent item-table-form compact-invoice-table">
           <thead>
            <tr class="bg-grey-lighten-4">
             <th class="font-weight-bold text-primary text-caption" width="250">Item (Click to Edit)</th>
             <th class="text-center font-weight-bold text-primary text-caption" width="80">Qty</th>
             <th class="text-right font-weight-bold text-primary text-caption" width="120">Harga</th>
             <th class="text-center font-weight-bold text-primary text-caption" width="80">Disc (%)</th>
             <th class="text-center font-weight-bold text-primary text-caption" width="100">PPN</th>
             <th class="text-center font-weight-bold text-primary text-caption" width="100">PPh</th>
             <th width="30"></th>
            </tr>
           </thead>
           <tbody>
            <tr v-for="(item, i) in form.items" :key="item.id" class="hover-row">
             <td class="py-1 item-cell" @click="openItemDetailModal(item, i)">
              <div class="text-primary font-weight-bold text-caption item-name-link">{{ item.itemName || 'Click to Select Item' }}</div>
              <div class="text-xsmall text-medium-emphasis font-mono">{{ item.itemNo }}</div>
             </td>
             <td class="align-top py-1 text-center text-caption font-weight-medium">
              {{ item.quantity.toLocaleString() }}
             </td>
             <td class="align-top py-1 text-right text-caption font-weight-medium">
              Rp {{ item.unitPrice.toLocaleString('id-ID') }}
             </td>
             <td class="align-top py-1 text-center text-caption font-weight-medium">
              {{ item.itemDiscPercent || '0' }}%
             </td>
             <td class="align-top py-1 text-center text-caption">
              {{ item.ppnRate }}%
             </td>
             <td class="align-top py-1 text-center text-caption">
              {{ item.pphRate }}%
             </td>
             <td class="text-center align-top py-1">
              <v-btn 
               icon 
               variant="text" 
               color="error" 
               size="x-small" 
               @click="removeItem(i)" 
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
        
        <v-col cols="12" md="4" class="py-1">
         
         <h6 class="text-subtitle-2 font-weight-bold mb-2 text-primary">Calculation Summary</h6>
         <v-card variant="outlined" class="pa-3 bg-grey-lighten-5">
          <div class="d-flex justify-space-between text-caption font-weight-medium mb-1">
           <span>Subtotal (Net Disc Item):</span>
           <span class="font-weight-bold text-medium-emphasis">Rp {{ subtotal.toLocaleString('id-ID') }}</span>
          </div>
          <div class="d-flex justify-space-between mb-1 text-caption">
           <span>Global Discount ({{ form.globalDiscPercent }}%):</span>
           <span class="text-red"> - Rp {{ discountAmount.toLocaleString('id-ID') }}</span>
          </div>
          <div class="d-flex justify-space-between mb-1 text-caption font-weight-bold border-top pt-1 mt-1">
           <span>Taxable Amount:</span>
           <span>Rp {{ taxableAmount.toLocaleString('id-ID') }}</span>
          </div>
          <div class="d-flex justify-space-between mb-1 text-caption">
           <span>Total PPN:</span>
           <span class="text-blue">+ Rp {{ totalPPN.toLocaleString('id-ID') }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2 text-caption border-bottom pb-2">
           <span>Total PPh (Potongan):</span>
           <span class="text-green-darken-1">- Rp {{ totalPPh.toLocaleString('id-ID') }}</span>
          </div>
          
          <div class="d-flex justify-space-between mb-2">
           <span class="font-weight-bold text-subtitle-2">Grand Total:</span>
           <span class="font-weight-bold text-primary text-subtitle-2">Rp {{ grandTotal.toLocaleString('id-ID') }}</span>
          </div>
         </v-card>

         <h6 class="text-subtitle-2 font-weight-bold mb-2 mt-4 text-primary">Global Adjustments</h6>

         <v-card variant="outlined" class="pa-3 bg-grey-lighten-5">
          <div class="d-flex align-center justify-space-between mb-2">
           <div class="text-caption font-weight-medium" style="width: 120px;">Disc Global (%):</div>
           <v-text-field 
            v-model="form.globalDiscPercent" 
            type="number" 
            density="compact" 
            hide-details 
            variant="outlined" 
            class="tiny-input small-input bg-white"
           ></v-text-field>
          </div>

          <div class="d-flex align-center justify-space-between my-2 bg-white pa-2 rounded border">
           <div class="d-flex align-center text-caption">
            <WalletIcon size="16" class="mr-2 text-grey"/>
            <span class="font-weight-medium">Down Payment (DP):</span>
           </div>
           <v-text-field 
            v-model="form.downPayment" 
            type="number" 
            density="compact" 
            hide-details 
            variant="outlined" 
            class="text-right-input small-input" 
            prefix="Rp"
           ></v-text-field>
          </div>

          <div class="d-flex justify-space-between mt-2 pt-2 border-top">
           <span class="font-weight-bold text-subtitle-1">Net Balance:</span>
           <span class="font-weight-bold text-red text-h6">Rp {{ netBalance.toLocaleString('id-ID') }}</span>
          </div>
         </v-card>
         
         <v-btn 
          block 
          color="primary" 
          size="large" 
          class="mt-4 text-none font-weight-bold" 
          @click="handleSubmit" 
          :loading="saving"
         >
          <DeviceFloppyIcon size="20" class="mr-2"/> {{ isEditing ? 'Simpan Perubahan' : 'Submit New Invoice' }}
         </v-btn>
        </v-col>
       </v-row>
      </v-card-text>
     </v-window-item>

    </v-window>
   </v-card>
  </v-col>
 </v-row>

  <v-dialog v-model="dialogItemDetail" max-width="500" transition="dialog-bottom-transition" persistent>
  <v-card class="rounded-lg overflow-hidden small-dialog-card">
   <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
    <div class="d-flex align-center gap-2">
     <div class="bg-white rounded-circle pa-1 d-flex">
      <PencilIcon size="16" class="text-primary" />
     </div>
     <div>
      <span class="text-subtitle-1 font-weight-bold text-white d-block" style="line-height: 1.2;">Edit Item Detail</span>
      <span class="text-caption text-white opacity-80 font-weight-normal">({{ itemDetailForm.itemName || 'No Item Selected' }})</span>
     </div>
    </div>
    <v-btn icon variant="text" color="white" size="small" @click="dialogItemDetail = false">
     <XIcon size="18" />
    </v-btn>
   </div>
   
   <v-card-text class="pa-4 bg-grey-lighten-5 dialog-detail-content">
    
        <v-row no-gutters class="mb-3">
     <div class="text-caption font-weight-bold mb-1 d-block text-primary">Item / Service</div>
     <AsyncSelect 
      label="Select Item" 
      :apiEndpoint="`${API_BASE_URL}/Invoice/MasterItem.php`"
      item-title="name" 
      item-value="no"
      :model-value="itemDetailForm.itemNo"
      @change="(o:any) => { onItemChange(o); itemDetailForm.asyncSelectValue = o?.no }"
      density="compact"
      hide-details
      variant="outlined"
      class="small-input"
      :key="itemDetailForm.asyncSelectValue"
     />
    </v-row>

        <v-row no-gutters class="d-flex gap-4">
     <div style="flex-grow: 1;">
      <div class="text-caption font-weight-bold mb-1 d-block text-primary">Quantity</div>
      <v-text-field 
       type="number" 
       label="Qty"
       v-model="itemDetailForm.quantity" 
       density="compact" 
       hide-details 
       variant="outlined" 
       class="centered-input small-input bg-white"
      ></v-text-field>
     </div>
     <div style="flex-grow: 2;">
      <div class="text-caption font-weight-bold mb-1 d-block text-primary">Unit Price</div>
      <v-text-field 
       type="number" 
       label="Price"
       v-model="itemDetailForm.unitPrice" 
       density="compact" 
       hide-details 
       variant="outlined"
       class="text-right-input small-input bg-white"
       prefix="Rp"
      ></v-text-field>
     </div>
     <div style="width: 100px;">
      <div class="text-caption font-weight-bold mb-1 d-block text-primary">Disc (%)</div>
      <v-text-field 
       type="number" 
       label="Disc"
       v-model="itemDetailForm.itemDiscPercent" 
       density="compact" 
       hide-details 
       variant="outlined"
       class="centered-input small-input bg-white"
       suffix="%"
      ></v-text-field>
     </div>
    </v-row>

        <v-row no-gutters class="mt-4 d-flex gap-4">
     <div style="flex-grow: 1;">
      <div class="text-caption font-weight-bold mb-1 d-block text-primary">PPN Rate</div>
      <v-select 
       v-model="itemDetailForm.ppnRate" 
       :items="ppnOptions" 
       item-title="name" 
       item-value="rate" 
       density="compact" 
       hide-details 
       variant="outlined" 
       class="small-select small-input bg-white"
      ></v-select>
     </div>

     <div style="flex-grow: 1;">
      <div class="text-caption font-weight-bold mb-1 d-block text-primary">PPh Rate</div>
      <v-select 
       v-model="itemDetailForm.pphRate" 
       :items="pphOptions" 
       item-title="name" 
       item-value="rate" 
       density="compact" 
       hide-details 
       variant="outlined" 
       class="small-select small-input bg-white"
      ></v-select>
     </div>
    </v-row>

   </v-card-text>
   
   <v-card-actions class="bg-white pa-3 justify-end border-top">
    <v-btn color="grey-darken-1" variant="text" size="small" @click="dialogItemDetail = false" class="px-4 text-none text-caption">
     Batal
    </v-btn>
    <v-btn color="primary" variant="flat" size="small" @click="saveItemDetail" class="px-4 text-none text-caption">
     <DeviceFloppyIcon size="16" class="mr-1"/> Simpan
    </v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>

  <v-dialog v-model="dialogDetail" max-width="800" transition="dialog-bottom-transition" scrollable>
  <v-card class="rounded-lg overflow-hidden small-dialog-card" v-if="detailData">
   <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
    <div class="d-flex align-center gap-2">
     <div class="bg-white rounded-circle pa-1 d-flex">
      <FileInvoiceIcon size="16" class="text-primary" />
     </div>
     <div>
      <span class="text-subtitle-1 font-weight-bold text-white d-block" style="line-height: 1.2;">Invoice Detail: #{{ detailData.number }}</span>
      <span class="text-caption text-white opacity-80 font-weight-normal">View complete transaction info</span>
     </div>
    </div>
    <v-btn icon variant="text" color="white" size="small" @click="dialogDetail = false">
     <XIcon size="18" />
    </v-btn>
   </div>
   
   <v-card-text class="pa-0 bg-grey-lighten-5 dialog-detail-content" style="max-height: 80vh;">
    <div class="bg-white pa-4 mb-3 shadow-sm border-bottom">
     <v-row dense>
      <v-col cols="12" sm="6" class="py-1">
       <div class="text-overline text-medium-emphasis mb-0 text-xsmall">Invoice Info</div>
       <div class="d-flex align-center gap-1 mb-1">
        <span class="text-h6 font-weight-bold text-primary">{{ detailData.number }}</span>
       </div>
       <div class="d-flex align-center gap-1 mb-1 text-grey-darken-1 text-caption">
        <v-icon size="14">mdi-calendar-month</v-icon>
        <span>Trans: {{ detailData.transDate }} | Due: {{ detailData.dueDate }}</span>
       </div>
       <div class="d-flex align-center gap-1 text-grey-darken-2 text-caption">
        <v-chip size="x-small" variant="flat" :color="detailData.status === 'SUBMITTED' ? 'orange' : (detailData.status === 'REJECTED' ? 'red' : (detailData.status === 'PAID' ? 'green' : 'blue'))" class="font-weight-bold text-uppercase">
         {{ detailData.status === 'SUBMITTED' ? 'WAITING PAYMENT' : detailData.status.replace('_', ' ') || 'UNKNOWN' }}
        </v-chip>
       </div>
      </v-col>

      <v-col cols="12" sm="6" class="text-sm-right py-1">
       <div class="text-overline text-medium-emphasis mb-0 text-xsmall">Customer Info</div>
       <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-1">{{ detailData.customer.name }}</div>
       <div class="text-xsmall text-grey-darken-1 mt-1 text-left text-sm-right bg-grey-lighten-4 pa-1 rounded border small-note">
        <span class="font-weight-bold">Note:</span> "{{ detailData.description || 'No description provided' }}"
       </div>
      </v-col>
     </v-row>
    </div>

    <div class="px-4 pb-4">
     <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center text-primary">
      <v-icon start color="primary" size="x-small">mdi-format-list-bulleted-square</v-icon>
      Items Breakdown
     </div>
     <v-card variant="outlined" class="border rounded-lg overflow-hidden bg-white">
      <v-table density="compact" class="compact-detail-table">
       <thead class="bg-grey-lighten-4">
        <tr>
         <th width="200" class="text-caption">Item Description</th>
         <th class="text-center text-caption" width="50">Qty</th>
         <th class="text-right text-caption" width="100">Unit Price</th>
         <th class="text-center text-caption" width="70">Disc %</th>
         <th class="text-center text-caption" width="70">Tax Rate</th>
         <th class="text-right text-caption" width="120">Line Total</th>
        </tr>
       </thead>
       <tbody>
        <tr v-for="(item, i) in detailData.items" :key="i" class="hover-bg">
         <td>
          <div class="font-weight-medium text-caption">{{ item.itemName }}</div>
          <div class="text-xsmall text-medium-emphasis font-mono">{{ item.itemNo }}</div>
         </td>
         <td class="text-center text-caption font-weight-bold">{{ item.quantity }}</td>
         <td class="text-right text-caption">Rp {{ Number(item.unitPrice).toLocaleString() }}</td>
         <td class="text-center text-caption">{{ item.itemDiscPercent || '0' }}%</td>
         <td class="text-center text-caption">
          <span v-if="item.ppnRate > 0" class="text-blue font-weight-bold d-block">PPN ({{ item.ppnRate }}%)</span>
          <span v-if="item.pphRate > 0" class="text-red font-weight-bold d-block">PPh ({{ item.pphRate }}%)</span>
          <span v-if="item.ppnRate === 0 && item.pphRate === 0" class="text-grey-darken-1">None</span>
         </td>
         <td class="text-right text-caption font-weight-bold">Rp {{ Number(item.lineTotal).toLocaleString('id-ID') }}</td>
        </tr>
       </tbody>
      </v-table>
     </v-card>

     <div class="d-flex justify-end mt-4">
      <v-card variant="outlined" class="pa-2 bg-white" style="width: 300px;">
       <div class="d-flex justify-space-between text-caption mb-1">
        <span>Subtotal:</span> <span class="font-weight-bold">Rp {{ Number(detailData.summary.subtotal).toLocaleString('id-ID') }}</span>
       </div>
       <div class="d-flex justify-space-between text-caption mb-1">
        <span>Disc Global ({{ detailData.globalDiscPercent }}%):</span> <span class="font-weight-bold text-red">- Rp {{ (Number(detailData.summary.subtotal) * detailData.globalDiscPercent / 100).toLocaleString('id-ID') }}</span>
       </div>
       <div class="d-flex justify-space-between text-caption mb-1">
        <span>Total PPN:</span> <span class="font-weight-bold text-blue">+ Rp {{ Number(detailData.summary.ppn).toLocaleString('id-ID') }}</span>
       </div>
       <div class="d-flex justify-space-between text-caption border-bottom pb-2 mb-2">
        <span>Total PPh:</span> <span class="font-weight-bold text-green-darken-1">- Rp {{ Number(detailData.summary.pph).toLocaleString('id-ID') }}</span>
       </div>
       <div class="d-flex justify-space-between text-subtitle-2 font-weight-bold">
        <span>Grand Total:</span> <span class="text-primary">Rp {{ Number(detailData.summary.total).toLocaleString('id-ID') }}</span>
       </div>
       <div class="d-flex justify-space-between text-caption font-weight-medium my-1">
        <span>Down Payment:</span> <span>Rp {{ Number(detailData.downPayment).toLocaleString('id-ID') }}</span>
       </div>
       <v-divider class="my-2"></v-divider>
       <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold">
        <span>Net Balance:</span> <span class="text-red">Rp {{ Number(detailData.summary.net).toLocaleString('id-ID') }}</span>
       </div>
      </v-card>
     </div>
     
     <div v-if="detailData.status === 'PAID' && detailData.paymentFiles?.length" class="mt-4">
        <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center text-success">
            <v-icon start color="success" size="x-small">mdi-file-check</v-icon>
            Bukti Pembayaran (PAID)
        </div>
        <div class="d-flex flex-wrap gap-2">
            <v-btn
                v-for="(file, i) in detailData.paymentFiles"
                :key="i"
                :href="file.url"
                target="_blank"
                variant="outlined"
                size="small"
                color="success"
                prepend-icon="mdi-download"
                class="text-caption text-none"
            >
                {{ file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name }}
            </v-btn>
        </div>
     </div>


    </div>
   </v-card-text>
   
   <v-divider></v-divider>
   
   <v-card-actions v-if="detailData.status === 'WAITING_APPROVAL' && canApprove" class="bg-white pa-3 justify-end">
    <v-btn color="error" variant="outlined" size="small" @click="handleReject(detailData.id)" :loading="rejecting" class="px-4 text-caption">
     <BanIcon size="16" class="mr-1"/> Reject
    </v-btn>
    <v-btn color="success" variant="flat" size="small" @click="handleApprove(detailData.id)" :loading="approving" class="px-4 text-caption">
     <CheckIcon size="16" class="mr-1"/> Approve & Send
    </v-btn>
   </v-card-actions>
   <v-card-actions v-else-if="detailData.status === 'SUBMITTED'" class="bg-white pa-3 justify-end">
    <v-btn color="success" variant="flat" size="small" @click="openPaymentModal(detailData)" class="px-4 text-caption">
     <WalletIcon size="16" class="mr-1"/> Input Payment
    </v-btn>
    <v-btn variant="outlined" color="primary" size="small" @click="dialogDetail = false" class="px-4 text-caption">Close Detail</v-btn>
   </v-card-actions>
   <v-card-actions v-else class="bg-white pa-3 justify-end">
    <v-btn variant="outlined" color="primary" size="small" @click="dialogDetail = false" class="px-4 text-caption">Close Detail</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>

  <v-dialog v-model="dialogPayment" max-width="500" persistent>
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <div class="bg-white rounded-circle pa-1 d-flex">
            <WalletIcon size="16" class="text-primary" />
          </div>
          <span class="text-subtitle-1 font-weight-bold text-white">Input Pembayaran Invoice</span>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialogPayment = false">
          <XIcon size="18" />
        </v-btn>
      </div>
      
      <v-card-text class="pa-4 bg-grey-lighten-5">
        <v-row dense>
          <v-col cols="12" class="py-1">
            <div class="text-caption text-medium-emphasis">ID Invoice Lokal: <strong>#{{ paymentForm.invoiceId }}</strong></div>
            <v-alert density="compact" type="info" variant="tonal" class="my-2 text-caption">
                Pencatatan ini hanya berlaku di sistem lokal (status PAID). Tidak ada pengiriman data ke Accurate.
            </v-alert>
          </v-col>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field 
                v-model.number="paymentForm.paidAmount" 
                type="number" 
                label="Jumlah Dibayar (Net Balance)" 
                variant="outlined" 
                density="compact"
                hide-details
                prefix="Rp"
                class="small-input text-right-input"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="py-1">
            <v-text-field 
                v-model="paymentForm.paidDate" 
                type="date" 
                label="Tanggal Pembayaran" 
                variant="outlined" 
                density="compact"
                hide-details
                class="small-input"
            ></v-text-field>
          </v-col>
          <v-col cols="12" class="py-1">
            <v-textarea 
                v-model="paymentForm.note" 
                label="Catatan Pembayaran (Opsional)" 
                rows="2" 
                density="compact" 
                variant="outlined" 
                hide-details
                class="small-input small-textarea"
            ></v-textarea>
          </v-col>
          <v-col cols="12" class="py-1">
            <v-file-input 
              v-model="paymentForm.files" 
              label="Upload Bukti Pembayaran (Wajib)" 
              multiple 
              density="compact" 
              variant="outlined" 
              bg-color="white"
              prepend-icon=""
              prepend-inner-icon="mdi-paperclip"
              class="small-input small-file-input"
            ></v-file-input>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-card-actions class="bg-white pa-3 justify-end border-top">
        <v-btn variant="outlined" color="secondary" size="small" @click="dialogPayment = false" class="px-4 text-caption">Batal</v-btn>
        <v-btn color="success" variant="flat" size="small" @click="handlePaymentSubmit" :loading="updatingPayment" class="px-4 text-caption">
          <CheckIcon size="16" class="mr-1"/> Tandai PAID
        </v-btn>
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
/* GENERAL STYLES */
.bg-gradient-smooth {
 background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}
.font-mono {
 font-family: 'Roboto Mono', monospace;
}
.centered-input :deep(input) {
 text-align: center;
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
.border-top {
 border-top: 1px solid rgba(0,0,0,0.12);
}
.text-xsmall {
 font-size: 0.65rem !important;
}
.small-note {
 padding: 4px !important;
}
.hover-row {
 cursor: pointer;
}
.hover-row:hover {
 background-color: #e3f2fd !important; 
}
.item-name-link {
 cursor: pointer;
 text-decoration: underline;
 text-decoration-style: dashed;
}

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
.tiny-input { width: 100%; max-width: 100px; } 
.tiny-input :deep(.v-field) {
 min-height: 36px !important;
 padding-top: 4px !important;
 padding-bottom: 4px !important;
}
.tiny-input :deep(input) {
 font-size: 0.85rem;
}


/* Specific item input inside table - DIBUANG karena sekarang pakai modal */
/* Item table row/cell padding */
.item-table-form :deep(td) {
 padding-top: 4px !important;
 padding-bottom: 4px !important;
}

/* Data table custom styling */
.compact-data-table :deep(.v-data-table__td) {
 font-size: 0.75rem !important;
 height: 38px !important; 
}
.compact-data-table :deep(.v-data-table-header) th {
 height: 35px !important; 
}
.compact-data-table :deep(.v-data-table-header) th.text-start {
 text-align: left !important;
}
.compact-data-table :deep(.v-data-table-header) th.text-end {
 text-align: right !important;
}

/* Detail dialog font and table */
.dialog-detail-content {
 font-size: 0.8rem;
}
.compact-detail-table :deep(td), .compact-detail-table :deep(th) {
 padding: 6px 8px !important;
 font-size: 0.75rem !important;
}
/* File Input (in modal) */
.small-file-input :deep(.v-field) { 
    min-height: 36px !important; 
}
.small-file-input :deep(.v-field__input) {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
}
.small-file-input :deep(.v-field__input) div {
    font-size: 0.75rem !important; 
}
.small-file-input :deep(.v-field-label--floating) { 
    font-size: 0.7rem; 
    transform: translateY(-100%) scale(0.75); 
}
.small-input :deep(.v-field__prepend-inner),
.small-input :deep(.v-field__append-inner) {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
}

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

.small-select :deep(.v-field) {
    min-height: 32px !important;
    padding-top: 2px !important;
    padding-bottom: 2px !important;
}
.small-select :deep(.v-field__input) { 
    font-size: 0.75rem !important; 
    padding-top: 2px !important; 
    padding-bottom: 2px !important; 
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
</style>