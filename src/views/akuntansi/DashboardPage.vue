<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
    WalletIcon, 
    ChartDotsIcon, 
    CreditCardIcon, 
    CoinIcon,
    ArrowDownRightIcon,
    DotsVerticalIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

// --- LOGIC & STATE ---
const data = ref<any>(null);
const loading = ref(true);

// Helper Format Rupiah
const fmt = (v: number) => v ? `Rp ${Number(v).toLocaleString('id-ID')}` : 'Rp 0';

const fetchData = async () => {
    loading.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/Dashboard/DashboardData.php`);
        const json = await res.json();
        if(json.s) data.value = json.d;
    } catch (e) {
        console.error(e);
    } finally { 
        loading.value = false; 
    }
};

onMounted(fetchData);

// --- CHART CONFIGURATION ---
const chartBankOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '45%' } },
    colors: ['#1890ff'],
    grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: { categories: data.value?.chart_bank?.map((x:any) => x.name) || [] }
}));
const chartBankSeries = computed(() => [{ name: 'Saldo', data: data.value?.chart_bank?.map((x:any) => x.value) || [] }]);

const chartPLOptions = computed(() => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: data.value?.chart_pl?.map((x:any) => x.name) || [],
    colors: ['#52c41a', '#faad14', '#f5222d'],
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { size: '65%' } } }
}));
const chartPLSeries = computed(() => data.value?.chart_pl?.map((x:any) => x.value) || []);
</script>

<template>
    <v-row v-if="loading" class="justify-center mt-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-row>

    <v-row v-else-if="data" class="mt-2">
        
        <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" rounded="lg" class="border">
                <v-card-text>
                    <div class="d-flex align-center">
                        <div class="bg-blue-lighten-5 pa-3 rounded-md">
                            <WalletIcon size="24" class="text-primary" />
                        </div>
                        <div class="ml-4">
                            <h6 class="text-subtitle-2 text-grey-darken-1">Total Kas & Bank</h6>
                            <h4 class="text-h5 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.total_cash) }}</h4>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" rounded="lg" class="border">
                <v-card-text>
                    <div class="d-flex align-center">
                        <div class="bg-green-lighten-5 pa-3 rounded-md">
                            <ChartDotsIcon size="24" class="text-success" />
                        </div>
                        <div class="ml-4">
                            <h6 class="text-subtitle-2 text-grey-darken-1">Laba Bersih</h6>
                            <h4 class="text-h5 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.net_profit) }}</h4>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" rounded="lg" class="border">
                <v-card-text>
                    <div class="d-flex align-center">
                        <div class="bg-orange-lighten-5 pa-3 rounded-md">
                            <CreditCardIcon size="24" class="text-warning" />
                        </div>
                        <div class="ml-4">
                            <h6 class="text-subtitle-2 text-grey-darken-1">Piutang</h6>
                            <h4 class="text-h5 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.total_ar) }}</h4>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" rounded="lg" class="border">
                <v-card-text>
                    <div class="d-flex align-center">
                        <div class="bg-indigo-lighten-5 pa-3 rounded-md">
                            <CoinIcon size="24" class="text-indigo" />
                        </div>
                        <div class="ml-4">
                            <h6 class="text-subtitle-2 text-grey-darken-1">Pendapatan</h6>
                            <h4 class="text-h5 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.revenue) }}</h4>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" md="8">
            <v-card elevation="0" rounded="lg" class="border h-100">
                <div class="pa-5 d-flex justify-space-between align-center border-b">
                    <h5 class="text-h6 font-weight-bold">Komposisi Saldo Bank</h5>
                    <v-btn icon size="small" variant="text"><DotsVerticalIcon size="20" class="text-grey"/></v-btn>
                </div>
                <div class="pa-4">
                    <apexchart type="bar" height="350" :options="chartBankOptions" :series="chartBankSeries"></apexchart>
                </div>
            </v-card>
        </v-col>

        <v-col cols="12" md="4">
            <v-card elevation="0" rounded="lg" class="border h-100">
                <div class="pa-5 border-b">
                    <h5 class="text-h6 font-weight-bold">Analisa Laba Rugi</h5>
                </div>
                <div class="pa-4 d-flex align-center justify-center" style="min-height: 350px;">
                    <apexchart type="donut" width="100%" :options="chartPLOptions" :series="chartPLSeries"></apexchart>
                </div>
            </v-card>
        </v-col>

        <v-col cols="12" md="8">
            <v-card elevation="0" rounded="lg" class="border">
                <div class="pa-5 d-flex justify-space-between align-center border-b">
                    <h5 class="text-h6 font-weight-bold">Penjualan Terakhir</h5>
                    <v-chip size="small" color="primary" variant="tonal">Recent 5</v-chip>
                </div>
                <div class="pa-0">
                    <v-table class="month-table">
                        <thead>
                            <tr>
                                <th class="text-subtitle-2 font-weight-bold pl-6">Pelanggan / No. Inv</th>
                                <th class="text-subtitle-2 font-weight-bold text-right pr-6">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(inv, i) in data.recent_invoices" :key="i" class="hover:bg-grey-lighten-5 transition-colors">
                                <td class="py-3 pl-6">
                                    <h6 class="text-body-1 font-weight-medium mb-0">{{ inv.customer }}</h6>
                                    <div class="text-caption text-grey">{{ inv.number }} • {{ inv.date }}</div>
                                </td>
                                <td class="text-right pr-6">
                                    <h6 class="text-body-1 font-weight-bold text-grey-darken-3 mb-0">{{ fmt(inv.amount) }}</h6>
                                </td>
                            </tr>
                            <tr v-if="data.recent_invoices.length === 0">
                                <td colspan="2" class="text-center text-caption py-4">Belum ada data penjualan.</td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </v-card>
        </v-col>

        <v-col cols="12" md="4">
            <v-card elevation="0" rounded="lg" class="border h-100">
                <div class="pa-5 border-b">
                    <h5 class="text-h6 font-weight-bold">Pengeluaran Terakhir</h5>
                </div>
                <div class="pa-0">
                    <v-list lines="two" class="py-0">
                        <v-list-item v-for="(exp, i) in data.recent_expenses" :key="i" class="border-b">
                            <template v-slot:prepend>
                                <v-avatar color="red-lighten-5" size="40" class="mr-3">
                                    <ArrowDownRightIcon size="20" class="text-red" />
                                </v-avatar>
                            </template>
                            <v-list-item-title class="font-weight-bold text-body-2">{{ exp.desc }}</v-list-item-title>
                            <v-list-item-subtitle class="text-caption">{{ exp.date }}</v-list-item-subtitle>
                            <template v-slot:append>
                                <div class="text-subtitle-2 font-weight-bold text-red">{{ fmt(exp.amount) }}</div>
                            </template>
                        </v-list-item>
                    </v-list>
                    <div v-if="data.recent_expenses.length === 0" class="text-center text-caption py-4">
                        Belum ada data pengeluaran.
                    </div>
                </div>
            </v-card>
        </v-col>

    </v-row>
</template>

<style scoped>
.border {
    border: 1px solid rgba(0,0,0,0.08) !important;
}
</style>