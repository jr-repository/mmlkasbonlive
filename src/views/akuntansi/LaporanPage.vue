<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { format, subDays } from 'date-fns'; 
import { 
  FilterIcon, 
  PrinterIcon, 
  ReportAnalyticsIcon, 
  ChartPieIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  CoinIcon,
  CalendarStatsIcon,
  DownloadIcon,
  FileSpreadsheetIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";

let reportTimeout: ReturnType<typeof setTimeout> | null = null; 

// --- STATE ---
const fromDate = ref(format(subDays(new Date(), 7), 'yyyy-MM-dd')); 
const toDate = ref(format(new Date(), 'yyyy-MM-dd'));
const loading = ref(false);
const reportData = ref<any[]>([]);
const activeTab = ref('SUMMARY');

// --- COMPUTED ---
const getAccountsByType = (types: string[]) => reportData.value.filter(d => types.includes(d.accountType));
const sumAmount = (data: any[]) => data.reduce((acc, curr) => acc + Number(curr.amount), 0);

const revenue = computed(() => reportData.value.filter(d => d.accountType === 'REVENUE' && d.lvl === 1).reduce((a,b)=>a+b.amount,0));
const cogs = computed(() => reportData.value.filter(d => d.accountType === 'COST_OF_GOOD_SOLD' && d.lvl === 1).reduce((a,b)=>a+b.amount,0));
const grossProfit = computed(() => revenue.value - cogs.value);
const expenses = computed(() => reportData.value.filter(d => d.accountType === 'EXPENSE' && d.lvl === 1).reduce((a,b)=>a+b.amount,0));
const operatingProfit = computed(() => grossProfit.value - expenses.value);
const otherIncome = computed(() => reportData.value.filter(d => d.accountType === 'OTHER_INCOME' && d.lvl === 1).reduce((a,b)=>a+b.amount,0));
const otherExpense = computed(() => reportData.value.filter(d => d.accountType === 'OTHER_EXPENSE' && d.lvl === 1).reduce((a,b)=>a+b.amount,0));
const netProfit = computed(() => operatingProfit.value + otherIncome.value - otherExpense.value);

// --- METHODS ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const formattedFrom = format(new Date(fromDate.value), 'dd/MM/yyyy');
    const formattedTo = format(new Date(toDate.value), 'dd/MM/yyyy');
    
    const res = await fetch(`${API_BASE_URL}/Laporan/Index.php?fromDate=${formattedFrom}&toDate=${formattedTo}`);
    const json = await res.json();
    if(json.s) {
      reportData.value = json.d.sort((a: any, b: any) => a.accountNo.localeCompare(b.accountNo));
    } else {
      reportData.value = [];
    }
  } catch(e) {
    console.error("Failed to fetch report", e);
  } finally {
    loading.value = false;
  }
};

const fetchDebounced = () => {
  if (reportTimeout) clearTimeout(reportTimeout);
  reportTimeout = setTimeout(fetchReport, 600);
}

// Action Export PDF
const exportPdf = () => {
  const formattedFrom = format(new Date(fromDate.value), 'dd/MM/yyyy');
  const formattedTo = format(new Date(toDate.value), 'dd/MM/yyyy');
  window.open(`${API_BASE_URL}/Laporan/ExportPdf.php?fromDate=${formattedFrom}&toDate=${formattedTo}`, '_blank');
};

// Action Export Excel
const exportExcel = () => {
  const formattedFrom = format(new Date(fromDate.value), 'dd/MM/yyyy');
  const formattedTo = format(new Date(toDate.value), 'dd/MM/yyyy');
  window.open(`${API_BASE_URL}/Laporan/ExportExcel.php?fromDate=${formattedFrom}&toDate=${formattedTo}`, '_blank');
};

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
};

const getLevelStyle = (lvl: number, isParent: boolean) => {
  if (lvl === 1 || isParent) return 'font-weight-bold text-black';
  if (lvl === 2) return 'pl-4';
  if (lvl === 3) return 'pl-8 text-medium-emphasis';
  return '';
};

watch([fromDate, toDate], fetchDebounced);

onMounted(() => {
  fetchReport();
});

onBeforeUnmount(() => {
  if (reportTimeout) clearTimeout(reportTimeout);
});
</script>

<template>
  <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <ReportAnalyticsIcon size="24" class="text-white" />
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">Financial Reports</h2>
          <div class="text-caption text-white opacity-90">Profit & Loss Statement Analysis</div>
        </div>
      </div>
    </div>
    
    <div class="bg-white px-4 py-2 d-flex align-center justify-space-between border-bottom">
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="SUMMARY" class="text-caption font-weight-bold"><ChartPieIcon size="16" class="mr-1"/> Summary</v-tab>
        <v-tab value="DETAIL" class="text-caption font-weight-bold"><FileSpreadsheetIcon size="16" class="mr-1"/> Detailed View</v-tab>
      </v-tabs>

      <div class="d-flex align-center gap-2">
        <div class="d-flex align-center gap-2 border pa-1 rounded bg-grey-lighten-5">
          <CalendarStatsIcon size="18" class="text-grey"/>
          <input type="date" v-model="fromDate" class="small-input date-input" />
          <span class="text-caption">-</span>
          <input type="date" v-model="toDate" class="small-input date-input" />
        </div>
        <v-btn icon variant="text" size="small" color="primary" @click="fetchReport" :loading="loading">
          <FilterIcon size="20"/>
        </v-btn>
        
        <v-divider vertical class="mx-2"></v-divider>
        
        <v-btn color="error" variant="outlined" size="small" @click="exportPdf" class="text-caption">
          <PrinterIcon size="16" class="mr-1"/> PDF
        </v-btn>
        <v-btn color="success" variant="outlined" size="small" @click="exportExcel" class="text-caption">
          <DownloadIcon size="16" class="mr-1"/> Excel
        </v-btn>
      </div>
    </div>
  </v-card>

  <v-window v-model="activeTab">
    <v-window-item value="SUMMARY">
      <v-row>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-4 h-100 border-top-primary">
            <div class="d-flex justify-space-between mb-2">
              <div class="text-subtitle-2 text-grey">Total Revenue</div>
              <TrendingUpIcon size="20" class="text-green"/>
            </div>
            <div class="text-h5 font-weight-bold text-primary mb-1">{{ formatMoney(revenue) }}</div>
            <div class="text-caption text-grey">Gross Income from Sales</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-4 h-100 border-top-warning">
            <div class="d-flex justify-space-between mb-2">
              <div class="text-subtitle-2 text-grey">Operating Expenses</div>
              <TrendingDownIcon size="20" class="text-orange"/>
            </div>
            <div class="text-h5 font-weight-bold text-orange mb-1">{{ formatMoney(expenses) }}</div>
            <div class="text-caption text-grey">Total Operational Costs</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-4 h-100 border-top-success bg-green-lighten-5">
            <div class="d-flex justify-space-between mb-2">
              <div class="text-subtitle-2 text-grey-darken-2">Net Profit</div>
              <CoinIcon size="20" class="text-green-darken-2"/>
            </div>
            <div class="text-h5 font-weight-bold text-green-darken-3 mb-1">{{ formatMoney(netProfit) }}</div>
            <div class="text-caption text-grey-darken-2">Final Earnings after Tax & Interest</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card elevation="2" class="border">
            <v-card-title class="text-subtitle-1 font-weight-bold bg-grey-lighten-4 py-2 px-4">
              Profitability Breakdown
            </v-card-title>
            <v-table density="compact">
              <tbody>
                <tr>
                  <td class="font-weight-bold">Revenue</td>
                  <td class="text-right text-primary font-weight-bold">{{ formatMoney(revenue) }}</td>
                </tr>
                <tr>
                  <td>Cost of Goods Sold (HPP)</td>
                  <td class="text-right text-red">({{ formatMoney(cogs) }})</td>
                </tr>
                <tr class="bg-blue-lighten-5">
                  <td class="font-weight-bold text-blue-darken-2">GROSS PROFIT</td>
                  <td class="text-right font-weight-bold text-blue-darken-2">{{ formatMoney(grossProfit) }}</td>
                </tr>
                <tr>
                  <td>Operating Expenses</td>
                  <td class="text-right text-red">({{ formatMoney(expenses) }})</td>
                </tr>
                <tr class="bg-orange-lighten-5">
                  <td class="font-weight-bold text-orange-darken-4">OPERATING PROFIT</td>
                  <td class="text-right font-weight-bold text-orange-darken-4">{{ formatMoney(operatingProfit) }}</td>
                </tr>
                <tr>
                  <td>Other Income</td>
                  <td class="text-right text-green">{{ formatMoney(otherIncome) }}</td>
                </tr>
                <tr>
                  <td>Other Expenses</td>
                  <td class="text-right text-red">({{ formatMoney(otherExpense) }})</td>
                </tr>
                <tr class="bg-green-lighten-1">
                  <td class="font-weight-bold text-white text-h6">NET PROFIT</td>
                  <td class="text-right font-weight-bold text-white text-h6">{{ formatMoney(netProfit) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </v-window-item>

    <v-window-item value="DETAIL">
      <v-card elevation="2" class="border">
        <v-table density="compact" class="report-table">
          <thead>
            <tr class="bg-grey-lighten-3">
              <th class="text-left font-weight-bold text-caption">Account No</th>
              <th class="text-left font-weight-bold text-caption">Description</th>
              <th class="text-right font-weight-bold text-caption">Type</th>
              <th class="text-right font-weight-bold text-caption">Balance (IDR)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in reportData" :key="item.accountNo" class="item-row">
              <td class="text-caption font-mono" :class="{'font-weight-bold': item.isParent}">{{ item.accountNo }}</td>
              <td class="text-caption">
                <div :class="getLevelStyle(item.lvl, item.isParent)">{{ item.accountName }}</div>
              </td>
              <td class="text-right text-caption text-grey">{{ item.accountType }}</td>
              <td class="text-right text-caption" :class="{'font-weight-bold': item.isParent}">
                {{ formatMoney(item.amount) }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-window-item>
  </v-window>
</template>

<style scoped>
.bg-gradient-smooth {
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}

.font-mono { font-family: 'Roboto Mono', monospace; }

/* Report Styling Helpers */
.border-bottom { border-bottom: 1px solid #eee; }
.border-top-primary { border-top: 3px solid #1976D2; }
.border-top-warning { border-top: 3px solid #FB8C00; }
.border-top-success { border-top: 3px solid #43A047; }

.item-row:hover { background-color: #f9f9f9; }

/* Input Compaction */
.small-input {
  border: none;
  background: transparent;
  font-size: 0.85rem;
  width: 90px;
  outline: none;
}

.compact-header-card :deep(.text-h6) { font-size: 1rem !important; }

/* Table Compaction */
.report-table :deep(th) { height: 36px !important; }
.report-table :deep(td) { height: 32px !important; }
</style>