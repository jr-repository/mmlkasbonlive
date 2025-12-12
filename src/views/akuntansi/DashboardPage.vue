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

const API_BASE_URL = "https://kasbon2.multimitralogistik.id/Api";

// --- LOGIC & STATE ---
// FIX: Inisialisasi data sebagai objek kosong jika memungkinkan, tapi null juga aman karena template menggunakan v-if="data"
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

// FIX: onMounted memastikan fetch API hanya dipanggil 1 kali saat komponen dimuat. Ini sudah benar.
onMounted(fetchData);

// --- CHART CONFIGURATION ---
// FIX: Computed properties ini aman karena mengakses data.value menggunakan optional chaining (?. )
// dan template mencegah render jika data.value masih null (v-else-if="data").
const chartBankOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  plotOptions: { bar: { horizontal: false, borderRadius: 3, columnWidth: '50%' } }, /* Dikecilkan */
  colors: ['#1890ff'],
  grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  xaxis: { 
        categories: data.value?.chart_bank?.map((x:any) => x.name) || [],
        labels: { style: { fontSize: '10px' } } /* Dikecilkan */
    },
    yaxis: { 
        labels: { style: { fontSize: '10px' } } /* Dikecilkan */
    }
}));
const chartBankSeries = computed(() => [{ name: 'Saldo', data: data.value?.chart_bank?.map((x:any) => x.value) || [] }]);

const chartPLOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: data.value?.chart_pl?.map((x:any) => x.name) || [],
  colors: ['#52c41a', '#faad14', '#f5222d'],
  legend: { 
        position: 'bottom',
        fontSize: '11px', /* Dikecilkan */
        itemMargin: { horizontal: 4, vertical: 0 } /* Dikecilkan */
    },
  plotOptions: { 
        pie: { 
            donut: { 
                size: '70%', /* Dikecilkan sedikit */
                labels: { total: { fontSize: '12px' } }
            } 
        } 
    }
}));
const chartPLSeries = computed(() => data.value?.chart_pl?.map((x:any) => x.value) || []);
</script>

<template>
  <v-row v-if="loading" class="justify-center mt-6">
    <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
        <div class="text-caption mt-2 w-100 text-center">Memuat data...</div>
  </v-row>

  <v-row v-else-if="data" class="mt-0">
    
        <v-col cols="12" sm="6" md="3">
      <v-card elevation="0" rounded="lg" class="border small-card">
        <v-card-text class="pa-3">
          <div class="d-flex align-center">
            <div class="bg-blue-lighten-5 pa-2 rounded-md">
              <WalletIcon size="18" class="text-primary" />
            </div>
            <div class="ml-3">
              <h6 class="text-caption text-grey-darken-1">Total Kas & Bank</h6>
              <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.total_cash) }}</h4>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card elevation="0" rounded="lg" class="border small-card">
        <v-card-text class="pa-3">
          <div class="d-flex align-center">
            <div class="bg-green-lighten-5 pa-2 rounded-md">
              <ChartDotsIcon size="18" class="text-success" />
            </div>
            <div class="ml-3">
              <h6 class="text-caption text-grey-darken-1">Laba Bersih</h6>
              <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.net_profit) }}</h4>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card elevation="0" rounded="lg" class="border small-card">
        <v-card-text class="pa-3">
          <div class="d-flex align-center">
            <div class="bg-orange-lighten-5 pa-2 rounded-md">
              <CreditCardIcon size="18" class="text-warning" />
            </div>
            <div class="ml-3">
              <h6 class="text-caption text-grey-darken-1">Piutang</h6>
              <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.total_ar) }}</h4>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card elevation="0" rounded="lg" class="border small-card">
        <v-card-text class="pa-3">
          <div class="d-flex align-center">
            <div class="bg-indigo-lighten-5 pa-2 rounded-md">
              <CoinIcon size="18" class="text-indigo" />
            </div>
            <div class="ml-3">
              <h6 class="text-caption text-grey-darken-1">Pendapatan</h6>
              <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-3">{{ fmt(data.summary.revenue) }}</h4>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

        <v-col cols="12" md="8">
      <v-card elevation="0" rounded="lg" class="border h-100 compact-card">
        <div class="pa-3 d-flex justify-space-between align-center border-b">
          <h5 class="text-subtitle-2 font-weight-bold">Komposisi Saldo Bank</h5>
          <v-btn icon size="x-small" variant="text"><DotsVerticalIcon size="16" class="text-grey"/></v-btn>
        </div>
        <div class="pa-2">
          <apexchart type="bar" height="300" :options="chartBankOptions" :series="chartBankSeries"></apexchart>
        </div>
      </v-card>
    </v-col>

        <v-col cols="12" md="4">
      <v-card elevation="0" rounded="lg" class="border h-100 compact-card">
        <div class="pa-3 border-b">
          <h5 class="text-subtitle-2 font-weight-bold">Analisa Laba Rugi</h5>
        </div>
        <div class="pa-2 d-flex align-center justify-center" style="min-height: 300px;">
          <apexchart type="donut" width="100%" :options="chartPLOptions" :series="chartPLSeries"></apexchart>
        </div>
      </v-card>
    </v-col>

        <v-col cols="12" md="8">
      <v-card elevation="0" rounded="lg" class="border compact-card">
        <div class="pa-3 d-flex justify-space-between align-center border-b">
          <h5 class="text-subtitle-2 font-weight-bold">Penjualan Terakhir</h5>
          <v-chip size="x-small" color="primary" variant="tonal" class="text-caption">Recent 5</v-chip>
        </div>
        <div class="pa-0">
          <v-table class="month-table compact-table" density="compact">
            <thead>
              <tr>
                <th class="text-caption font-weight-bold px-3">Pelanggan / No. Inv</th>
                <th class="text-caption font-weight-bold text-right px-3">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(inv, i) in data.recent_invoices" :key="i" class="hover:bg-grey-lighten-5 transition-colors">
                <td class="py-2 px-3">
                  <h6 class="text-caption font-weight-medium mb-0">{{ inv.customer }}</h6>
                  <div class="text-xsmall text-grey">{{ inv.number }} • {{ inv.date }}</div>
                </td>
                <td class="text-right px-3">
                  <h6 class="text-caption font-weight-bold text-grey-darken-3 mb-0">{{ fmt(inv.amount) }}</h6>
                </td>
              </tr>
              <tr v-if="data.recent_invoices.length === 0">
                <td colspan="2" class="text-center text-caption py-3">Belum ada data penjualan.</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>
    </v-col>

        <v-col cols="12" md="4">
      <v-card elevation="0" rounded="lg" class="border compact-card h-100">
        <div class="pa-3 border-b">
          <h5 class="text-subtitle-2 font-weight-bold">Pengeluaran Terakhir</h5>
        </div>
        <div class="pa-0">
          <v-list lines="two" class="py-0 small-list">
            <v-list-item v-for="(exp, i) in data.recent_expenses" :key="i" class="border-b compact-list-item">
              <template v-slot:prepend>
                <v-avatar color="red-lighten-5" size="32" class="mr-2">
                  <ArrowDownRightIcon size="16" class="text-red" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold text-caption">{{ exp.desc }}</v-list-item-title>
              <v-list-item-subtitle class="text-xsmall">{{ exp.date }}</v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-caption font-weight-bold text-red">{{ fmt(exp.amount) }}</div>
              </template>
            </v-list-item>
          </v-list>
          <div v-if="data.recent_expenses.length === 0" class="text-center text-caption py-3">
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

/* Mengatur ulang padding card secara umum */
.compact-card :deep(.v-card-title) {
    font-size: 0.9rem !important;
    padding: 10px 16px !important;
}

/* Mengatur ukuran teks pada v-card-text (summary cards) */
.small-card :deep(.text-subtitle-1) {
    font-size: 0.95rem !important; /* Dikecilkan */
}
.small-card :deep(.text-caption) {
    font-size: 0.65rem !important; /* Dikecilkan */
}

/* Mengatur tabel di bagian bawah agar kompak */
.compact-table :deep(th) {
    font-size: 0.75rem !important;
    height: 30px !important;
}
.compact-table :deep(td) {
    padding: 8px 12px !important;
    height: auto !important;
}
.compact-table :deep(.text-caption) {
    font-size: 0.75rem !important;
}
.compact-table :deep(.text-xsmall) {
    font-size: 0.65rem !important;
}

/* Mengatur list item agar kompak */
.compact-list-item {
    min-height: 50px !important;
    padding-top: 4px !important;
    padding-bottom: 4px !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
}
.compact-list-item :deep(.v-list-item-title) {
    font-size: 0.8rem !important;
}
.compact-list-item :deep(.v-list-item-subtitle) {
    font-size: 0.65rem !important;
}
.compact-list-item :deep(.v-list-item__append) {
     align-self: center;
}
.compact-list-item :deep(.text-caption) {
    font-size: 0.75rem !important;
}

/* Untuk list-item-prepend/avatar */
.compact-list-item :deep(.v-list-item__prepend) {
    align-self: center;
}
</style>