<script setup lang="ts">
// FIX: Tambahkan onMounted, watch, dan onBeforeUnmount
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { format, subDays } from 'date-fns'; // FIX: Tambahkan subDays untuk default range
import { 
  FilterIcon, 
  PrinterIcon, 
  ReportAnalyticsIcon, 
  ChartPieIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  CoinIcon,
  CalendarStatsIcon
} from 'vue-tabler-icons';

// Catatan: Asumsi komponen 'apexchart' sudah terdaftar secara global atau diimpor di tempat lain jika digunakan.

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";

// FIX: Tambahkan timer untuk debounce
let reportTimeout: ReturnType<typeof setTimeout> | null = null; 

// --- STATE ---
// FIX: Atur default tanggal menjadi range (misal 7 hari terakhir) agar ada data saat mounted
const fromDate = ref(format(subDays(new Date(), 7), 'yyyy-MM-dd')); 
const toDate = ref(format(new Date(), 'yyyy-MM-dd'));
const loading = ref(false);
const reportData = ref<any[]>([]);
const activeTab = ref('SUMMARY');

// --- COMPUTED ---
const getAccountsByType = (types: string[]) => reportData.value.filter(d => types.includes(d.accountType));
const sumAmount = (data: any[]) => data.reduce((acc, curr) => acc + Number(curr.amount), 0);

const revenueList = computed(() => getAccountsByType(['REVENUE', 'OTHER_INCOME']));
const cogsList = computed(() => getAccountsByType(['COGS']));
const expenseList = computed(() => getAccountsByType(['EXPENSE', 'OTHER_EXPENSE']));

const totalRevenue = computed(() => sumAmount(revenueList.value));
const totalCOGS = computed(() => sumAmount(cogsList.value));
const totalExpense = computed(() => sumAmount(expenseList.value));
const netProfit = computed(() => totalRevenue.value - totalCOGS.value - totalExpense.value);

// --- CHARTS CONFIG (ApexCharts) ---
const chartOptionsPie = computed(() => ({
  chart: { type: 'pie', fontFamily: 'inherit', background: 'transparent' },
  labels: ['Revenue', 'COGS', 'Expenses'],
  colors: ['#00e676', '#ff9800', '#f44336'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  stroke: { show: false }
}));
const seriesPie = computed(() => [
  totalRevenue.value || 0, 
  totalCOGS.value || 0, 
  totalExpense.value || 0
]);

const chartOptionsBar = computed(() => ({
  chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
  xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }, // Dummy categories
  colors: ['#1e88e5'],
  dataLabels: { enabled: false },
  grid: { borderColor: 'rgba(0,0,0,0.1)' }
}));
const seriesBar = ref([{ name: 'Revenue', data: [12000000, 14000000, 11000000, 16000000, 18000000, 15000000] }]); // Dummy data simulation

// --- METHODS ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const strFrom = format(new Date(fromDate.value), "dd/MM/yyyy");
    const strTo = format(new Date(toDate.value), "dd/MM/yyyy");
    const res = await fetch(`${API_BASE_URL}/Laporan/Index.php?fromDate=${strFrom}&toDate=${strTo}`);
    const json = await res.json();
    if (json.s) reportData.value = json.d;
    else reportData.value = [];
  } catch { reportData.value = []; } 
  finally { loading.value = false; }
};

// FIX: Buat fungsi debounced untuk memanggil fetchReport
const fetchReportDebounced = () => {
  if (reportTimeout) clearTimeout(reportTimeout);
  reportTimeout = setTimeout(fetchReport, 800); // FIX: Debounce 800ms
};

const printReport = () => window.print();

// --- LIFECYCLE & WATCH ---
// FIX: Lakukan fetch awal saat komponen mounted
onMounted(fetchReport);

// FIX: Watch perubahan tanggal dan panggil fungsi debounced
watch([fromDate, toDate], fetchReportDebounced);

// FIX: Bersihkan timer saat komponen dilepas
onBeforeUnmount(() => {
  if (reportTimeout) clearTimeout(reportTimeout);
});
</script>

<template>
    <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card d-print-none">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">
            Financial Report Generator
          </h2>
          <div class="text-caption text-white opacity-90">
            Generate and analyze Profit & Loss Statement.
          </div>
        </div>
      </div>
    </div>
  </v-card>

  <v-row class="mt-0">
      <v-col cols="12" class="py-1 d-print-none">
    <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-form-card">
      <div class="bg-gradient-smooth px-4 py-3 d-flex align-center">
        <FilterIcon size="18" class="text-white mr-1" />
        <span class="text-subtitle-1 font-weight-bold text-white">Report Parameters</span>
      </div>

      <v-card-text class="pa-3">
        <div class="d-flex flex-wrap gap-3 align-end">

          <div style="min-width: 180px;">
            <label class="text-caption font-weight-bold text-grey-darken-1 mb-1 d-block">From Date</label>
            <v-text-field
              v-model="fromDate"
              type="date"
              variant="outlined"
              hide-details
              density="compact"
              class="small-input"
            />
          </div>

          <div style="min-width: 180px;">
            <label class="text-caption font-weight-bold text-grey-darken-1 mb-1 d-block">To Date</label>
            <v-text-field
              v-model="toDate"
              type="date"
              variant="outlined"
              hide-details
              density="compact"
              class="small-input"
            />
          </div>

          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              height="36"
              size="small"
              @click="fetchReport"
              :loading="loading"
              class="px-4 text-none text-caption font-weight-bold"
            >
              <ReportAnalyticsIcon size="16" class="mr-1" /> Generate Report
            </v-btn>

            <v-btn
              variant="outlined"
              color="secondary"
              height="36"
              size="small"
              @click="printReport"
              class="px-4 text-none text-caption"
            >
              <PrinterIcon size="16" class="mr-1" /> Print
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
   </v-col>


        <v-col cols="12" md="4" class="py-1">
      <v-card elevation="4" rounded="lg" class="pa-4 border compact-kpi-card" :class="activeTab === 'REVENUE' ? 'ring-active' : ''">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-1">Total Revenue</div>
          <v-avatar color="green-lighten-5" rounded="lg" size="36">
            <TrendingUpIcon size="20" class="text-green" />
          </v-avatar>
        </div>
        <div class="text-h5 font-weight-bold text-green-darken-2">Rp {{ totalRevenue.toLocaleString('id-ID') }}</div>
        <div class="text-caption text-grey mt-1">Total income from sales & services</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4" class="py-1">
      <v-card elevation="4" rounded="lg" class="pa-4 border compact-kpi-card" :class="activeTab === 'EXPENSE' ? 'ring-active' : ''">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-1">Total Costs & Exp</div>
          <v-avatar color="red-lighten-5" rounded="lg" size="36">
            <TrendingDownIcon size="20" class="text-red" />
          </v-avatar>
        </div>
        <div class="text-h5 font-weight-bold text-red-darken-2">Rp {{ (totalCOGS + totalExpense).toLocaleString('id-ID') }}</div>
        <div class="text-caption text-grey mt-1">Includes COGS and Operational Expenses</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4" class="py-1">
       <v-card elevation="4" rounded="lg" class="pa-4 compact-kpi-card" :color="netProfit >= 0 ? 'green-lighten-5' : 'red-lighten-5'" style="border: 1px solid rgba(0,0,0,0.05) !important;">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">Net Profit / Loss</div>
          <v-avatar color="white" rounded="lg" size="36" elevation="1">
            <CoinIcon size="20" :class="netProfit >= 0 ? 'text-green' : 'text-red'" />
          </v-avatar>
        </div>
        <div class="text-h5 font-weight-bold" :class="netProfit >= 0 ? 'text-green-darken-3' : 'text-red-darken-3'">
          Rp {{ netProfit.toLocaleString('id-ID') }}
        </div>
        <div class="text-caption text-grey-darken-2 mt-1 font-weight-medium">Final calculated result</div>
      </v-card>
    </v-col>

        <v-col cols="12" md="6" class="py-1 d-print-none">
      <v-card elevation="4" rounded="lg" class="border">
        <v-card-item>
          <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
            <ChartPieIcon size="18" class="mr-2 text-primary"/> Cost Distribution 
          </v-card-title>
        </v-card-item>
        <v-card-text>
          <apexchart type="pie" height="280" :options="chartOptionsPie" :series="seriesPie"></apexchart>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="6" class="py-1 d-print-none">
      <v-card elevation="4" rounded="lg" class="border">
        <v-card-item>
          <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
            <CalendarStatsIcon size="18" class="mr-2 text-primary"/> Monthly Trend (Simulation) 
          </v-card-title>
        </v-card-item>
        <v-card-text>
          <apexchart type="bar" height="280" :options="chartOptionsBar" :series="seriesBar"></apexchart>
        </v-card-text>
      </v-card>
    </v-col>

        <v-col cols="12" class="mt-2">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden compact-data-card">
        <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between flex-wrap gap-2 d-print-none">
          <div class="d-flex align-center">
            <ReportAnalyticsIcon size="18" class="text-white mr-1" />
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-white">Detailed Statement</h3>
              <div class="text-caption text-white opacity-80">Breakdown by accounts</div>
            </div>
          </div>
        </div>

                <div class="d-print-block d-none px-6 pt-6">
          <h2 class="text-h4 text-center font-weight-bold">PROFIT & LOSS STATEMENT</h2>
          <div class="text-center text-body-1 mb-6">Period: {{ format(new Date(fromDate), 'dd MMM yyyy') }} - {{ format(new Date(toDate), 'dd MMM yyyy') }}</div>
        </div>

        <v-tabs v-model="activeTab" color="primary" class="border-bottom d-print-none bg-grey-lighten-5" density="comfortable">
          <v-tab value="SUMMARY" class="font-weight-bold text-caption text-none">Summary P/L</v-tab>
          <v-tab value="REVENUE" class="font-weight-bold text-caption text-none">Revenue</v-tab>
          <v-tab value="COGS" class="font-weight-bold text-caption text-none">HPP (COGS)</v-tab>
          <v-tab value="EXPENSE" class="font-weight-bold text-caption text-none">Expense</v-tab>
        </v-tabs>
        
        <v-card-text class="pa-4 pa-sm-6">
          <v-window v-model="activeTab">
            <v-window-item value="SUMMARY">
              <v-card variant="outlined" class="mx-auto border-lg" max-width="900" style="border: 1px solid #ddd;">
                <v-card-text class="pa-4 pa-sm-6">
                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold text-green mb-2 border-bottom pb-1">REVENUE / PENDAPATAN</div>
                    <div v-if="revenueList.length === 0" class="text-caption font-italic text-grey py-2">No Data</div>
                    <div v-for="(item, i) in revenueList" :key="'rev'+i" class="d-flex justify-space-between text-caption py-1 item-row">
                      <span class="text-grey-darken-2">{{ item.accountName }}</span>
                      <span class="font-mono text-medium-emphasis">{{ Number(item.amount).toLocaleString('id-ID') }}</span>
                    </div>
                    <div class="d-flex justify-space-between font-weight-bold text-subtitle-2 bg-green-lighten-5 pa-2 mt-2 rounded border" style="border-color: #a5d6a7 !important;">
                      <span class="text-green-darken-3">TOTAL REVENUE</span>
                      <span class="text-green-darken-3">Rp {{ totalRevenue.toLocaleString('id-ID') }}</span>
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold text-orange-darken-2 mb-2 border-bottom pb-1">COST OF GOODS SOLD (HPP)</div>
                    <div v-if="cogsList.length === 0" class="text-caption font-italic text-grey py-2">No Data</div>
                    <div v-for="(item, i) in cogsList" :key="'cogs'+i" class="d-flex justify-space-between text-caption py-1 item-row">
                      <span class="text-grey-darken-2">{{ item.accountName }}</span>
                      <span class="font-mono text-medium-emphasis text-red">({{ Number(item.amount).toLocaleString('id-ID') }})</span>
                    </div>
                    <div class="d-flex justify-space-between font-weight-bold text-subtitle-2 bg-orange-lighten-5 pa-2 mt-2 rounded border" style="border-color: #ffcc80 !important;">
                      <span class="text-orange-darken-3">TOTAL COGS</span>
                      <span class="text-orange-darken-3">({{ totalCOGS.toLocaleString('id-ID') }})</span>
                    </div>
                  </div>

                  <div class="d-flex justify-space-between text-h6 font-weight-bold my-4 px-4 py-3 bg-grey-lighten-4 rounded border-dashed text-medium-emphasis">
                    <span>GROSS PROFIT (LABA KOTOR)</span>
                    <span :class="(totalRevenue - totalCOGS) >= 0 ? 'text-success' : 'text-error'">Rp {{ (totalRevenue - totalCOGS).toLocaleString('id-ID') }}</span>
                  </div>

                  <div class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold text-red-darken-2 mb-2 border-bottom pb-1">OPERATIONAL EXPENSES</div>
                    <div v-if="expenseList.length === 0" class="text-caption font-italic text-grey py-2">No Data</div>
                    <div v-for="(item, i) in expenseList" :key="'exp'+i" class="d-flex justify-space-between text-caption py-1 item-row">
                      <span class="text-grey-darken-2">{{ item.accountName }}</span>
                      <span class="font-mono text-medium-emphasis text-red">({{ Number(item.amount).toLocaleString('id-ID') }})</span>
                    </div>
                    <div class="d-flex justify-space-between font-weight-bold text-subtitle-2 bg-red-lighten-5 pa-2 mt-2 rounded border" style="border-color: #ef9a9a !important;">
                      <span class="text-red-darken-3">TOTAL EXPENSE</span>
                      <span class="text-red-darken-3">({{ totalExpense.toLocaleString('id-ID') }})</span>
                    </div>
                  </div>

                  <div class="d-flex justify-space-between text-h5 font-weight-bold mt-6 pa-4 border-double" :class="netProfit >= 0 ? 'bg-green-lighten-4 text-green-darken-3' : 'bg-red-lighten-4 text-red-darken-3'">
                    <span>NET PROFIT / (LOSS)</span>
                    <span>Rp {{ netProfit.toLocaleString('id-ID') }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-window-item>

            <v-window-item v-for="tab in ['REVENUE', 'COGS', 'EXPENSE']" :key="tab" :value="tab">
              <v-data-table
                :items="(tab==='REVENUE'?revenueList:tab==='COGS'?cogsList:expenseList)"
                density="compact"
                class="border rounded-lg"
                hover
              >
                <template v-slot:headers>
                  <tr class="bg-grey-lighten-4 text-caption">
                    <th class="text-left font-weight-bold">Account No</th>
                    <th class="text-left font-weight-bold">Account Name</th>
                    <th class="text-right font-weight-bold">Amount (Rp)</th>
                  </tr>
                </template>
                <template v-slot:item="{ item }">
                  <tr>
                    <td class="text-caption"><v-chip size="x-small" variant="outlined">{{ item.accountNo }}</v-chip></td>
                    <td class="font-weight-medium text-caption">{{ item.accountName }}</td>
                    <td class="text-right font-mono text-caption">{{ Number(item.amount).toLocaleString('id-ID') }}</td>
                  </tr>
                </template>
                <template v-slot:bottom></template> 
                <template v-slot:tfoot>
                  <tr class="bg-grey-lighten-4">
                    <td colspan="2" class="text-right font-weight-bold text-subtitle-2 text-primary">
                      TOTAL {{ tab }}
                    </td>
                    <td class="text-right font-weight-bold text-subtitle-2 text-primary">
                      Rp {{ (tab==='REVENUE'?totalRevenue:tab==='COGS'?totalCOGS:totalExpense).toLocaleString('id-ID') }}
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
/* Gradient Theme */
.bg-gradient-smooth {
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}

.font-mono { font-family: 'Roboto Mono', monospace; }

/* Report Styling Helpers */
.border-bottom { border-bottom: 2px solid #eee; }
.border-dashed { border: 1px dashed #ccc; }
.border-double { 
  border-top: 4px double rgba(0,0,0,0.2); 
  border-bottom: 4px double rgba(0,0,0,0.2);
}
.item-row:hover { background-color: #f9f9f9; }

/* Active Ring for KPI Cards */
.ring-active {
  box-shadow: 0 0 0 2px #1565C0 !important;
  background-color: #F3F8FF !important;
  transition: box-shadow 0.2s;
}

/* Input Compaction (Reused from previous requests) */
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

/* Data Table Compact in Detail Tabs */
.compact-data-card :deep(.v-data-table__td) {
  font-size: 0.75rem !important;
  height: 38px !important; 
}
.compact-data-card :deep(.v-data-table-header) th {
  height: 35px !important; 
}
.compact-data-card :deep(.v-table) {
  font-size: 0.8rem !important;
}

/* Print Styles */
@media print {
  .d-print-none { display: none !important; }
  .d-print-block { display: block !important; }
  .bg-gradient-smooth { background: none !important; color: black !important; }
  .v-card { box-shadow: none !important; border: 1px solid #ccc !important; }
}
</style>