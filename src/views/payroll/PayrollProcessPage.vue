<template>
  <v-row>
    <v-col cols="12">
      <BaseBreadcrumb title="Sistem Payroll Dinamis" :breadcrumbs="[{title: 'Payroll', disabled: false}, {title: 'Process', disabled: true}]"></BaseBreadcrumb>
      
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
        <div class="bg-gradient-smooth px-4 py-3">
          <div class="d-flex align-center gap-2">
            <div>
              <h2 class="text-h6 font-weight-bold text-white mb-0">Payroll Processing Center</h2>
              <div class="text-caption text-white opacity-90">Kalkulasi gaji, pengelolaan master upah, dan konfigurasi parameter global.</div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card elevation="4" rounded="lg" class="border overflow-hidden">
        <v-tabs v-model="tab" color="primary" class="bg-grey-lighten-4 border-bottom">
          <v-tab value="generate" class="text-caption font-weight-bold">
            <v-icon start size="18">mdi-calculator</v-icon> Hitung Gaji
          </v-tab>
          <v-tab value="salary_master" class="text-caption font-weight-bold">
            <v-icon start size="18">mdi-account-cash</v-icon> Master Gaji
          </v-tab>
          <v-tab value="global_settings" class="text-caption font-weight-bold">
            <v-icon start size="18">mdi-cog</v-icon> Parameter
          </v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="generate" class="pa-6">
            <div class="bg-blue-lighten-5 pa-4 rounded-lg border-dashed mb-6">
              <v-row class="align-center" dense>
                <v-col cols="12" md="4">
                  <v-label class="text-caption font-weight-bold mb-1 d-block">Periode Pembayaran</v-label>
                  <v-select 
                    v-model="period" 
                    :items="['Januari 2026', 'Februari 2026', 'Maret 2026']" 
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    bg-color="white"
                    rounded="lg"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="3" class="pt-6">
                  <v-btn 
                    color="primary" 
                    block 
                    @click="generate" 
                    :loading="loading" 
                    class="text-none font-weight-bold"
                    prepend-icon="mdi-refresh"
                    rounded="lg"
                  >Generate Gaji</v-btn>
                </v-col>
              </v-row>
            </div>

            <v-row v-if="payrollData.length > 0" class="mb-6">
              <v-col cols="12" md="4">
                <v-card variant="flat" color="primary" class="pa-4 rounded-lg bg-gradient-smooth text-white">
                  <div class="text-caption opacity-80 font-weight-bold uppercase">Total Gross (Kotor)</div>
                  <div class="text-h5 font-weight-bold mt-1">{{ formatRp(totalGross) }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="flat" color="error" class="pa-4 rounded-lg bg-gradient-danger text-white">
                  <div class="text-caption opacity-80 font-weight-bold uppercase">Total Potongan</div>
                  <div class="text-h5 font-weight-bold mt-1">{{ formatRp(totalDeduction) }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="flat" color="success" class="pa-4 rounded-lg bg-gradient-success text-white">
                  <div class="text-caption opacity-80 font-weight-bold uppercase">Total Net (Bersih)</div>
                  <div class="text-h5 font-weight-bold mt-1">{{ formatRp(totalNet) }}</div>
                </v-card>
              </v-col>
            </v-row>

            <v-table v-if="payrollData.length > 0" class="modern-table border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-gradient-smooth">
                  <th class="text-caption text-white font-weight-bold">Karyawan</th>
                  <th class="text-caption text-white font-weight-bold text-right">Gapok</th>
                  <th class="text-caption text-white font-weight-bold text-right">Lembur</th>
                  <th class="text-caption text-white font-weight-bold text-right">Potongan</th>
                  <th class="text-caption text-white font-weight-bold text-right">Net Salary</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in payrollData" :key="p.nik" class="hover-row">
                  <td>
                    <div class="font-weight-bold text-caption text-primary">{{ p.name }}</div>
                    <div class="text-xsmall text-grey">{{ p.dept }}</div>
                  </td>
                  <td class="text-right text-caption">{{ formatRp(p.basic) }}</td>
                  <td class="text-right text-caption text-success font-weight-medium">+ {{ formatRp(p.overtime_pay) }}</td>
                  <td class="text-right text-caption text-error">- {{ formatRp(p.late_penalty + p.abs_penalty + p.bpjs) }}</td>
                  <td class="text-right font-weight-bold text-subtitle-2 text-primary">{{ formatRp(p.net) }}</td>
                </tr>
              </tbody>
            </v-table>

            <div v-if="payrollData.length > 0" class="d-flex justify-end mt-6">
              <v-btn color="success" size="large" :loading="finalizing" @click="finalize" prepend-icon="mdi-check-all" class="text-none font-weight-bold rounded-lg px-8">Finalisasi & Simpan Laporan</v-btn>
            </div>
          </v-window-item>

          <v-window-item value="salary_master" class="pa-6 bg-grey-lighten-5">
            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4">Set Gaji Per Karyawan</h3>
            <v-table class="border rounded-lg bg-white modern-table">
              <thead>
                <tr class="bg-grey-lighten-2">
                  <th class="text-caption font-weight-bold">NAMA / NIK</th>
                  <th width="200" class="text-caption font-weight-bold">GAJI POKOK</th>
                  <th width="200" class="text-caption font-weight-bold">TUNJANGAN</th>
                  <th width="100" class="text-center text-caption font-weight-bold">AKSI</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="emp in employeeList" :key="emp.nik">
                  <td>
                    <div class="font-weight-bold text-caption">{{ emp.name }}</div>
                    <div class="text-xsmall text-grey">NIK: {{ emp.nik }}</div>
                  </td>
                  <td><v-text-field v-model="emp.basic_salary" density="compact" hide-details variant="outlined" type="number" prefix="Rp" class="small-input py-1"></v-text-field></td>
                  <td><v-text-field v-model="emp.allowance" density="compact" hide-details variant="outlined" type="number" prefix="Rp" class="small-input py-1"></v-text-field></td>
                  <td class="text-center">
                    <v-btn color="primary" size="small" icon="mdi-content-save" variant="tonal" rounded="lg" @click="saveEmpSalary(emp)"></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-window-item>

          <v-window-item value="global_settings" class="pa-6">
            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-6">Setting Potongan & Lembur Global</h3>
            <v-row>
              <v-col cols="12" md="6" v-for="(val, key) in globalSettings" :key="key">
                <v-label class="text-caption font-weight-bold mb-1 d-block">{{ key.replace(/_/g, ' ').toUpperCase() }}</v-label>
                <v-text-field v-model="globalSettings[key]" variant="outlined" density="comfortable" type="number" prefix="Rp" rounded="lg" color="primary"></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-6"></v-divider>
            <v-btn color="primary" size="large" class="text-none font-weight-bold px-10" rounded="lg" prepend-icon="mdi-content-save" @click="saveGlobalSettings">Simpan Seluruh Parameter</v-btn>
          </v-window-item>
        </v-window>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';

const API_BASE = 'https://multimitralogistik.id/Backend/Api/Payroll/Process';
const tab = ref('generate');
const period = ref('Februari 2026');
const payrollData = ref([]);
const employeeList = ref([]);
const globalSettings = ref({});
const loading = ref(false);
const finalizing = ref(false);

const totalGross = computed(() => payrollData.value.reduce((acc, p) => acc + (Number(p.basic) + Number(p.allowance) + Number(p.overtime_pay)), 0));
const totalDeduction = computed(() => payrollData.value.reduce((acc, p) => acc + (Number(p.late_penalty) + Number(p.abs_penalty) + Number(p.bpjs)), 0));
const totalNet = computed(() => payrollData.value.reduce((acc, p) => acc + Number(p.net), 0));

const loadInitial = async () => {
  try {
    const sRes = await fetch(`${API_BASE}/GetSettings.php`).then(r => r.json());
    if (sRes.s) globalSettings.value = sRes.d;
    const eRes = await fetch('https://multimitralogistik.id/Backend/Api/Payroll/Employee/List.php').then(r => r.json());
    if (eRes.s) employeeList.value = eRes.d;
  } catch (e) { console.error("Initial load error", e); }
};

const saveEmpSalary = async (emp) => {
  await fetch(`${API_BASE}/SaveEmployeeSalary.php`, { method: 'POST', body: JSON.stringify(emp) });
  alert("Gaji " + emp.name + " diperbarui.");
};

const saveGlobalSettings = async () => {
  await fetch(`${API_BASE}/SaveSettings.php`, { method: 'POST', body: JSON.stringify(globalSettings.value) });
  alert("Parameter global disimpan.");
};

const generate = async () => {
  loading.value = true;
  try {
    const r = await fetch(`${API_BASE}/Generate.php`, { method: 'POST', body: JSON.stringify({ period: period.value }) }).then(res => res.json());
    if (r.s) payrollData.value = r.d;
    else alert(r.message);
  } catch (e) { alert("Error Server"); }
  loading.value = false;
};

const finalize = async () => {
  if (payrollData.value.length === 0) return;
  if (!confirm("Apakah Anda yakin ingin memfinalisasi data ini?")) return;
  finalizing.value = true;
  try {
    const payload = { period: period.value, total_gross: totalGross.value, total_deduction: totalDeduction.value, total_net: totalNet.value, details: payrollData.value };
    const res = await fetch(`${API_BASE}/Finalize.php`, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json());
    if (res.s) { alert("Payroll Berhasil Difinalisasi!"); payrollData.value = []; } 
    else alert("Gagal: " + res.message);
  } catch (e) { alert("Kesalahan koneksi."); }
  finally { finalizing.value = false; }
};

const formatRp = (v) => 'Rp ' + Number(v).toLocaleString('id-ID');
onMounted(loadInitial);
</script>

<style scoped>
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.bg-gradient-danger { background: linear-gradient(135deg, #D32F2F 0%, #EF5350 60%, #FFCDD2 100%); }
.bg-gradient-success { background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 60%, #C8E6C9 100%); }
.border-dashed { border: 1px dashed #90CAF9 !important; }
.border-bottom { border-bottom: 1px solid #e0e0e0; }
.modern-table :deep(th) { height: 42px !important; font-size: 0.75rem !important; }
.modern-table :deep(td) { height: 48px !important; font-size: 0.75rem !important; }
.hover-row:hover { background-color: #f8fafc !important; }
.small-input :deep(.v-field) { border-radius: 8px; }
.text-xsmall { font-size: 0.65rem !important; }
.gap-2 { gap: 8px; }
.uppercase { text-transform: uppercase; letter-spacing: 0.5px; }
</style>