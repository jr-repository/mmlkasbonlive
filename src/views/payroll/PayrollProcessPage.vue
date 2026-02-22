<template>
  <v-row>
    <v-col cols="12">
      <BaseBreadcrumb title="Sistem Payroll Dinamis" :breadcrumbs="[{title: 'Payroll', disabled: false}, {title: 'Process', disabled: true}]"></BaseBreadcrumb>
      
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
        <div class="bg-gradient-smooth px-4 py-3">
          <div class="d-flex align-center gap-2">
            <div>
              <h2 class="text-h6 font-weight-bold text-white mb-0">Payroll Processing Center</h2>
              <div class="text-caption text-white opacity-90">Kalkulasi gaji berdasarkan komponen master dan data absensi.</div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card elevation="4" rounded="lg" class="border overflow-hidden">
        <v-tabs v-model="tab" color="primary" class="bg-grey-lighten-4 border-bottom">
          <v-tab value="generate" class="text-caption font-weight-bold"><v-icon start size="18">mdi-calculator</v-icon> Hitung Gaji</v-tab>
          <v-tab value="salary_master" class="text-caption font-weight-bold"><v-icon start size="18">mdi-account-cash</v-icon> Master Gaji</v-tab>
          <v-tab value="global_settings" class="text-caption font-weight-bold"><v-icon start size="18">mdi-cog</v-icon> Parameter</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="generate" class="pa-6">
            <div class="bg-blue-lighten-5 pa-4 rounded-lg border-dashed mb-6">
              <v-row class="align-center" dense>
                <v-col cols="12" md="4">
                  <v-label class="text-caption font-weight-bold mb-1 d-block">Periode Pembayaran</v-label>
                  <v-select v-model="period" :items="['Januari 2026', 'Februari 2026', 'Maret 2026']" variant="outlined" density="compact" hide-details bg-color="white" rounded="lg"></v-select>
                </v-col>
                <v-col cols="12" md="3" class="pt-6">
                  <v-btn color="primary" block @click="generate" :loading="loading" class="text-none font-weight-bold" prepend-icon="mdi-refresh" rounded="lg">Generate Gaji</v-btn>
                </v-col>
              </v-row>
            </div>

            <v-row v-if="payrollData.length > 0" class="mb-6">
              <v-col cols="12" md="4">
                <v-card variant="flat" color="primary" class="pa-4 rounded-lg bg-gradient-smooth text-white">
                  <div class="text-caption opacity-80 font-weight-bold uppercase">Total Gross</div>
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
                  <div class="text-caption opacity-80 font-weight-bold uppercase">Total Net Pay</div>
                  <div class="text-h5 font-weight-bold mt-1">{{ formatRp(totalNet) }}</div>
                </v-card>
              </v-col>
            </v-row>

            <v-table v-if="payrollData.length > 0" class="modern-table border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-gradient-smooth text-white">
                  <th class="text-caption font-weight-bold">Karyawan</th>
                  <th class="text-right text-caption font-weight-bold">Pendapatan</th>
                  <th class="text-right text-caption font-weight-bold">Lembur</th>
                  <th class="text-right text-caption font-weight-bold">Potongan</th>
                  <th class="text-right text-caption font-weight-bold">Gaji Bersih</th>
                  <th class="text-center text-caption font-weight-bold">Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in payrollData" :key="p.nik" class="hover-row">
                  <td><b>{{ p.name }}</b><br><small>{{ p.dept }}</small></td>
                  <td class="text-right">{{ formatRp(p.total_income) }}</td>
                  <td class="text-right text-success">+ {{ formatRp(p.overtime_pay) }}</td>
                  <td class="text-right text-error">- {{ formatRp(p.total_deduction + p.late_penalty + p.abs_penalty + p.bpjs) }}</td>
                  <td class="text-right font-weight-bold text-primary">{{ formatRp(p.net) }}</td>
                  <td class="text-center">
                    <v-btn icon="mdi-information-outline" variant="text" color="primary" @click="openBreakdown(p)"></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div v-if="payrollData.length > 0" class="d-flex justify-end mt-6">
              <v-btn color="success" size="large" :loading="finalizing" @click="finalize" prepend-icon="mdi-check-all" class="text-none font-weight-bold rounded-lg px-8 shadow-lg">Finalisasi & Simpan ke Laporan</v-btn>
            </div>
          </v-window-item>

          <v-window-item value="salary_master" class="pa-6 bg-grey-lighten-5">
            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4">Set Gaji Per Karyawan</h3>
            <div class="table-responsive border rounded-lg bg-white">
              <table class="dynamic-payroll-table">
                <thead>
                  <tr class="bg-grey-lighten-3">
                    <th rowspan="2" class="sticky-left">KARYAWAN</th>
                    <th :colspan="masterComps.incomes.length" class="text-center text-success bg-green-lighten-5 text-caption font-weight-bold">PENDAPATAN</th>
                    <th :colspan="masterComps.deductions.length" class="text-center text-error bg-red-lighten-5 text-caption font-weight-bold">POTONGAN</th>
                    <th rowspan="2" class="text-caption font-weight-bold">AKSI</th>
                  </tr>
                  <tr class="bg-grey-lighten-4">
                    <th v-for="c in masterComps.incomes" :key="'h-'+c.id" class="text-xsmall">{{ c.name }}</th>
                    <th v-for="c in masterComps.deductions" :key="'h-'+c.id" class="text-xsmall">{{ c.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="emp in employeeList" :key="emp.nik">
                    <td class="sticky-left bg-white"><b>{{ emp.name }}</b><br><small>{{ emp.nik }}</small></td>
                    <td v-for="c in masterComps.incomes" :key="'in-'+c.id"><input type="number" v-model="emp.salary_values[c.id]" class="salary-input"></td>
                    <td v-for="c in masterComps.deductions" :key="'de-'+c.id"><input type="number" v-model="emp.salary_values[c.id]" class="salary-input text-error"></td>
                    <td class="text-center"><v-btn size="x-small" color="primary" icon="mdi-content-save" @click="saveSalary(emp)"></v-btn></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-window-item>

          <v-window-item value="global_settings" class="pa-6">
             <h3 class="text-subtitle-1 font-weight-bold text-primary mb-6">Setting Potongan & Lembur Global</h3>
             <v-row>
              <v-col cols="12" md="6" v-for="(val, key) in globalSettings" :key="key">
                <v-label class="text-caption font-weight-bold mb-1 d-block">{{ key.replace(/_/g, ' ').toUpperCase() }}</v-label>
                <v-text-field v-model="globalSettings[key]" variant="outlined" density="compact" type="number" prefix="Rp"></v-text-field>
              </v-col>
            </v-row>
            <v-btn color="primary" class="mt-4" prepend-icon="mdi-content-save" @click="saveGlobalSettings">Simpan Parameter</v-btn>
          </v-window-item>
        </v-window>
      </v-card>

      <v-dialog v-model="breakdownDialog" max-width="500">
        <v-card v-if="selectedBreakdown" class="rounded-lg">
          <v-toolbar color="primary" density="compact" class="text-white px-4"><v-toolbar-title class="text-subtitle-1">Breakdown Gaji: {{ selectedBreakdown.name }}</v-toolbar-title></v-toolbar>
          <v-card-text class="pa-5">
            <div class="text-caption font-weight-bold text-primary mb-2 border-bottom">PENDAPATAN</div>
            <div v-for="d in selectedBreakdown.breakdown.filter(x => x.type === 'income')" :key="d.name" class="d-flex justify-space-between mb-1"><span>{{ d.name }}</span><b>{{ formatRp(d.amount) }}</b></div>
            <div class="d-flex justify-space-between text-success"><span>Lembur</span><b>+ {{ formatRp(selectedBreakdown.overtime_pay) }}</b></div>
            <div class="text-caption font-weight-bold text-error mt-4 mb-2 border-bottom">POTONGAN</div>
            <div v-for="d in selectedBreakdown.breakdown.filter(x => x.type === 'deduction')" :key="d.name" class="d-flex justify-space-between mb-1"><span>{{ d.name }}</span><b>- {{ formatRp(d.amount) }}</b></div>
            <div class="d-flex justify-space-between text-error"><span>Penalty (Late/Absen)</span><b>- {{ formatRp(selectedBreakdown.late_penalty + selectedBreakdown.abs_penalty) }}</b></div>
            <div class="d-flex justify-space-between text-error"><span>BPJS</span><b>- {{ formatRp(selectedBreakdown.bpjs) }}</b></div>
            <v-divider class="my-4"></v-divider>
            <div class="d-flex justify-space-between text-h6 font-weight-bold"><span>NET SALARY</span><span class="text-primary">{{ formatRp(selectedBreakdown.net) }}</span></div>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';

const API_BASE = 'https://multimitralogistik.id/Backend/Api/Payroll/Process';

const tab = ref('generate');
const period = ref('Februari 2026');
const payrollData = ref([]);
const employeeList = ref([]);
const globalSettings = ref({});
const masterComps = reactive({ incomes: [], deductions: [] });
const loading = ref(false);
const finalizing = ref(false);
const breakdownDialog = ref(false);
const selectedBreakdown = ref(null);

// Menghitung Ringkasan Total
const totalGross = computed(() => payrollData.value.reduce((acc, p) => acc + (p.total_income + p.overtime_pay), 0));
const totalDeduction = computed(() => payrollData.value.reduce((acc, p) => acc + (p.total_deduction + p.late_penalty + p.abs_penalty + p.bpjs), 0));
const totalNet = computed(() => payrollData.value.reduce((acc, p) => acc + p.net, 0));

const loadSalaryMaster = async () => {
  const r = await fetch(`${API_BASE}/GetSalaryMaster.php`).then(res => res.json());
  if (r.s) {
    masterComps.incomes = r.d.components.filter(c => c.type === 'income');
    masterComps.deductions = r.d.components.filter(c => c.type === 'deduction');
    employeeList.value = r.d.employees;
  }
};

const loadSettings = async () => {
  const r = await fetch(`${API_BASE}/GetSettings.php`).then(res => res.json());
  if (r.s) globalSettings.value = r.d;
};

const saveSalary = async (emp) => {
  const r = await fetch(`${API_BASE}/SaveEmployeeSalary.php`, { method: 'POST', body: JSON.stringify({ nik: emp.nik, salary_values: emp.salary_values }) }).then(res => res.json());
  alert(r.message);
};

const generate = async () => {
  loading.value = true;
  const r = await fetch(`${API_BASE}/Generate.php`, { method: 'POST', body: JSON.stringify({ period: period.value }) }).then(res => res.json());
  if (r.s) payrollData.value = r.d;
  loading.value = false;
};

// --- FUNGSI SAVE / FINALIZE ---
const finalize = async () => {
  if (payrollData.value.length === 0) return;
  if (!confirm("Apakah anda yakin ingin memfinalisasi data payroll periode " + period.value + "? Data akan disimpan permanen ke laporan.")) return;

  finalizing.value = true;
  try {
    const payload = {
      period: period.value,
      total_gross: totalGross.value,
      total_deduction: totalDeduction.value,
      total_net: totalNet.value,
      details: payrollData.value // Mengirim detail hasil kalkulasi
    };

    const res = await fetch(`${API_BASE}/Finalize.php`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.s) {
      alert("Berhasil! Payroll telah disimpan ke database laporan.");
      payrollData.value = []; // Reset setelah simpan
    } else {
      alert("Gagal: " + res.message);
    }
  } catch (e) {
    alert("Kesalahan koneksi ke server.");
  } finally {
    finalizing.value = false;
  }
};

const openBreakdown = (p) => { selectedBreakdown.value = p; breakdownDialog.value = true; };
const saveGlobalSettings = async () => {
  const r = await fetch(`${API_BASE}/SaveSettings.php`, { method: 'POST', body: JSON.stringify(globalSettings.value) }).then(res => res.json());
  alert(r.message);
};
const formatRp = (v) => 'Rp ' + Number(v).toLocaleString('id-ID');

onMounted(() => {
  loadSalaryMaster();
  loadSettings();
});
</script>

<style scoped>
.dynamic-payroll-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
.dynamic-payroll-table th, .dynamic-payroll-table td { border: 1px solid #ddd; padding: 8px; white-space: nowrap; }
.salary-input { width: 90px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; text-align: right; }
.sticky-left { position: sticky; left: 0; z-index: 10; border-right: 2px solid #ddd !important; }
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 100%); }
.bg-gradient-danger { background: linear-gradient(135deg, #D32F2F 0%, #EF5350 100%); }
.bg-gradient-success { background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%); }
.border-dashed { border: 1px dashed #90CAF9 !important; }
.text-xsmall { font-size: 0.65rem; }
</style>