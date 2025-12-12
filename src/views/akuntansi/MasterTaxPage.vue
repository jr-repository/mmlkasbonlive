<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { PlusIcon, TrashIcon, CheckIcon, XIcon, ReceiptTaxIcon, DeviceFloppyIcon, PencilIcon } from 'vue-tabler-icons'; // FIX: Tambahkan PencilIcon

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";

const loading = ref(false);
const taxes = ref<any[]>([]);
const dialog = ref(false);
// FIX: Tambahkan loading state untuk operasi CRUD
const saving = ref(false); 
const deleting = ref(false); 

const form = reactive({ id: 0, name: '', rate: 0, type: 'PPN', isDefault: false });

const headers = [
  { title: 'Nama Pajak', key: 'name', align: 'start' as const },
  { title: 'Rate (%)', key: 'rate', align: 'center' as const },
  { title: 'Tipe', key: 'type', align: 'center' as const },
//   { title: 'Default', key: 'isDefault', align: 'center' as const },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center' as const }
];

// --- SNACKBAR & MESSAGING ---
const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

const fetchTaxes = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/MasterData/Tax/List.php`);
    const json = await res.json();
    if(json.s) taxes.value = json.d;
    // Tidak perlu showMsg, karena ini fetch background
  } catch {
    showMsg("Gagal memuat data pajak.", "error");
  } finally { 
    loading.value = false; 
  }
};

const openModal = (item: any = null) => {
  if(item) {
    form.id = item.id;
    form.name = item.name;
    form.rate = item.rate;
    form.type = item.type;
    form.isDefault = item.isDefault;
  } else {
    form.id = 0;
    form.name = '';
    form.rate = 11;
    form.type = 'PPN';
    form.isDefault = false;
  }
  dialog.value = true;
};

const saveTax = async () => {
  saving.value = true; // FIX: Mulai loading
  try {
    // FIX: Tambahkan await untuk memastikan operasi selesai sebelum refresh
    const res = await fetch(`${API_BASE_URL}/MasterData/Tax/Save.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const json = await res.json();
    
    if (json.s) {
      dialog.value = false;
      fetchTaxes();
      showMsg(`Data Pajak ${form.id ? 'diperbarui' : 'ditambahkan'}.`, "success"); // FIX: Beri feedback
    } else {
      showMsg(json.message || "Gagal menyimpan data pajak.", "error"); // FIX: Tangani error
    }
  } catch {
    showMsg("Error koneksi saat menyimpan.", "error");
  } finally {
    saving.value = false; // FIX: Hentikan loading
  }
};

const deleteTax = async (id: number) => {
  if(!confirm("Yakin ingin menghapus data ini?")) return;
  
  // FIX: Tidak menggunakan deleting global, tapi tetap menjaga konsistensi fetch logic
  try {
    // FIX: Tambahkan await untuk memastikan operasi selesai sebelum refresh
    const res = await fetch(`${API_BASE_URL}/MasterData/Tax/Delete.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({id})
    });
    const json = await res.json();

    if (json.s) {
      fetchTaxes(); // FIX: Refresh data setelah sukses
      showMsg("Data Pajak berhasil dihapus.", "warning"); // FIX: Beri feedback
    } else {
      showMsg(json.message || "Gagal menghapus data pajak.", "error"); // FIX: Tangani error
    }
  } catch {
    showMsg("Error koneksi saat menghapus.", "error");
  }
};

onMounted(fetchTaxes);
</script>

<template>
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">
            Master Tax Configuration
          </h2>
          <div class="text-caption text-white opacity-90">
            Manage PPN and PPh rates for transactions.
          </div>
        </div>
      </div>
    </div>
  </v-card>

  <v-row class="mt-0">
        <v-col cols="12">
            <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
                 <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
                    <div class="d-flex align-center">
                        <ReceiptTaxIcon size="18" class="text-white mr-1" />
                        <div>
                            <h3 class="text-subtitle-1 font-weight-bold text-white">Tax Rate List</h3>
                            <div class="text-caption text-white opacity-80">All configured tax rates</div>
                        </div>
                    </div>
                    
                    <div class="d-flex align-center gap-1">
                        <v-btn 
                            color="success" 
                            variant="flat" 
                            size="small"
                            @click="openModal()"
                            class="text-none font-weight-bold text-caption mr-2"
                        >
                            <PlusIcon size="16" class="mr-1"/> Add New Tax
                        </v-btn>
                    </div>
                </div>

                <v-data-table 
                    :headers="headers" 
                    :items="taxes" 
                    :loading="loading" 
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

                    <template v-slot:item.rate="{ item }">
                        <span class="text-caption font-weight-bold text-primary">{{ item.rate }}%</span>
                    </template>
                    <template v-slot:item.type="{ item }">
                        <v-chip 
                            size="x-small" 
                            :color="item.type === 'PPN' ? 'blue' : 'orange'" 
                            variant="tonal" 
                            class="font-weight-bold text-uppercase text-caption"
                        >
                            {{ item.type }}
                        </v-chip>
                    </template>
                    <template v-slot:item.isDefault="{ item }">
                        <v-icon v-if="item.isDefault" color="green" size="18">mdi-check-circle</v-icon>
                        <v-icon v-else color="grey-lighten-1" size="18">mdi-minus</v-icon>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-btn icon variant="text" size="x-small" color="primary" @click="openModal(item)" title="Edit">
                            <PencilIcon size="16"/>
                        </v-btn>
                        <v-btn icon variant="text" size="x-small" color="error" @click="deleteTax(item.id)" title="Hapus">
                            <TrashIcon size="16"/>
                        </v-btn>
                    </template>
                </v-data-table>
            </v-card>
        </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="400" transition="dialog-bottom-transition" persistent>
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
                    <div class="bg-white rounded-circle pa-1 d-flex">
                        <ReceiptTaxIcon size="16" class="text-primary" />
                    </div>
          <span class="text-subtitle-1 font-weight-bold text-white">{{ form.id ? 'Edit Data Pajak' : 'Tambah Data Pajak Baru' }}</span>
                </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialog = false">
                    <XIcon size="18" />
                </v-btn>
      </div>

      <v-card-text class="pa-4 bg-grey-lighten-5">
        <v-text-field 
                    label="Nama Pajak" 
                    v-model="form.name" 
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-3 small-input"
                ></v-text-field>
        <v-text-field 
                    label="Rate (%)" 
                    v-model.number="form.rate" 
                    type="number" 
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-3 small-input"
                    append-inner-icon="mdi-percent"
                ></v-text-field>
        <v-select 
                    label="Tipe" 
                    v-model="form.type" 
                    :items="['PPN','PPH']" 
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-3 small-input"
                ></v-select>
        <v-checkbox 
                    label="Set sebagai Default" 
                    v-model="form.isDefault"
                    density="compact"
                    hide-details
                    color="primary"
                    class="text-caption"
                >
                    <template v-slot:label>
                        <span class="text-caption">Set as Default Tax Rate</span>
                    </template>
                </v-checkbox>
      </v-card-text>
      
            <v-divider></v-divider>
            
      <v-card-actions class="bg-white pa-3 justify-end">
        <v-btn variant="outlined" color="secondary" size="small" @click="dialog=false" class="px-4 text-caption">Batal</v-btn>
        <v-btn color="primary" size="small" @click="saveTax" :loading="saving" variant="flat" class="px-4 ml-1 text-caption">
          <DeviceFloppyIcon size="16" class="mr-1"/> Simpan
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
/* Gradient Theme */
.bg-gradient-smooth {
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}
.border-none {
  border: none !important;
  box-shadow: none !important;
}

/* Global Compact UI Styles (reused) */
.compact-header-card {
    margin-bottom: 1rem !important;
}
.compact-data-table :deep(.v-data-table__td) {
  font-size: 0.75rem !important;
  height: 38px !important; 
}
.compact-data-table :deep(.v-data-table-header) th {
  height: 35px !important; 
}

/* Input Compaction (reused) */
.small-input :deep(.v-field) {
  --v-field-padding-bottom: 4px;
  --v-field-padding-top: 4px;
  min-height: 36px !important;
}
.small-input :deep(.v-label) {
  font-size: 0.8rem;
}
.small-input :deep(input),
.small-input :deep(.v-field__append-inner) {
  font-size: 0.85rem;
}

/* Checkbox alignment fix */
:deep(.v-checkbox .v-label) {
    font-size: 0.75rem !important;
}
</style>