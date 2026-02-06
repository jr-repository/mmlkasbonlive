<script setup>
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';
import { 
  SettingsIcon, 
  PlusIcon, 
  TrashIcon, 
  ArrowUpCircleIcon, 
  ArrowDownCircleIcon,
  CirclePlusIcon,
  DeviceFloppyIcon,
  XIcon
} from 'vue-tabler-icons';

const API_BASE = 'https://multimitralogistik.id/Backend/Api/Payroll/Component';

// --- STATE ---
const incomes = ref([]);
const deductions = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const activeType = ref('');
const newItemName = ref('');

// --- METHODS ---
const loadData = async () => {
    loading.value = true;
    try {
        const res = await fetchWrapper.get(`${API_BASE}/List.php`);
        if (res.s) {
            incomes.value = res.d.incomes;
            deductions.value = res.d.deductions;
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const openModal = (type) => {
    activeType.value = type;
    newItemName.value = '';
    dialog.value = true;
};

const saveItem = async () => {
    if (!newItemName.value) return;
    
    saving.value = true;
    try {
        const res = await fetchWrapper.post(`${API_BASE}/Save.php`, {
            name: newItemName.value,
            type: activeType.value
        });
        if (res.s) {
            await loadData();
            dialog.value = false;
        } else {
            alert(res.message);
        }
    } catch (e) {
        alert("Gagal koneksi ke server");
    } finally {
        saving.value = false;
    }
};

const removeItem = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus komponen ini?')) {
        try {
            const res = await fetchWrapper.post(`${API_BASE}/Delete.php`, { id });
            if (res.s) await loadData();
        } catch (e) {
            alert("Gagal menghapus");
        }
    }
};

onMounted(loadData);
</script>

<template>
  <v-row>
    <v-col cols="12">
      <BaseBreadcrumb title="Komponen Gaji" :breadcrumbs="[{title: 'Payroll', disabled: false}, {title: 'Komponen', disabled: true}]"></BaseBreadcrumb>
      
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
        <div class="bg-gradient-smooth px-4 py-3">
          <div class="d-flex align-center gap-2">
            <div>
              <h2 class="text-h6 font-weight-bold text-white mb-0">Salary Component Management</h2>
              <div class="text-caption text-white opacity-90">
                Define and organize standard earnings and deductions for payroll processing.
              </div>
            </div>
          </div>
        </div>
      </v-card>

      <v-row v-if="loading">
        <v-col cols="12" class="text-center py-15">
          <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
          <div class="text-caption mt-2 text-medium-emphasis">Loading components...</div>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="12" md="6">
          <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card h-100">
            <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <CirclePlusIcon size="18" class="text-white mr-2" />
                <h3 class="text-subtitle-1 font-weight-bold text-white">Komponen Pendapatan</h3>
              </div>
              <v-btn 
                color="success" 
                variant="flat" 
                size="small" 
                class="text-none font-weight-bold text-caption"
                @click="openModal('income')"
              >
                <PlusIcon size="16" class="mr-1"/> Add Income
              </v-btn>
            </div>
            
            <v-divider></v-divider>
            
            <v-list class="pa-2 bg-grey-lighten-5 list-container">
              <v-list-item 
                v-for="item in incomes" 
                :key="item.id" 
                class="mb-2 rounded-lg border bg-white list-item-hover"
              >
                <template v-slot:prepend>
                  <ArrowUpCircleIcon size="20" class="text-success" />
                </template>
                <v-list-item-title class="text-caption font-weight-bold ml-2">
                  {{ item.name }}
                </v-list-item-title>
                <template v-slot:append>
                  <v-btn 
                    icon variant="text" 
                    color="error" 
                    size="x-small" 
                    @click="removeItem(item.id)"
                  >
                    <TrashIcon size="16"/>
                  </v-btn>
                </template>
              </v-list-item>
              <div v-if="incomes.length === 0" class="text-center text-medium-emphasis text-caption py-8">
                Belum ada data pendapatan
              </div>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card h-100">
            <div class="bg-gradient-danger px-4 py-3 d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <SettingsIcon size="18" class="text-white mr-2" />
                <h3 class="text-subtitle-1 font-weight-bold text-white">Komponen Potongan</h3>
              </div>
              <v-btn 
                color="white" 
                variant="flat" 
                size="small" 
                class="text-none font-weight-bold text-caption text-error"
                @click="openModal('deduction')"
              >
                <PlusIcon size="16" class="mr-1"/> Add Deduction
              </v-btn>
            </div>
            
            <v-divider></v-divider>
            
            <v-list class="pa-2 bg-grey-lighten-5 list-container">
              <v-list-item 
                v-for="item in deductions" 
                :key="item.id" 
                class="mb-2 rounded-lg border bg-white list-item-hover"
              >
                <template v-slot:prepend>
                  <ArrowDownCircleIcon size="20" class="text-error" />
                </template>
                <v-list-item-title class="text-caption font-weight-bold ml-2">
                  {{ item.name }}
                </v-list-item-title>
                <template v-slot:append>
                  <v-btn 
                    icon variant="text" 
                    color="error" 
                    size="x-small" 
                    @click="removeItem(item.id)"
                  >
                    <TrashIcon size="16"/>
                  </v-btn>
                </template>
              </v-list-item>
              <div v-if="deductions.length === 0" class="text-center text-medium-emphasis text-caption py-8">
                Belum ada data potongan
              </div>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <v-dialog v-model="dialog" max-width="400" transition="dialog-bottom-transition" @keyup.enter="saveItem">
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div :class="activeType === 'income' ? 'bg-gradient-smooth' : 'bg-gradient-danger'" class="px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <div class="bg-white rounded-circle pa-1 d-flex">
            <SettingsIcon size="16" :class="activeType === 'income' ? 'text-primary' : 'text-error'" />
          </div>
          <span class="text-subtitle-1 font-weight-bold text-white">
            Add {{ activeType === 'income' ? 'Income' : 'Deduction' }}
          </span>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="dialog = false">
          <XIcon size="18" />
        </v-btn>
      </div>

      <v-card-text class="pa-5 bg-grey-lighten-5">
        <v-label class="mb-1 text-caption font-weight-bold text-grey-darken-2 d-block">Nama Komponen</v-label>
        <v-text-field 
          v-model="newItemName" 
          placeholder="Contoh: Tunjangan Makan" 
          variant="outlined" 
          density="compact" 
          color="primary" 
          hide-details 
          class="small-input"
        ></v-text-field>
      </v-card-text>

      <v-divider></v-divider>
      
      <v-card-actions class="bg-white pa-4">
        <v-spacer></v-spacer>
        <v-btn 
          variant="outlined" 
          color="secondary" 
          size="small" 
          class="px-4 text-caption text-none" 
          @click="dialog = false"
        >Cancel</v-btn>
        <v-btn 
          :color="activeType === 'income' ? 'primary' : 'error'" 
          variant="flat" 
          size="small" 
          class="px-6 ml-1 text-caption text-none font-weight-bold" 
          :loading="saving" 
          @click="saveItem"
        >
          <DeviceFloppyIcon size="16" class="mr-1"/> Save Component
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Gradient Theme */
.bg-gradient-smooth {
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}

.bg-gradient-danger {
  background: linear-gradient(135deg, #D32F2F 0%, #EF5350 60%, #FFCDD2 100%);
}

/* List Styling */
.list-container {
  min-height: 200px;
}

.list-item-hover {
  transition: all 0.2s ease;
}

.list-item-hover:hover {
  transform: translateX(5px);
  border-color: #1565C0 !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Input Compaction */
.small-input :deep(.v-field) {
  --v-field-padding-bottom: 4px;
  --v-field-padding-top: 4px;
  min-height: 40px !important;
}

.gap-2 {
  gap: 8px;
}

.compact-header-card {
  margin-bottom: 1.5rem !important;
}

.text-xsmall {
  font-size: 0.65rem !important;
}
</style>