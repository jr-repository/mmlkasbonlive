<script setup lang="ts">
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue';
import { format, subDays } from 'date-fns';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import AsyncSelect from '@/components/common/AsyncSelect.vue';
import { 
  ActivityIcon, 
  SearchIcon, 
  RefreshIcon, 
  FilterIcon,
  ClickIcon,
  CoinIcon,
  TrophyIcon,
  UserIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

// --- STATE ---
const loading = ref(false);
const logs = ref<any[]>([]);
const summary = ref({ total_actions: 0, total_value: 0 });
const topUsers = ref<any[]>([]);

// Filter State
const filter = reactive({
  startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), // Default 30 hari terakhir
  endDate: format(new Date(), 'yyyy-MM-dd'),
  userId: null as number | null,
  userName: ''
});

// Debounce Timer
let filterTimeout: ReturnType<typeof setTimeout> | null = null;

// Table Headers
const headers = [
  { title: 'Waktu', key: 'created_at', align: 'start' as const, width: '150px' },
  { title: 'User', key: 'user_name', align: 'start' as const },
  { title: 'Modul', key: 'module', align: 'start' as const },
  { title: 'Aksi', key: 'action', align: 'center' as const },
  { title: 'Ref No', key: 'reference_number', align: 'start' as const },
  { title: 'Nilai Transaksi', key: 'transaction_amount', align: 'end' as const },
];

// --- METHODS ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      start_date: filter.startDate,
      end_date: filter.endDate,
      user_id: filter.userId ? String(filter.userId) : 'ALL'
    });

    const res = await fetch(`${API_BASE_URL}/Report/UserActivity.php?${params.toString()}`);
    const json = await res.json();

    if (json.s) {
      logs.value = json.d.logs;
      summary.value = json.d.summary;
      topUsers.value = json.d.top_users;
    } else {
      logs.value = [];
    }
  } catch (e) {
    console.error("Gagal memuat report", e);
  } finally {
    loading.value = false;
  }
};

const fetchReportDebounced = () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = setTimeout(fetchReport, 600);
};

// Watch Filter Changes
watch(() => [filter.startDate, filter.endDate, filter.userId], fetchReportDebounced, { deep: true });

// Helpers
const getStatusColor = (action: string) => {
  if (action === 'CREATE') return 'success';
  if (action === 'UPDATE') return 'warning';
  if (action === 'APPROVE') return 'info';
  if (action === 'REJECT') return 'error';
  return 'grey';
};

const fmtMoney = (val: number) => val ? `Rp ${Number(val).toLocaleString('id-ID')}` : '-';
const fmtDate = (val: string) => val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';

onMounted(fetchReport);

onBeforeUnmount(() => {
  if (filterTimeout) clearTimeout(filterTimeout);
});
</script>

<template>
  <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <ActivityIcon size="24" class="text-white" />
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">
            Laporan Aktivitas User
          </h2>
          <div class="text-caption text-white opacity-90">
            Monitoring kinerja dan audit trail transaksi user.
          </div>
        </div>
      </div>
    </div>
  </v-card>

  <v-row class="mt-0">
    <v-col cols="12">
      <v-card elevation="2" rounded="lg" class="border compact-card">
        <v-card-text class="pa-3">
          <div class="d-flex flex-wrap align-center gap-3">
            <div class="d-flex align-center gap-2 border pa-1 rounded bg-grey-lighten-5">
              <FilterIcon size="18" class="text-grey" />
              <input type="date" v-model="filter.startDate" class="date-input text-caption" />
              <span class="text-caption text-grey">-</span>
              <input type="date" v-model="filter.endDate" class="date-input text-caption" />
            </div>

            <div style="min-width: 250px;">
              <AsyncSelect 
                label="Filter User (Optional)"
                :apiEndpoint="`${API_BASE_URL}/Users/List.php`"
                v-model="filter.userName"
                item-title="name"
                item-value="id"
                @change="(obj: any) => { filter.userId = obj ? obj.id : null }"
                density="compact"
                hide-details
                variant="outlined"
                class="small-input"
              >
                <template v-slot:prepend-inner>
                  <UserIcon size="16" class="text-grey"/>
                </template>
              </AsyncSelect>
            </div>

            <v-spacer></v-spacer>
            <v-btn icon variant="text" size="small" @click="fetchReport" :loading="loading" title="Refresh">
              <RefreshIcon size="20" class="text-primary"/>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="3">
      <v-card elevation="2" class="pa-3 border-left-blue h-100">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-grey font-weight-bold">TOTAL AKTIVITAS</div>
            <div class="text-h5 font-weight-bold text-primary mt-1">{{ summary.total_actions }}</div>
            <div class="text-caption text-grey">Transaksi dibuat/diedit</div>
          </div>
          <v-avatar color="blue-lighten-5" rounded="lg">
            <ClickIcon size="24" class="text-primary"/>
          </v-avatar>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="4">
      <v-card elevation="2" class="pa-3 border-left-green h-100">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-grey font-weight-bold">NILAI TRANSAKSI DIPROSES</div>
            <div class="text-h5 font-weight-bold text-green mt-1">{{ fmtMoney(summary.total_value) }}</div>
            <div class="text-caption text-grey">Akumulasi nominal (Rp)</div>
          </div>
          <v-avatar color="green-lighten-5" rounded="lg">
            <CoinIcon size="24" class="text-green"/>
          </v-avatar>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card elevation="2" class="pa-3 border-left-orange h-100">
        <div class="d-flex align-center gap-2 mb-2">
          <TrophyIcon size="18" class="text-orange" />
          <span class="text-caption font-weight-bold text-grey-darken-2">TOP USER ({{ filter.startDate }} s/d {{ filter.endDate }})</span>
        </div>
        <div class="d-flex gap-2 overflow-x-auto pb-1">
          <div v-if="topUsers.length === 0" class="text-caption text-grey font-italic">Belum ada data.</div>
          <v-chip 
            v-for="(user, i) in topUsers" 
            :key="i"
            size="small" 
            color="orange-lighten-4" 
            class="text-brown font-weight-bold"
            variant="flat"
          >
            {{ i+1 }}. {{ user.user_name }} ({{ user.action_count }})
          </v-chip>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12">
      <UiParentCard title="Detail Log Aktivitas" class="compact-card">
        <v-data-table
          :headers="headers"
          :items="logs"
          :loading="loading"
          density="compact"
          class="compact-table border rounded-md"
          hover
          :items-per-page="20"
        >
          <template v-slot:item.created_at="{ item }">
            <span class="text-caption font-mono text-grey-darken-2">{{ fmtDate(item.created_at) }}</span>
          </template>

          <template v-slot:item.user_name="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="20" color="grey-lighten-3" class="mr-2">
                <span class="text-caption font-weight-bold text-grey">{{ item.user_name.charAt(0) }}</span>
              </v-avatar>
              <span class="text-caption font-weight-medium">{{ item.user_name }}</span>
            </div>
          </template>

          <template v-slot:item.module="{ item }">
            <v-chip size="x-small" variant="outlined" color="grey-darken-1" class="font-weight-bold">
              {{ item.module }}
            </v-chip>
          </template>

          <template v-slot:item.action="{ item }">
            <v-chip size="x-small" :color="getStatusColor(item.action)" variant="flat" class="font-weight-bold text-uppercase" style="min-width: 70px; justify-content: center;">
              {{ item.action }}
            </v-chip>
          </template>

          <template v-slot:item.reference_number="{ item }">
            <span class="text-caption font-weight-bold text-primary">{{ item.reference_number || '-' }}</span>
          </template>

          <template v-slot:item.transaction_amount="{ item }">
            <span v-if="Number(item.transaction_amount) > 0" class="text-caption font-weight-medium">
              {{ fmtMoney(Number(item.transaction_amount)) }}
            </span>
            <span v-else class="text-caption text-grey">-</span>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.font-mono { font-family: 'Roboto Mono', monospace; }

.border-left-blue { border-left: 4px solid #2196F3 !important; }
.border-left-green { border-left: 4px solid #4CAF50 !important; }
.border-left-orange { border-left: 4px solid #FF9800 !important; }

.date-input { border: none; outline: none; font-size: 0.8rem; width: 110px; background: transparent; }

.compact-header-card :deep(.text-h6) { font-size: 1rem !important; }
.compact-card :deep(.v-card-title) { font-size: 0.9rem !important; padding: 10px 16px !important; }
.compact-card :deep(.v-card-text) { padding: 12px 16px !important; }

/* Input Compaction */
.small-input :deep(.v-field) {
  --v-field-padding-bottom: 4px;
  --v-field-padding-top: 4px;
  min-height: 36px !important;
}
.small-input :deep(.v-label) { font-size: 0.8rem; }
.small-input :deep(input) { font-size: 0.85rem; }
.small-input :deep(.v-field__prepend-inner) { padding-top: 6px !important; }

/* Table Compaction */
.compact-table :deep(th) { font-size: 0.75rem !important; height: 36px !important; background-color: #f5f5f5; }
.compact-table :deep(td) { font-size: 0.75rem !important; height: 36px !important; padding-top: 4px !important; padding-bottom: 4px !important; }
</style>