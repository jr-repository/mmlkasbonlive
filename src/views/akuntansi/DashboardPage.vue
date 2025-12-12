<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { 
  WalletIcon, 
  ChartDotsIcon, 
  CreditCardIcon, 
  CoinIcon,
  ArrowDownRightIcon,
  DotsVerticalIcon,
  FilterIcon,
  PrinterIcon,
  DownloadIcon,
  CalendarEventIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";

// --- STATE FILTER ---
const fromDate = ref(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
const toDate = ref(format(new Date(), 'yyyy-MM-dd'));

// --- LOGIC & STATE DATA ---
const data = ref<any>(null); 
const loading = ref(true);
let filterTimeout: ReturnType<typeof setTimeout> | null = null;

// Helper Format Rupiah
const fmt = (v: number) => v ? `Rp ${Number(v).toLocaleString('id-ID')}` : 'Rp 0';

const fetchData = async () => {
  loading.value = true;
  try {
    // Format tanggal ke dd/mm/yyyy untuk Accurate API
    const fmtFrom = format(new Date(fromDate.value), 'dd/MM/yyyy');
    const fmtTo = format(new Date(toDate.value), 'dd/MM/yyyy');
    
    const params = new URLSearchParams({
        fromDate: fmtFrom,
        toDate: fmtTo
    });

    const res = await fetch(`${API_BASE_URL}/Dashboard/DashboardData.php?${params.toString()}`);
    const json = await res.json();
    if(json.s) data.value = json.d;
  } catch (e) {
    console.error(e);
  } finally { 
    loading.value = false; 
  }
};

const fetchDataDebounced = () => {
    if (filterTimeout) clearTimeout(filterTimeout);
    filterTimeout = setTimeout(fetchData, 500);
}

// Watch Filter
watch([fromDate, toDate], fetchDataDebounced);

onMounted(fetchData);

onBeforeUnmount(() => {
    if (filterTimeout) clearTimeout(filterTimeout);
});

// --- EXPORT ACTIONS ---
const exportPdf = () => {
    const fmtTo = format(new Date(toDate.value), 'dd/MM/yyyy');
    window.open(`${API_BASE_URL}/Dashboard/ExportPdf.php?toDate=${fmtTo}`, '_blank');
};

const exportExcel = () => {
    const fmtTo = format(new Date(toDate.value), 'dd/MM/yyyy');
    window.open(`${API_BASE_URL}/Dashboard/ExportExcel.php?toDate=${fmtTo}`, '_blank');
};

// --- CHART CONFIGURATION ---
const chartBankOptions = computed(() => ({
  labels: data.value?.chart_bank?.map((x: any) => x.name) || [],
  chart: { type: 'donut', fontFamily: 'inherit', height: 280 },
  colors: ['#1e88e5', '#42a5f5', '#90caf9', '#e3f2fd', '#bbdefb'], // Biru Profesional
  plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total Kas', formatter: () => fmt(data.value?.summary?.total_cash || 0) } } } } },
  legend: { position: 'bottom', fontSize: '11px' },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (val: number) => fmt(val) } }
}));

const chartBankSeries = computed(() => data.value?.chart_bank?.map((x: any) => x.value) || []);

const chartPLOptions = computed(() => ({
  labels: ['Revenue', 'Expense'],
  chart: { type: 'pie', fontFamily: 'inherit', height: 280 },
  colors: ['#43A047', '#E53935'], // Hijau (Untung), Merah (Rugi/Biaya)
  legend: { position: 'bottom' },
  dataLabels: { enabled: true, dropShadow: { enabled: false } },
  tooltip: { y: { formatter: (val: number) => fmt(val) } }
}));

const chartPLSeries = computed(() => [
  data.value?.summary?.revenue || 0,
  data.value?.summary?.expense || 0
]);
</script>

<template>
  <v-row>
    <v-col cols="12">
        <v-card elevation="2" rounded="lg" class="compact-header-card overflow-hidden">
            <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
                <div class="d-flex align-center gap-2">
                    <div class="bg-white rounded-circle pa-2">
                        <ChartDotsIcon size="24" class="text-primary"/>
                    </div>
                    <div>
                        <h2 class="text-h6 font-weight-bold text-white mb-0">Financial Dashboard</h2>
                        <div class="text-caption text-white opacity-90">Real-time financial overview</div>
                    </div>
                </div>

                <div class="d-flex align-center gap-2">
                    <div class="d-flex align-center gap-2 bg-white pa-1 rounded shadow-sm px-2 border-filter-date" style="height: 38px;">
                        <CalendarEventIcon size="18" class="text-grey" />
                        <input type="date" v-model="fromDate" class="date-input text-caption font-weight-bold" />
                        <span class="text-caption text-grey mx-1">-</span>
                        <input type="date" v-model="toDate" class="date-input text-caption font-weight-bold" />
                    </div>
                    <v-btn icon variant="flat" color="white" size="small" @click="fetchData" :loading="loading" title="Refresh Data">
                        <FilterIcon size="20" class="text-primary"/>
                    </v-btn>
                    
                    <v-divider vertical class="mx-1 border-white opacity-50" style="height: 20px;"></v-divider>

                    <v-menu location="bottom end">
                        <template v-slot:activator="{ props }">
                            <v-btn color="white" variant="outlined" size="small" class="text-none" v-bind="props">
                                <DownloadIcon size="18" class="mr-1"/> Export Neraca
                            </v-btn>
                        </template>
                        <v-list density="compact" elevation="2" class="rounded-lg">
                            <v-list-item @click="exportPdf" value="pdf">
                                <template v-slot:prepend><PrinterIcon size="16" class="text-error mr-2"/></template>
                                <v-list-item-title class="text-caption">Download PDF</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="exportExcel" value="excel">
                                <template v-slot:prepend><div class="text-success mr-2 font-weight-bold" style="font-size:14px;">X</div></template>
                                <v-list-item-title class="text-caption">Download Excel</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>
            </div>
        </v-card>
    </v-col>

    <v-col cols="12" v-if="loading && !data" class="text-center py-5">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <div class="mt-2 text-caption text-grey">Loading financial data...</div>
    </v-col>

    <template v-else-if="data">
      <v-col cols="12" md="3">
        <v-card elevation="2" rounded="lg" class="pa-4 h-100 border-left-primary small-card">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Total Kas & Bank</div>
              <h3 class="text-h6 font-weight-bold text-primary mb-0">{{ fmt(data.summary.total_cash) }}</h3>
              <div class="text-caption text-grey mt-1">Saldo tersedia (Current)</div>
            </div>
            <v-avatar color="blue-lighten-5" rounded="lg" class="mt-1">
              <WalletIcon size="22" class="text-primary"/>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="2" rounded="lg" class="pa-4 h-100 border-left-warning small-card">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Total Piutang (AR)</div>
              <h3 class="text-h6 font-weight-bold text-orange mb-0">{{ fmt(data.summary.total_ar) }}</h3>
              <div class="text-caption text-grey mt-1">Tagihan belum dibayar</div>
            </div>
            <v-avatar color="orange-lighten-5" rounded="lg" class="mt-1">
              <CreditCardIcon size="22" class="text-orange"/>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="2" rounded="lg" class="pa-4 h-100 border-left-success small-card">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Total Pendapatan</div>
              <h3 class="text-h6 font-weight-bold text-success mb-0">{{ fmt(data.summary.revenue) }}</h3>
              <div class="text-caption text-grey mt-1">Periode ini</div>
            </div>
            <v-avatar color="green-lighten-5" rounded="lg" class="mt-1">
              <CoinIcon size="22" class="text-success"/>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="2" rounded="lg" class="pa-4 h-100 border-left-info small-card">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Net Profit</div>
              <h3 class="text-h6 font-weight-bold text-info mb-0">{{ fmt(data.summary.net_profit) }}</h3>
              <div class="text-caption text-grey mt-1">Laba Bersih</div>
            </div>
            <v-avatar color="cyan-lighten-5" rounded="lg" class="mt-1">
              <ArrowDownRightIcon size="22" class="text-info"/>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg" class="compact-card">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Komposisi Kas & Bank</span>
            <v-btn icon variant="text" size="x-small"><DotsVerticalIcon size="16" class="text-grey"/></v-btn>
          </v-card-title>
          <v-card-text>
            <apexchart type="donut" height="280" :options="chartBankOptions" :series="chartBankSeries"></apexchart>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg" class="compact-card">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Profit vs Expense</span>
            <v-btn icon variant="text" size="x-small"><DotsVerticalIcon size="16" class="text-grey"/></v-btn>
          </v-card-title>
          <v-card-text>
            <apexchart type="pie" height="280" :options="chartPLOptions" :series="chartPLSeries"></apexchart>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg" class="compact-card overflow-hidden">
          <div class="d-flex align-center justify-space-between px-4 py-3 bg-grey-lighten-5 border-bottom">
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-2">Recent Invoices (Penjualan)</span>
          </div>
          <v-table density="compact" class="compact-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Customer</th>
                <th>Tanggal</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in data.recent_invoices" :key="i">
                <td class="text-caption font-weight-bold text-primary">{{ item.number }}</td>
                <td class="text-caption text-truncate" style="max-width: 150px;">{{ item.customer }}</td>
                <td class="text-caption text-grey">{{ item.date }}</td>
                <td class="text-right text-caption font-weight-medium">{{ fmt(item.amount) }}</td>
              </tr>
              <tr v-if="data.recent_invoices.length === 0"><td colspan="4" class="text-center text-caption text-grey py-3">Tidak ada data</td></tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg" class="compact-card overflow-hidden">
          <div class="d-flex align-center justify-space-between px-4 py-3 bg-grey-lighten-5 border-bottom">
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-2">Recent Expenses (Pengeluaran)</span>
          </div>
          <v-table density="compact" class="compact-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Keterangan</th>
                <th>Tanggal</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in data.recent_expenses" :key="i">
                <td class="text-caption font-weight-bold text-primary">{{ item.number }}</td>
                <td class="text-caption text-truncate" style="max-width: 150px;">{{ item.desc }}</td>
                <td class="text-caption text-grey">{{ item.date }}</td>
                <td class="text-right text-caption font-weight-medium">{{ fmt(item.amount) }}</td>
              </tr>
              <tr v-if="data.recent_expenses.length === 0"><td colspan="4" class="text-center text-caption text-grey py-3">Tidak ada data</td></tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </template>
  </v-row>
</template>

<style scoped>
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.date-input { border: none; outline: none; font-size: 0.8rem; width: 100px; background: transparent; color: #333; }
.border-filter-date { border: 1px solid #e0e0e0; }

.border-left-primary { border-left: 4px solid #1976D2 !important; }
.border-left-warning { border-left: 4px solid #FB8C00 !important; }
.border-left-success { border-left: 4px solid #43A047 !important; }
.border-left-info { border-left: 4px solid #00ACC1 !important; }

.compact-card :deep(.v-card-title) { font-size: 0.95rem !important; padding: 12px 16px !important; }
.compact-table :deep(th) { font-size: 0.75rem !important; height: 32px !important; background-color: #f5f5f5; }
.compact-table :deep(td) { padding: 6px 12px !important; height: 36px !important; }
</style>