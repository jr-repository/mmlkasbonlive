<template>
  <v-row>
    <v-col cols="12">      
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
        <div class="bg-gradient-smooth px-4 py-3">
          <div class="d-flex align-center gap-2">
            <div>
              <h2 class="text-h6 font-weight-bold text-white mb-0">Payroll Report Center</h2>
              <div class="text-caption text-white opacity-90">Pantau riwayat pembayaran gaji dan cetak slip gaji karyawan secara kolektif.</div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card elevation="4" rounded="lg" class="border overflow-hidden pa-6">
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="primary" size="28">mdi-folder-history</v-icon>
            <h3 class="text-subtitle-1 font-weight-bold text-primary">Riwayat Payroll Terfinalisasi</h3>
          </div>
          <v-btn variant="tonal" color="primary" size="small" @click="loadHistory" :loading="historyLoading" prepend-icon="mdi-refresh">
            Refresh Data
          </v-btn>
        </div>

        <v-table density="compact" class="modern-table border rounded-lg overflow-hidden hover">
          <thead>
            <tr class="bg-gradient-smooth">
              <th width="40"></th>
              <th width="50" class="text-caption text-white font-weight-bold text-center">No.</th>
              <th class="text-caption text-white font-weight-bold">Periode</th>
              <th class="text-caption text-white font-weight-bold">Tanggal Final</th>
              <th class="text-caption text-white font-weight-bold text-right">Total Gross</th>
              <th class="text-caption text-white font-weight-bold text-right">Total Potongan</th>
              <th class="text-caption text-white font-weight-bold text-right">Net Salary</th>
              <th class="text-caption text-white font-weight-bold text-center">Rekap Excel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="historyLoading">
              <td colspan="8" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="30"></v-progress-circular>
              </td>
            </tr>
            <tr v-else-if="history.length === 0">
              <td colspan="8" class="text-center py-10 text-grey text-caption">Belum ada riwayat payroll yang diposting.</td>
            </tr>
            
            <template v-for="(h, index) in history" :key="'hist-'+h.id">
              <tr class="log-row" style="cursor: pointer;">
                <td @click="toggleRow(h.id)">
                  <v-icon :color="expandedRows.includes(h.id) ? 'primary' : 'grey'">
                    {{ expandedRows.includes(h.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                  </v-icon>
                </td>
                <td class="text-center text-caption font-weight-medium" @click="toggleRow(h.id)">{{ index + 1 }}</td>
                <td class="font-weight-bold text-caption text-primary" @click="toggleRow(h.id)">{{ h.period_month }}</td>
                <td class="text-caption" @click="toggleRow(h.id)">{{ formatDate(h.cutoff_date) }}</td>
                <td class="text-right text-caption" @click="toggleRow(h.id)">{{ formatPrice(h.total_gross) }}</td>
                <td class="text-right text-caption text-error" @click="toggleRow(h.id)">{{ formatPrice(h.total_deduction) }}</td>
                <td class="text-right text-caption font-weight-bold text-success" @click="toggleRow(h.id)">{{ formatPrice(h.total_net) }}</td>
                <td class="text-center">
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="success"
                    class="excel-btn"
                    :href="`${API_REKAP}?id=${h.id}`"
                    target="_blank"
                    @click.stop
                  >
                    <FileSpreadsheetIcon :size="18" stroke-width="1.7" class="mr-1"/>
                    Excel
                  </v-btn>
                </td>
              </tr>

              <tr v-if="expandedRows.includes(h.id)">
                <td colspan="8" class="pa-4 bg-grey-lighten-4">
                  <v-card variant="outlined" class="rounded-lg bg-white overflow-hidden pa-4 border-dashed">
                    
                    <div class="d-flex flex-column flex-md-row justify-space-between align-md-center gap-4 mb-4">
                      <div>
                        <h4 class="text-subtitle-2 font-weight-bold text-blue-darken-3 mb-0">Rincian Slip Gaji Karyawan</h4>
                        <p class="text-xsmall text-grey-darken-1 mb-0">Daftar rincian perhitungan real untuk periode {{ h.period_month }}.</p>
                      </div>
                      <v-text-field 
                        v-model="searchInputs[h.id]" 
                        placeholder="Cari Nama / NIK..." 
                        prepend-inner-icon="mdi-magnify"
                        density="compact" 
                        hide-details 
                        variant="outlined" 
                        bg-color="white" 
                        rounded="lg" 
                        style="max-width: 250px;" 
                        class="small-input"
                      ></v-text-field>
                    </div>

                    <v-table density="compact" class="inner-table border">
                      <thead>
                        <tr class="bg-blue-grey-lighten-5">
                          <th class="text-xsmall font-weight-bold">INFO KARYAWAN</th>
                          <th class="text-xsmall font-weight-bold text-right">TOTAL PENDAPATAN</th>
                          <th class="text-xsmall font-weight-bold text-right">LEMBUR</th>
                          <th class="text-xsmall font-weight-bold text-right">TOTAL POTONGAN</th>
                          <th class="text-xsmall font-weight-bold text-right">NET SALARY</th>
                          <th class="text-xsmall font-weight-bold text-center" width="120">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="detailsLoading[h.id]"><td colspan="6" class="text-center py-6"><v-progress-circular indeterminate color="primary" size="24"></v-progress-circular></td></tr>
                        <tr v-else-if="getFilteredDetails(h.id).length === 0"><td colspan="6" class="text-center py-6 text-caption text-grey">Data karyawan tidak ditemukan.</td></tr>
                        
                        <tr v-for="d in getFilteredDetails(h.id)" :key="'det-'+d.id" class="hover-row-inner">
                          <td>
                            <div class="py-1">
                              <div class="font-weight-bold text-caption">{{ d.name }}</div>
                              <div class="text-xsmall text-primary font-weight-medium">NIK: {{ d.nik }} • {{ d.dept }}</div>
                            </div>
                          </td>
                          <td class="text-right text-caption">{{ formatPrice(d.total_income) }}</td>
                          <td class="text-right text-caption text-success font-weight-bold">+{{ formatPrice(d.overtime_pay) }}</td>
                          <td class="text-right text-caption text-error font-weight-bold">-{{ formatPrice(Number(d.late_penalty) + Number(d.abs_penalty) + Number(d.bpjs) + Number(d.total_deduction)) }}</td>
                          <td class="text-right font-weight-bold text-subtitle-2 text-primary">{{ formatPrice(d.net_salary) }}</td>
                          <td class="text-center">
                           <div class="action-icons">

                              <!-- Detail Perhitungan -->
                              <v-btn
                                icon
                                variant="text"
                                size="x-small"
                                density="compact"
                                class="action-btn view"
                                @click="openRealBreakdown(d)"
                                title="Detail Perhitungan Real"
                              >
                                <EyeIcon :size="18" stroke-width="1.7"/>
                              </v-btn>

                              <!-- Cetak Slip PDF -->
                              <v-btn
                                icon
                                variant="text"
                                size="x-small"
                                density="compact"
                                class="action-btn pdf"
                                :href="`${API_SLIP}?detail_id=${d.id}`"
                                target="_blank"
                                title="Cetak Slip PDF"
                              >
                                <FileTextIcon :size="18" stroke-width="1.7"/>
                              </v-btn>

                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card>
                </td>
              </tr>
            </template>

          </tbody>
        </v-table>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="breakdownDialog" max-width="500" transition="dialog-bottom-transition" scrollable>
    <v-card v-if="selectedBreakdown" class="rounded-lg overflow-hidden" max-height="85vh">
      
      <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon color="white" class="mr-2">mdi-calculator</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold text-white mb-0">Detail Real Gaji: {{ selectedBreakdown.name }}</h3>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="breakdownDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      
      <v-card-text class="pa-5 bg-grey-lighten-5" style="overflow-y: auto;">
        
        <div class="bg-blue-lighten-5 pa-3 rounded-lg border-dashed mb-4 text-center">
          <span class="text-caption text-blue-darken-3 font-weight-medium">
            <v-icon size="small" class="mr-1">mdi-information</v-icon>
            Ini adalah rekaman data final yang telah di-POSTING ke riwayat Laporan.
          </span>
        </div>

        <div class="bg-white pa-4 rounded-lg border mb-4 shadow-sm">
          <div class="text-caption font-weight-bold text-success mb-2 text-uppercase d-flex align-center">
            <v-icon size="small" class="mr-2 text-success">mdi-cash-plus</v-icon> Pendapatan Historis
          </div>
          <v-divider class="border-dashed mb-3"></v-divider>

          <div v-for="d in selectedBreakdown.breakdown.filter(x => x.type === 'income')" :key="d.name" class="d-flex justify-space-between mb-2 text-caption">
            <span class="text-grey-darken-2">{{ d.name }}</span><b class="text-success">{{ formatPrice(d.amount) }}</b>
          </div>
          <div class="d-flex justify-space-between text-caption mb-1">
            <span class="text-grey-darken-2">Lembur <span class="opacity-70">({{ selectedBreakdown.overtime_hours }} x {{ formatPrice(selectedBreakdown.overtime_rate) }})</span></span>
            <b class="text-success">+ {{ formatPrice(selectedBreakdown.overtime_pay) }}</b>
          </div>
        </div>
        
        <div class="bg-white pa-4 rounded-lg border mb-4 shadow-sm">
          <div class="text-caption font-weight-bold text-error mb-2 text-uppercase d-flex align-center">
            <v-icon size="small" class="mr-2 text-error">mdi-cash-minus</v-icon> Potongan Historis
          </div>
          <v-divider class="border-dashed mb-3"></v-divider>

          <div v-for="d in selectedBreakdown.breakdown.filter(x => x.type === 'deduction')" :key="d.name" class="d-flex justify-space-between mb-2 text-caption">
            <span class="text-grey-darken-2">{{ d.name }}</span><b class="text-error">- {{ formatPrice(d.amount) }}</b>
          </div>
          <div class="d-flex justify-space-between text-caption mb-2">
            <span class="text-grey-darken-2">Pot. Telat <span class="opacity-70">({{ selectedBreakdown.late_min }} x {{ formatPrice(selectedBreakdown.late_rate) }})</span></span>
            <b class="text-error">- {{ formatPrice(selectedBreakdown.late_penalty) }}</b>
          </div>
          <div class="d-flex justify-space-between text-caption mb-2">
            <span class="text-grey-darken-2">Pot. Absen <span class="opacity-70">({{ selectedBreakdown.absence_days }} x {{ formatPrice(selectedBreakdown.absent_rate) }})</span></span>
            <b class="text-error">- {{ formatPrice(selectedBreakdown.abs_penalty) }}</b>
          </div>
          <div class="d-flex justify-space-between text-caption mb-1">
            <span class="text-grey-darken-2">BPJS <span class="opacity-70">(Fixed DB)</span></span>
            <b class="text-error">- {{ formatPrice(selectedBreakdown.bpjs) }}</b>
          </div>
        </div>

        <div class="bg-gradient-smooth pa-4 rounded-lg shadow-sm text-white d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon color="white" class="mr-2">mdi-cash-multiple</v-icon>
            <span class="text-subtitle-1 font-weight-bold text-uppercase">Net Salary</span>
          </div>
          <span class="text-h5 font-weight-bold">{{ formatPrice(selectedBreakdown.net_salary) }}</span>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';

import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  RefreshIcon, 
  ArrowDownCircleIcon, 
  DeviceFloppyIcon,
  XIcon,
  CalendarEventIcon,
  BuildingBankIcon,
  SearchIcon,
  FileTextIcon
} from 'vue-tabler-icons';

import { FileSpreadsheetIcon } from 'vue-tabler-icons';

const API_BASE = 'https://multimitralogistik.id/Backend/Api/Payroll/Report';
const API_REKAP = `${API_BASE}/ExportExcel.php`;
const API_SLIP = `${API_BASE}/ExportSlip.php`;

const history = ref([]);
const historyLoading = ref(false);

// State Accordion & Detail
const expandedRows = ref([]);
const detailsData = ref({});
const detailsLoading = ref({});
const searchInputs = ref({});

// State Modal Detail Real
const breakdownDialog = ref(false);
const selectedBreakdown = ref(null);

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    const response = await fetch(`${API_BASE}/GetHistory.php`).then(res => res.json());
    if (response.s) history.value = response.d;
  } catch (error) { 
    console.error(error); 
  } finally { 
    historyLoading.value = false; 
  }
};

const toggleRow = async (id) => {
  const index = expandedRows.value.indexOf(id);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
  } else {
    expandedRows.value.push(id);
    if (!detailsData.value[id]) {
      detailsLoading.value[id] = true;
      try {
        const response = await fetch(`${API_BASE}/GetDetails.php?id=${id}`).then(res => res.json());
        if (response.s) {
          detailsData.value[id] = response.d;
          searchInputs.value[id] = ''; 
        }
      } catch (error) { 
        console.error(error); 
      } finally { 
        detailsLoading.value[id] = false; 
      }
    }
  }
};

const getFilteredDetails = (id) => {
  const data = detailsData.value[id] || [];
  const term = (searchInputs.value[id] || '').toLowerCase();
  if (!term) return data;
  return data.filter(d => d.name.toLowerCase().includes(term) || d.nik.toLowerCase().includes(term));
};

const openRealBreakdown = (detail) => {
  selectedBreakdown.value = detail;
  breakdownDialog.value = true;
};

const formatPrice = (value) => 'Rp ' + Number(value || 0).toLocaleString('id-ID');
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
};

onMounted(loadHistory);
</script>

<style scoped>
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.border-dashed { border: 1px dashed #90CAF9 !important; }
.modern-table :deep(th) { height: 42px !important; font-size: 0.75rem !important; }
.modern-table :deep(td) { height: 48px !important; font-size: 0.75rem !important; }
.log-row:hover { background-color: #f1f5f9 !important; }
.hover-row-inner:hover { background-color: #e3f2fd !important; }
.text-xsmall { font-size: 0.65rem !important; }
.gap-1 { gap: 4px; }
.gap-4 { gap: 16px; }
.border-bottom { border-bottom: 1px solid #eee; }
.small-input :deep(.v-field) { --v-field-padding-bottom: 4px; --v-field-padding-top: 4px; min-height: 36px !important; }
.shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important; }
.opacity-70 { opacity: 0.7; }
.action-icons{
  display:flex;
  justify-content:center;
  align-items:center;
  gap:2px;
}

.action-btn{
  width:26px !important;
  height:26px !important;
  min-width:26px !important;
  border-radius:6px !important;
  padding:0 !important;
  transition:all .15s ease;
}

/* detail */
.action-btn.view:hover{
  background:#E3F2FD !important;
  color:#1976D2 !important;
}

/* pdf */
.action-btn.pdf:hover{
  background:#FDECEC !important;
  color:#D32F2F !important;
}

.action-btn :deep(svg){
  display:block;
  margin:auto;
}

.excel-btn{
  height:28px !important;
  border-radius:8px !important;
  padding:0 10px !important;
  font-size:0.7rem !important;
  font-weight:600 !important;
  letter-spacing:.2px;
}

.excel-btn :deep(svg){
  vertical-align:middle;
}
</style>