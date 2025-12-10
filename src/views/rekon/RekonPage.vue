<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
    UploadIcon, 
    DownloadIcon, 
    SettingsIcon, 
    SearchIcon, 
    RefreshIcon, 
    EyeIcon,
    ArrowDownCircleIcon,
    FileTextIcon,
    CheckIcon,
    XIcon,
    PlusIcon // [BARU] Icon Plus
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";
const router = useRouter();
const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement | null>(null);

// --- STATE ---
const loading = ref(false);
const list = ref<any[]>([]);
const stats = ref<any>(null);
const search = ref("");
const filterStatus = ref("ALL");
const importing = ref(false);

// Modal Action State (Existing)
const modalOpen = ref(false);
const selectedItem = ref<any>(null);
const actionForm = reactive({ status: '', note: '' });
const uploadFiles = ref<File[]>([]);
const submitting = ref(false);

// [BARU] Modal Create State
const createModalOpen = ref(false);
const creating = ref(false);
const createForm = reactive({
    account_no: '',
    date: new Date().toISOString().substr(0, 10),
    val_date: new Date().toISOString().substr(0, 10),
    transaction_code: '',
    description1: '',
    description2: '',
    reference_no: '',
    debit: 0,
    credit: 0
});

const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true; };

const headers = [
    { title: 'Date', key: 'date', align: 'start' as const },
    { title: 'Trx Code', key: 'transaction_code', align: 'start' as const },
    { title: 'Account', key: 'account_no', align: 'start' as const },
    { title: 'Description', key: 'description1', align: 'start' as const },
    { title: 'Debit', key: 'debit', align: 'end' as const },
    { title: 'Credit', key: 'credit', align: 'end' as const },
    { title: 'Status', key: 'status', align: 'center' as const },
    { title: 'Action', key: 'actions', align: 'center' as const, sortable: false },
];

const statusOptions = ['New', 'Approved', 'Rejected'];

// --- METHODS ---
const fetchData = async () => {
    loading.value = true;
    try {
        // Fetch List
        const resList = await fetch(`${API_BASE_URL}/Rekon/List.php?q=${search.value}&status=${filterStatus.value}`);
        const jsonList = await resList.json();
        if(jsonList.s) list.value = jsonList.d;

        // Fetch Dashboard Stats
        const resStats = await fetch(`${API_BASE_URL}/Rekon/Dashboard.php`);
        const jsonStats = await resStats.json();
        if(jsonStats.s) stats.value = jsonStats.d;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

let timeout: any;
watch([search, filterStatus], () => {
    clearTimeout(timeout);
    timeout = setTimeout(fetchData, 500);
});

// Import Logic
const handleImportClick = () => fileInput.value?.click();
const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    importing.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Rekon/Import.php`, { method: "POST", body: formData });
        const json = await res.json();
        if (json.s) {
            showMsg(json.message, "success");
            fetchData();
        } else {
            showMsg(json.message, "error");
        }
    } catch {
        showMsg("Gagal upload file.", "error");
    } finally {
        importing.value = false;
        if(fileInput.value) fileInput.value.value = "";
    }
};

const downloadTemplate = () => {
    window.location.href = `${API_BASE_URL}/Rekon/DownloadTemplate.php`;
};

// [BARU] Create Logic
const openCreateModal = () => {
    // Reset Form
    createForm.account_no = '';
    createForm.date = new Date().toISOString().substr(0, 10);
    createForm.val_date = new Date().toISOString().substr(0, 10);
    createForm.transaction_code = '';
    createForm.description1 = '';
    createForm.description2 = '';
    createForm.reference_no = '';
    createForm.debit = 0;
    createForm.credit = 0;
    createModalOpen.value = true;
};

const handleCreateSubmit = async () => {
    if(!createForm.account_no || !createForm.transaction_code) {
        showMsg("Account No dan Trx Code wajib diisi", "error");
        return;
    }
    
    creating.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Rekon/Create.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createForm)
        });
        const json = await res.json();

        if(json.s) {
            showMsg("Transaksi berhasil ditambahkan", "success");
            createModalOpen.value = false;
            fetchData();
        } else {
            showMsg(json.message || "Gagal menyimpan", "error");
        }
    } catch(e) {
        showMsg("Terjadi kesalahan koneksi", "error");
    } finally {
        creating.value = false;
    }
};

// Modal Logic (Existing)
const openModal = (item: any) => {
    selectedItem.value = item;
    actionForm.status = item.status;
    actionForm.note = item.note || "";
    uploadFiles.value = [];
    modalOpen.value = true;
};

const handleActionSubmit = async () => {
    if(!selectedItem.value) return;
    submitting.value = true;

    const formData = new FormData();
    formData.append("id", String(selectedItem.value.id));
    formData.append("action", actionForm.status);
    formData.append("note", actionForm.note);
    formData.append("user", authStore.userData?.name || "System");
    formData.append("user_id", String(authStore.userData?.id || 0));

    uploadFiles.value.forEach((file) => formData.append("files[]", file));

    try {
        const res = await fetch(`${API_BASE_URL}/Rekon/Action.php`, { method: "POST", body: formData });
        const json = await res.json();
        if (json.s) {
            showMsg("Status berhasil diperbarui.", "success");
            modalOpen.value = false;
            fetchData();
        } else {
            showMsg(json.message, "error");
        }
    } catch {
        showMsg("Terjadi kesalahan koneksi.", "error");
    } finally {
        submitting.value = false;
    }
};

const fmtMoney = (val: number) => val ? val.toLocaleString('id-ID') : '-';

onMounted(fetchData);
</script>

<template>
    <v-row>
        <v-col cols="12" class="d-flex flex-wrap align-center justify-space-between gap-4">
            <div>
                <h2 class="text-h4 font-weight-bold">Rekonsiliasi Bank</h2>
                <div class="text-subtitle-2 text-grey">Kelola dan cocokkan transaksi bank internal</div>
            </div>
            <div class="d-flex gap-2">
                <v-btn variant="outlined" color="secondary" @click="router.push('/rekon/settings')" icon>
                    <SettingsIcon size="20" />
                </v-btn>
                <v-btn variant="outlined" color="primary" @click="downloadTemplate">
                    <DownloadIcon size="18" class="mr-2" /> Template
                </v-btn>
                
                <input type="file" accept=".xlsx, .csv" ref="fileInput" class="d-none" @change="handleFileChange" />
                <v-btn color="success" variant="tonal" @click="handleImportClick" :loading="importing">
                    <UploadIcon size="18" class="mr-2" /> Import Excel
                </v-btn>

                <v-btn color="primary" @click="openCreateModal">
                    <PlusIcon size="18" class="mr-2" /> Input Manual
                </v-btn>
            </div>
        </v-col>

        <v-col cols="12" md="3">
            <v-card variant="outlined" class="pa-4">
                <div class="d-flex justify-space-between">
                    <div>
                        <div class="text-caption text-grey">Total Debit</div>
                        <div class="text-h6 font-weight-bold text-green">Rp {{ fmtMoney(stats?.totals.total_debit || 0) }}</div>
                    </div>
                    <ArrowDownCircleIcon class="text-green-lighten-2" size="32" />
                </div>
            </v-card>
        </v-col>
        <v-col cols="12" md="3">
            <v-card variant="outlined" class="pa-4">
                <div class="d-flex justify-space-between">
                    <div>
                        <div class="text-caption text-grey">Total Kredit</div>
                        <div class="text-h6 font-weight-bold text-red">Rp {{ fmtMoney(stats?.totals.total_credit || 0) }}</div>
                    </div>
                    <ArrowDownCircleIcon class="text-red-lighten-2" size="32" style="transform: rotate(180deg);" />
                </div>
            </v-card>
        </v-col>
        <v-col cols="12" md="3">
            <v-card variant="outlined" class="pa-4 bg-blue-lighten-5 border-blue">
                <div class="text-caption text-blue-darken-2">Menunggu (New)</div>
                <div class="text-h4 font-weight-bold text-blue-darken-4">{{ stats?.status_counts.New || 0 }}</div>
            </v-card>
        </v-col>
        <v-col cols="12" md="3">
            <v-card variant="outlined" class="pa-4 bg-green-lighten-5 border-green">
                <div class="text-caption text-green-darken-2">Selesai (Approved)</div>
                <div class="text-h4 font-weight-bold text-green-darken-4">{{ stats?.status_counts.Approved || 0 }}</div>
            </v-card>
        </v-col>

        <v-col cols="12">
            <UiParentCard title="Daftar Transaksi">
                <div class="d-flex flex-wrap gap-4 mb-4">
                    <div style="flex: 1; min-width: 250px;">
                        <v-text-field
                            v-model="search"
                            density="compact"
                            variant="outlined"
                            label="Cari kode, deskripsi, referensi..."
                            prepend-inner-icon="mdi-magnify"
                            hide-details
                        >
                            <template v-slot:prepend-inner>
                                <SearchIcon size="20" class="text-grey" />
                            </template>
                        </v-text-field>
                    </div>
                    <div style="width: 200px;">
                        <v-select
                            v-model="filterStatus"
                            :items="['ALL', 'New', 'Approved', 'Rejected']"
                            label="Status"
                            density="compact"
                            variant="outlined"
                            hide-details
                        ></v-select>
                    </div>
                    <v-btn variant="text" icon @click="fetchData" :loading="loading">
                        <RefreshIcon size="20" class="text-primary" />
                    </v-btn>
                </div>

                <v-data-table
                    :headers="headers"
                    :items="list"
                    :loading="loading"
                    density="compact"
                    class="border rounded-md"
                >
                    <template v-slot:item.transaction_code="{ item }">
                        <span class="font-weight-medium font-mono text-primary">{{ item.transaction_code }}</span>
                    </template>
                    <template v-slot:item.debit="{ item }">
                        <span v-if="item.debit > 0" class="text-green font-weight-bold">{{ fmtMoney(item.debit) }}</span>
                        <span v-else>-</span>
                    </template>
                    <template v-slot:item.credit="{ item }">
                        <span v-if="item.credit > 0" class="text-red font-weight-bold">{{ fmtMoney(item.credit) }}</span>
                        <span v-else>-</span>
                    </template>
                    <template v-slot:item.status="{ item }">
                        <v-chip 
                            size="x-small" 
                            class="font-weight-bold"
                            :color="item.status === 'New' ? 'blue' : item.status === 'Approved' ? 'green' : 'red'"
                        >
                            {{ item.status }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-btn icon variant="text" size="small" color="primary" @click="openModal(item)">
                            <EyeIcon size="20" />
                        </v-btn>
                    </template>
                </v-data-table>
            </UiParentCard>
        </v-col>
    </v-row>

    <v-dialog v-model="createModalOpen" max-width="800" persistent>
        <v-card>
            <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
                Input Transaksi Baru
                <v-btn icon variant="text" color="white" @click="createModalOpen = false"><XIcon size="20"/></v-btn>
            </v-card-title>
            <v-card-text class="pt-4">
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="createForm.transaction_code" label="Transaction Code *" variant="outlined" density="compact" hint="Harus Unik" persistent-hint></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="createForm.account_no" label="Account No *" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="createForm.date" type="date" label="Date *" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="createForm.val_date" type="date" label="Val. Date" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="createForm.debit" type="number" label="Debit (Rp)" variant="outlined" density="compact" prefix="Rp"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="createForm.credit" type="number" label="Credit (Rp)" variant="outlined" density="compact" prefix="Rp"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field v-model="createForm.reference_no" label="Reference No." variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field v-model="createForm.description1" label="Description 1" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field v-model="createForm.description2" label="Description 2" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
                <v-spacer></v-spacer>
                <v-btn variant="text" color="grey" @click="createModalOpen = false">Batal</v-btn>
                <v-btn color="primary" variant="flat" @click="handleCreateSubmit" :loading="creating">
                    <CheckIcon size="18" class="mr-2"/> Simpan
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="modalOpen" max-width="700" scrollable>
        <v-card v-if="selectedItem">
            <v-card-title class="d-flex justify-space-between align-center px-4 py-3 bg-grey-lighten-4">
                <div>
                    <div class="text-h6 font-weight-bold">Detail Transaksi</div>
                    <div class="text-caption text-grey">{{ selectedItem.transaction_code }}</div>
                </div>
                <v-btn icon variant="text" size="small" @click="modalOpen = false"><XIcon size="20" /></v-btn>
            </v-card-title>
            
            <v-card-text class="pt-4" style="max-height: 70vh;">
                <v-row dense class="text-body-2">
                    <v-col cols="6">
                        <div class="text-caption text-grey">Account No</div>
                        <div class="font-weight-medium">{{ selectedItem.account_no }}</div>
                    </v-col>
                    <v-col cols="6">
                        <div class="text-caption text-grey">Value Date</div>
                        <div class="font-weight-medium">{{ selectedItem.val_date }}</div>
                    </v-col>
                    <v-col cols="12" class="mt-2">
                        <div class="bg-grey-lighten-5 pa-2 rounded border">
                            <div class="text-caption text-grey">Description</div>
                            <div class="font-weight-medium">{{ selectedItem.description1 }}</div>
                            <div class="text-caption">{{ selectedItem.description2 }}</div>
                        </div>
                    </v-col>
                    <v-col cols="6" class="mt-2">
                        <div class="text-caption text-grey">Debit</div>
                        <div class="font-weight-bold text-green">{{ fmtMoney(selectedItem.debit) }}</div>
                    </v-col>
                    <v-col cols="6" class="mt-2">
                        <div class="text-caption text-grey">Credit</div>
                        <div class="font-weight-bold text-red">{{ fmtMoney(selectedItem.credit) }}</div>
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <div v-if="selectedItem.file_list?.length" class="mb-4">
                    <div class="text-subtitle-2 mb-2">Lampiran Tersimpan</div>
                    <div class="d-flex flex-wrap gap-2">
                        <v-btn 
                            v-for="(url, idx) in selectedItem.file_list" 
                            :key="idx" 
                            :href="url" target="_blank" 
                            variant="outlined" size="small" color="primary" 
                            prepend-icon="mdi-file-document-outline"
                        >
                            File {{ idx + 1 }}
                        </v-btn>
                    </div>
                </div>

                <div class="bg-grey-lighten-5 pa-4 rounded">
                    <div class="text-subtitle-2 mb-3">Update Status</div>
                    <v-row dense>
                        <v-col cols="6">
                            <v-select 
                                v-model="actionForm.status" 
                                :items="statusOptions" 
                                label="Status" 
                                density="compact" 
                                variant="outlined" 
                                bg-color="white"
                            ></v-select>
                        </v-col>
                        <v-col cols="6">
                            <v-file-input 
                                v-model="uploadFiles" 
                                label="Upload Bukti (Optional)" 
                                multiple 
                                density="compact" 
                                variant="outlined" 
                                bg-color="white"
                                prepend-icon=""
                                prepend-inner-icon="mdi-paperclip"
                            ></v-file-input>
                        </v-col>
                        <v-col cols="12">
                            <v-textarea 
                                v-model="actionForm.note" 
                                label="Catatan / Note" 
                                rows="2" 
                                density="compact" 
                                variant="outlined" 
                                bg-color="white"
                            ></v-textarea>
                        </v-col>
                    </v-row>
                </div>
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-spacer></v-spacer>
                <v-btn variant="outlined" color="secondary" @click="modalOpen = false">Batal</v-btn>
                <v-btn color="primary" @click="handleActionSubmit" :loading="submitting">
                    <CheckIcon size="18" class="mr-2" /> Update Status
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right">
        {{ snackbar.text }}
        <template v-slot:actions><v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn></template>
    </v-snackbar>
</template>