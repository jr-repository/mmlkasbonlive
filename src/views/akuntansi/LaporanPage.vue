<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from 'date-fns';
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

const API_BASE_URL = "https://multimitralogistik.id/Api";

// --- STATE ---
const fromDate = ref(format(new Date(), 'yyyy-MM-dd'));
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

const printReport = () => window.print();
</script>

<template>
    <v-card elevation="10" rounded="lg" class="mb-6 overflow-hidden d-print-none">
        <div class="bg-gradient-smooth px-6 py-8">
            <div class="d-flex align-center gap-3">
               
                <div>
                    <h2 class="text-h4 font-weight-bold text-white mb-1" style="text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Financial Report
                    </h2>
                    <div class="text-subtitle-1 text-white opacity-90">
                        Profit & Loss Statement Analysis
                    </div>
                </div>
            </div>
        </div>
    </v-card>

    <v-row>
       <v-col cols="12" class="d-print-none">
        <v-card elevation="10" rounded="lg" class="border overflow-hidden">
            <div class="bg-gradient-smooth px-6 py-3 d-flex align-center">
                <FilterIcon size="20" class="text-white mr-2" />
                <span class="text-subtitle-1 font-weight-bold text-white">Report Parameters</span>
            </div>

            <v-card-text class="pa-4">
                <div class="d-flex flex-wrap gap-4 align-end">

                    <!-- FROM DATE -->
                    <div style="flex: 1; min-width: 200px;">
                        <label class="text-caption font-weight-bold text-grey-darken-1 mb-1 d-block">
                            From Date
                        </label>

                        <v-text-field
                            v-model="fromDate"
                            type="date"
                            variant="outlined"
                            hide-details
                            density="compact"
                            color="primary"
                            style="height: 46px;"
                            class="min-input-height"
                        />
                    </div>

                    <!-- TO DATE -->
                    <div style="flex: 1; min-width: 200px;">
                        <label class="text-caption font-weight-bold text-grey-darken-1 mb-1 d-block">
                            To Date
                        </label>

                        <v-text-field
                            v-model="toDate"
                            type="date"
                            variant="outlined"
                            hide-details
                            density="compact"
                            color="primary"
                            style="height: 46px;"
                            class="min-input-height"
                        />
                    </div>

                    <!-- BUTTONS -->
                    <div class="d-flex gap-2">
                        <v-btn
                            color="primary"
                            height="46"
                            @click="fetchReport"
                            :loading="loading"
                            class="px-6"
                        >
                            <ChartPieIcon size="18" class="mr-2" /> Generate
                        </v-btn>

                        <v-btn
                            variant="outlined"
                            color="secondary"
                            height="46"
                            @click="printReport"
                        >
                            <PrinterIcon size="18" class="mr-2" /> Print
                        </v-btn>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </v-col>



        <v-col cols="12" md="4">
            <v-card elevation="0" rounded="lg" class="pa-4 border" :class="activeTab === 'REVENUE' ? 'ring-active' : ''">
                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-subtitle-1 font-weight-bold text-grey-darken-1">Total Revenue</div>
                    <v-avatar color="green-lighten-5" rounded="lg" size="40">
                        <TrendingUpIcon size="24" class="text-green" />
                    </v-avatar>
                </div>
                <div class="text-h4 font-weight-bold text-green">Rp {{ totalRevenue.toLocaleString('id-ID') }}</div>
                <div class="text-caption text-grey mt-1">Total income from sales & services</div>
            </v-card>
        </v-col>
        <v-col cols="12" md="4">
            <v-card elevation="0" rounded="lg" class="pa-4 border" :class="activeTab === 'EXPENSE' ? 'ring-active' : ''">
                 <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-subtitle-1 font-weight-bold text-grey-darken-1">Total Costs & Exp</div>
                    <v-avatar color="red-lighten-5" rounded="lg" size="40">
                        <TrendingDownIcon size="24" class="text-red" />
                    </v-avatar>
                </div>
                <div class="text-h4 font-weight-bold text-red">Rp {{ (totalCOGS + totalExpense).toLocaleString('id-ID') }}</div>
                <div class="text-caption text-grey mt-1">Includes COGS and Operational Expenses</div>
            </v-card>
        </v-col>
        <v-col cols="12" md="4">
             <v-card elevation="0" rounded="lg" class="pa-4 border" :color="netProfit >= 0 ? 'green-lighten-5' : 'red-lighten-5'" style="border: 1px solid rgba(0,0,0,0.05) !important;">
                 <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-subtitle-1 font-weight-bold text-grey-darken-2">Net Profit / Loss</div>
                    <v-avatar color="white" rounded="lg" size="40" elevation="1">
                        <CoinIcon size="24" :class="netProfit >= 0 ? 'text-green' : 'text-red'" />
                    </v-avatar>
                </div>
                <div class="text-h4 font-weight-bold" :class="netProfit >= 0 ? 'text-green-darken-2' : 'text-red-darken-2'">
                    Rp {{ netProfit.toLocaleString('id-ID') }}
                </div>
                <div class="text-caption text-grey-darken-2 mt-1 font-weight-medium">Final calculated result</div>
            </v-card>
        </v-col>

        <v-col cols="12" md="6" class="d-print-none">
            <v-card elevation="10" rounded="lg" class="border">
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
        <v-col cols="12" md="6" class="d-print-none">
            <v-card elevation="10" rounded="lg" class="border">
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

        <v-col cols="12">
            <v-card elevation="10" rounded="lg" class="border overflow-hidden">
                <div class="bg-gradient-smooth px-6 py-4 d-flex align-center justify-space-between flex-wrap gap-2 d-print-none">
                     <div class="d-flex align-center">
                        <ReportAnalyticsIcon size="24" class="text-white mr-2" />
                        <div>
                            <h3 class="text-h6 font-weight-bold text-white">Detailed Statement</h3>
                            <div class="text-caption text-white opacity-80">Breakdown by accounts</div>
                        </div>
                    </div>
                </div>

                <div class="d-print-block d-none px-6 pt-6">
                    <h2 class="text-h4 text-center font-weight-bold">PROFIT & LOSS STATEMENT</h2>
                    <div class="text-center text-subtitle-1 mb-6">Period: {{ format(new Date(fromDate), 'dd MMM yyyy') }} - {{ format(new Date(toDate), 'dd MMM yyyy') }}</div>
                </div>

                <v-tabs v-model="activeTab" color="primary" class="border-bottom d-print-none bg-grey-lighten-5">
                    <v-tab value="SUMMARY" class="font-weight-bold">Summary P/L</v-tab>
                    <v-tab value="REVENUE">Revenue</v-tab>
                    <v-tab value="COGS">HPP (COGS)</v-tab>
                    <v-tab value="EXPENSE">Expense</v-tab>
                </v-tabs>
                
                <v-card-text class="pa-6">
                    <v-window v-model="activeTab">
                        <v-window-item value="SUMMARY">
                            <v-card variant="outlined" class="mx-auto" max-width="900" style="border: 1px solid #ddd;">
                                <v-card-text class="pa-8">
                                    <div class="mb-6">
                                        <div class="text-subtitle-1 font-weight-bold text-green mb-3 border-bottom pb-1">REVENUE / PENDAPATAN</div>
                                        <div v-if="revenueList.length === 0" class="text-caption font-italic text-grey py-2">No Data</div>
                                        <div v-for="(item, i) in revenueList" :key="'rev'+i" class="d-flex justify-space-between text-body-2 py-1 item-row">
                                            <span class="text-grey-darken-2">{{ item.accountName }}</span>
                                            <span class="font-mono">{{ Number(item.amount).toLocaleString('id-ID') }}</span>
                                        </div>
                                        <div class="d-flex justify-space-between font-weight-bold bg-green-lighten-5 pa-2 mt-2 rounded border" style="border-color: #a5d6a7 !important;">
                                            <span class="text-green-darken-3">TOTAL REVENUE</span>
                                            <span class="text-green-darken-3">{{ totalRevenue.toLocaleString('id-ID') }}</span>
                                        </div>
                                    </div>

                                    <div class="mb-6">
                                        <div class="text-subtitle-1 font-weight-bold text-orange mb-3 border-bottom pb-1">COST OF GOODS SOLD (HPP)</div>
                                        <div v-if="cogsList.length === 0" class="text-caption font-italic text-grey py-2">No Data</div>
                                        <div v-for="(item, i) in cogsList" :key="'cogs'+i" class="d-flex justify-space-between text-body-2 py-1 item-row">
                                            <span class="text-grey-darken-2">{{ item.accountName }}</span>
                                            <span class="font-mono">({{ Number(item.amount).toLocaleString('id-ID') }})</span>
                                        </div>
                                        <div class="d-flex justify-space-between font-weight-bold bg-orange-lighten-5 pa-2 mt-2 rounded border" style="border-color: #ffcc80 !important;">
                                            <span class="text-orange-darken-3">TOTAL COGS</span>
                                            <span class="text-orange-darken-3">({{ totalCOGS.toLocaleString('id-ID') }})</span>
                                        </div>
                                    </div>

                                    <div class="d-flex justify-space-between text-h6 font-weight-bold my-6 px-4 py-3 bg-grey-lighten-4 rounded border-dashed">
                                        <span>GROSS PROFIT (LABA KOTOR)</span>
                                        <span>{{ (totalRevenue - totalCOGS).toLocaleString('id-ID') }}</span>
                                    </div>

                                    <div class="mb-6">
                                        <div class="text-subtitle-1 font-weight-bold text-red mb-3 border-bottom pb-1">OPERATIONAL EXPENSES</div>
                                        <div v-if="expenseList.length === 0" class="text-caption font-italic text-grey py-2">No Data</div>
                                        <div v-for="(item, i) in expenseList" :key="'exp'+i" class="d-flex justify-space-between text-body-2 py-1 item-row">
                                            <span class="text-grey-darken-2">{{ item.accountName }}</span>
                                            <span class="font-mono">({{ Number(item.amount).toLocaleString('id-ID') }})</span>
                                        </div>
                                        <div class="d-flex justify-space-between font-weight-bold bg-red-lighten-5 pa-2 mt-2 rounded border" style="border-color: #ef9a9a !important;">
                                            <span class="text-red-darken-3">TOTAL EXPENSE</span>
                                            <span class="text-red-darken-3">({{ totalExpense.toLocaleString('id-ID') }})</span>
                                        </div>
                                    </div>

                                    <div class="d-flex justify-space-between text-h5 font-weight-bold mt-8 pa-4 border-double" :class="netProfit >= 0 ? 'bg-green-lighten-5 text-green-darken-3' : 'bg-red-lighten-5 text-red-darken-3'">
                                        <span>NET PROFIT / (LOSS)</span>
                                        <span>Rp {{ netProfit.toLocaleString('id-ID') }}</span>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-window-item>

                        <v-window-item v-for="tab in ['REVENUE', 'COGS', 'EXPENSE']" :key="tab" :value="tab">
                             <v-data-table
                                :items="(tab==='REVENUE'?revenueList:tab==='COGS'?cogsList:expenseList)"
                                density="comfortable"
                                class="border rounded-lg"
                                hover
                            >
                                <template v-slot:headers>
                                    <tr class="bg-grey-lighten-4">
                                        <th class="text-left font-weight-bold">Account No</th>
                                        <th class="text-left font-weight-bold">Account Name</th>
                                        <th class="text-right font-weight-bold">Amount (Rp)</th>
                                    </tr>
                                </template>
                                <template v-slot:item="{ item }">
                                    <tr>
                                        <td><v-chip size="small" variant="outlined">{{ item.accountNo }}</v-chip></td>
                                        <td class="font-weight-medium">{{ item.accountName }}</td>
                                        <td class="text-right font-mono">{{ Number(item.amount).toLocaleString('id-ID') }}</td>
                                    </tr>
                                </template>
                                <template v-slot:bottom></template> </v-data-table>
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
    background-color: #F3F8FF;
}

@media print {
    .d-print-none { display: none !important; }
    .d-print-block { display: block !important; }
    .bg-gradient-smooth { background: none !important; color: black !important; }
    .v-card { box-shadow: none !important; border: 1px solid #ccc !important; }
}
</style>
