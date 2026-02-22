<template>
  <v-row>
    <v-col cols="12">
      <BaseBreadcrumb title="Laporan & Slip Gaji" :breadcrumbs="[{title: 'Payroll', disabled: false}, {title: 'Report', disabled: true}]"></BaseBreadcrumb>
      
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

      <v-card elevation="4" rounded="lg" class="border overflow-hidden">
        <v-tabs v-model="tab" color="primary" class="bg-grey-lighten-4 border-bottom">
          <v-tab value="history" class="text-caption font-weight-bold">
            <span class="mr-2">🕒</span> Riwayat Payroll
          </v-tab>
          <v-tab value="slips" class="text-caption font-weight-bold" :disabled="!selectedHistory">
            <span class="mr-2">📄</span> Slip Gaji Detail 
            <v-chip v-if="selectedHistory" size="x-small" color="primary" class="ml-2 font-weight-bold" variant="flat">
              {{ selectedHistory.period_month }}
            </v-chip>
          </v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="history" class="pa-6">
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="d-flex align-center">
                <span class="mr-2" style="font-size: 20px;">📁</span>
                <h3 class="text-subtitle-1 font-weight-bold text-primary">Daftar Laporan Terfinalisasi</h3>
              </div>
              <v-btn variant="tonal" color="primary" size="small" @click="loadHistory" :loading="historyLoading">
                <span>🔄 Refresh</span>
              </v-btn>
            </div>

            <v-table density="compact" class="modern-table border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-gradient-smooth">
                  <th class="text-caption text-white font-weight-bold">Periode</th>
                  <th class="text-caption text-white font-weight-bold">Tanggal Final</th>
                  <th class="text-caption text-white font-weight-bold text-right">Total Gross</th>
                  <th class="text-caption text-white font-weight-bold text-right">Total Potongan</th>
                  <th class="text-caption text-white font-weight-bold text-right">Net Salary</th>
                  <th class="text-caption text-white font-weight-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="historyLoading">
                  <td colspan="6" class="text-center py-10">
                    <v-progress-circular indeterminate color="primary" size="30"></v-progress-circular>
                  </td>
                </tr>
                <tr v-else-if="history.length === 0">
                  <td colspan="6" class="text-center py-10 text-grey text-caption">Belum ada riwayat payroll.</td>
                </tr>
                <tr v-for="h in history" :key="h.id" class="hover-row">
                  <td class="font-weight-bold text-caption">{{ h.period_month }}</td>
                  <td class="text-caption">{{ formatDate(h.cutoff_date) }}</td>
                  <td class="text-right text-caption">{{ formatPrice(h.total_gross) }}</td>
                  <td class="text-right text-caption text-error">{{ formatPrice(h.total_deduction) }}</td>
                  <td class="text-right text-caption font-weight-bold text-primary">{{ formatPrice(h.total_net) }}</td>
                  <td class="text-center">
                    <div class="d-flex justify-center align-center gap-2">
                      <v-btn size="x-small" color="primary" variant="flat" class="text-none font-weight-bold px-3" @click="selectPeriod(h)">Pilih & Buka</v-btn>
                      <v-btn size="small" color="success" variant="flat" class="text-none font-weight-bold" :href="`${API_REKAP}?id=${h.id}`" target="_blank">📗 EXCEL</v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-window-item>

          <v-window-item value="slips" class="pa-6">
            <div v-if="selectedHistory">
                <div class="bg-blue-lighten-5 pa-4 rounded-lg border-dashed mb-6 d-flex flex-column flex-md-row justify-space-between align-md-center gap-4">
                    <div>
                        <h3 class="text-subtitle-1 font-weight-bold text-blue-darken-3 mb-1">Rincian Slip: {{ selectedHistory.period_month }}</h3>
                        <p class="text-xsmall text-blue-darken-2 mb-0">Daftar rincian gaji final untuk seluruh karyawan.</p>
                    </div>
                    <v-text-field v-model="search" placeholder="🔍 Cari Nama / NIK..." density="compact" hide-details variant="flat" bg-color="white" rounded="pill" style="max-width: 300px;" class="small-input border"></v-text-field>
                </div>

                <v-table density="compact" class="modern-table border rounded-lg overflow-hidden">
                    <thead>
                        <tr class="bg-grey-lighten-4">
                            <th class="text-caption font-weight-bold">INFO KARYAWAN</th>
                            <th class="text-caption font-weight-bold text-right">GAPOK</th>
                            <th class="text-caption font-weight-bold text-right">TUNJANGAN</th>
                            <th class="text-caption font-weight-bold text-right">LEMBUR</th>
                            <th class="text-caption font-weight-bold text-right">POTONGAN</th>
                            <th class="text-caption font-weight-bold text-right">NET SALARY</th>
                            <th class="text-caption font-weight-bold text-center">SLIP</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="detailsLoading"><td colspan="7" class="text-center py-10"><v-progress-circular indeterminate color="primary"></v-progress-circular></td></tr>
                        <tr v-for="d in filteredDetails" :key="d.id" class="hover-row">
                            <td>
                                <div class="py-1">
                                  <div class="font-weight-bold text-caption">{{ d.name }}</div>
                                  <div class="text-xsmall text-primary font-weight-medium">NIK: {{ d.nik }} • {{ d.dept }}</div>
                                </div>
                            </td>
                            <td class="text-right text-caption">{{ formatPrice(d.basic_salary) }}</td>
                            <td class="text-right text-caption">{{ formatPrice(d.allowances) }}</td>
                            <td class="text-right text-caption text-success font-weight-bold">+{{ formatPrice(d.overtime_pay) }}</td>
                            <td class="text-right text-caption text-error font-weight-bold">-{{ formatPrice(Number(d.attendance_penalty) + Number(d.deductions)) }}</td>
                            <td class="text-right font-weight-bold text-subtitle-2 text-primary">{{ formatPrice(d.net_salary) }}</td>
                            <td class="text-center">
                                <v-btn color="error" variant="tonal" size="small" class="text-none font-weight-bold" :href="`${API_SLIP}?detail_id=${d.id}`" target="_blank">📕 PDF</v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </div>
          </v-window-item>
        </v-window>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';

const API_BASE = 'https://multimitralogistik.id/Backend/Api/Payroll/Report';
const API_REKAP = `${API_BASE}/ExportExcel.php`;
const API_SLIP = `${API_BASE}/ExportSlip.php`;

const tab = ref('history');
const history = ref([]);
const details = ref([]);
const selectedHistory = ref(null);
const search = ref('');
const historyLoading = ref(false);
const detailsLoading = ref(false);

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    const response = await fetch(`${API_BASE}/GetHistory.php`).then(res => res.json());
    if (response.s) history.value = response.d;
  } catch (error) { console.error(error); }
  finally { historyLoading.value = false; }
};

const selectPeriod = async (h) => {
  selectedHistory.value = h;
  tab.value = 'slips';
  detailsLoading.value = true;
  try {
    const response = await fetch(`${API_BASE}/GetDetails.php?id=${h.id}`).then(res => res.json());
    if (response.s) details.value = response.d;
  } catch (error) { console.error(error); }
  finally { detailsLoading.value = false; }
};

const filteredDetails = computed(() => {
  if (!details.value) return [];
  return details.value.filter(d => d.name.toLowerCase().includes(search.value.toLowerCase()) || d.nik.includes(search.value));
});

const formatPrice = (value) => 'Rp ' + Number(value).toLocaleString('id-ID');
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
};
onMounted(loadHistory);
</script>

<style scoped>
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.border-dashed { border: 1px dashed #90CAF9 !important; }
.border-bottom { border-bottom: 1px solid #e0e0e0; }
.modern-table :deep(th) { height: 42px !important; font-size: 0.75rem !important; }
.modern-table :deep(td) { height: 48px !important; font-size: 0.75rem !important; }
.hover-row:hover { background-color: #f8fafc !important; }
.text-xsmall { font-size: 0.65rem !important; }
.gap-2 { gap: 8px; }
</style>