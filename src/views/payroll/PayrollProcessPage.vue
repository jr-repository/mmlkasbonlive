<template>
  <v-row>
    <v-col cols="12">      
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
        <div class="bg-gradient-smooth px-4 py-3">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <div>
                <h2 class="text-h6 font-weight-bold text-white mb-0">Payroll Processing Center</h2>
                <div class="text-caption text-white opacity-90">Kalkulasi gaji berdasarkan komponen master dan data absensi.</div>
              </div>
            </div>
            
            <div v-if="tab === 'salary_master'" class="d-flex gap-2">
              <v-btn color="white" variant="flat" size="small" class="text-none font-weight-bold text-primary" prepend-icon="mdi-download" @click="downloadTemplate">
                Download Template
              </v-btn>
              <v-btn color="white" variant="outlined" size="small" class="text-none font-weight-bold" prepend-icon="mdi-upload" @click="$refs.fileInput.click()">
                Import Excel
              </v-btn>
              <input type="file" ref="fileInput" class="d-none" accept=".xlsx, .xls" @change="handleImport">
            </div>
          </div>
        </div>
      </v-card>

      <v-card elevation="4" rounded="lg" class="border overflow-hidden">
        <v-tabs v-model="tab" color="primary" class="bg-grey-lighten-4 border-bottom">
          <v-tab value="generate" class="text-caption font-weight-bold"><v-icon start size="18">mdi-calculator</v-icon> Hitung Gaji</v-tab>
          <v-tab value="salary_master" class="text-caption font-weight-bold"><v-icon start size="18">mdi-account-cash</v-icon> Master Gaji & Parameter Individu</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="generate" class="pa-6">
            <div class="bg-blue-lighten-5 pa-4 rounded-lg border-dashed mb-6">
              <v-row class="align-center" dense>
                <v-col cols="12" md="4">
                  <v-label class="text-caption font-weight-bold mb-1 d-block">Periode Pembayaran</v-label>
                  <v-select 
                    v-model="period" 
                    :items="availablePeriods" 
                    :placeholder="availablePeriods.length === 0 ? 'Tidak ada data absensi pending' : 'Pilih Periode'"
                    :disabled="availablePeriods.length === 0"
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
                    :disabled="availablePeriods.length === 0 || !period"
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
                    <v-btn variant="text" size="small" @click="openBreakdown(p)" title="Lihat Breakdown">
                      <span class="text-h6">👁️</span>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div v-if="payrollData.length > 0" class="d-flex justify-end mt-6">
              <v-btn color="success" size="large" :loading="finalizing" @click="finalize" prepend-icon="mdi-check-all" class="text-none font-weight-bold rounded-lg px-8 shadow-lg">Finalisasi & Simpan ke Laporan</v-btn>
            </div>
          </v-window-item>

          <v-window-item value="salary_master" class="pa-6 bg-grey-lighten-5">
            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4">Master Gaji & Parameter Per Karyawan</h3>
            
            <div class="table-responsive border rounded-lg bg-white">
              <table class="dynamic-payroll-table hover">
                <thead>
                  <tr class="bg-grey-lighten-3">
                    <th rowspan="2" class="sticky-left">KARYAWAN</th>
                    <th :colspan="masterComps.incomes.length" class="text-center text-success bg-green-lighten-5 text-caption font-weight-bold">PENDAPATAN</th>
                    <th :colspan="masterComps.deductions.length" class="text-center text-error bg-red-lighten-5 text-caption font-weight-bold">POTONGAN</th>
                    <th colspan="4" class="text-center text-primary bg-blue-lighten-5 text-caption font-weight-bold">PARAMETER INDIVIDU</th>
                    <th rowspan="2" class="text-caption font-weight-bold text-center sticky-right">AKSI</th>
                  </tr>
                  <tr class="bg-grey-lighten-4">
                    <th v-for="c in masterComps.incomes" :key="'h-'+c.id" class="text-xsmall">{{ c.name }}</th>
                    <th v-for="c in masterComps.deductions" :key="'h-'+c.id" class="text-xsmall">{{ c.name }}</th>
                    <th class="text-xsmall bg-blue-lighten-5">Tarif Lembur/Hari</th>
                    <th class="text-xsmall bg-blue-lighten-5">Pot. Absen/Hari</th>
                    <th class="text-xsmall bg-blue-lighten-5">Pot. Telat/Menit</th>
                    <th class="text-xsmall bg-blue-lighten-5">BPJS Fixed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="emp in employeeList" :key="emp.nik" class="hover-row">
                    <td class="sticky-left bg-white"><b>{{ emp.name }}</b><br><small class="text-primary">{{ emp.nik }} • {{ emp.dept }}</small></td>
                    <td v-for="c in masterComps.incomes" :key="'in-'+c.id" class="text-right text-caption">
                      {{ formatRp(emp.salary_values[c.id] || 0) }}
                    </td>
                    <td v-for="c in masterComps.deductions" :key="'de-'+c.id" class="text-right text-caption text-error">
                      {{ formatRp(emp.salary_values[c.id] || 0) }}
                    </td>
                    <td class="text-right text-caption text-success">{{ formatRp(emp.overtime_rate || 0) }}</td>
                    <td class="text-right text-caption text-error">{{ formatRp(emp.absent_rate || 0) }}</td>
                    <td class="text-right text-caption text-error">{{ formatRp(emp.late_rate || 0) }}</td>
                    <td class="text-right text-caption text-error">{{ formatRp(emp.bpjs_amount || 0) }}</td>
                    <td class="text-center sticky-right bg-white">
                      <div class="d-flex justify-center gap-1">
                        <v-btn variant="text" size="small" @click="openEditDialog(emp)" title="Edit Data">
                          <span class="text-h6">✏️</span>
                        </v-btn>
                        <v-btn variant="text" size="small" @click="openSimulateDialog(emp)" title="Simulasi Net Salary">
                          <span class="text-h6">🧮</span>
                        </v-btn>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="employeeList.length === 0">
                    <td :colspan="masterComps.incomes.length + masterComps.deductions.length + 6" class="text-center py-8 text-caption text-grey">Loading data karyawan...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-window-item>
        </v-window>
      </v-card>

      <v-dialog v-model="breakdownDialog" max-width="500" scrollable>
        <v-card v-if="selectedBreakdown" class="rounded-lg overflow-hidden" max-height="85vh">
          <v-toolbar color="primary" density="compact" class="text-white px-4">
            <v-icon start>mdi-information-outline</v-icon>
            <v-toolbar-title class="text-subtitle-1">Breakdown Gaji: {{ selectedBreakdown.name }}</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text class="pa-5" style="overflow-y: auto;">
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

      <v-dialog v-model="editDialog" max-width="800" persistent scrollable>
        <v-card class="rounded-lg overflow-hidden" v-if="editForm" max-height="85vh">
          <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="white" class="mr-2">mdi-pencil</v-icon>
              <h3 class="text-subtitle-1 font-weight-bold text-white mb-0">Edit Gaji: {{ editForm.name }} ({{ editForm.nik }})</h3>
            </div>
            <v-btn icon variant="text" color="white" size="small" @click="editDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <v-card-text class="pa-4 bg-grey-lighten-5" style="overflow-y: auto;">
            <v-row>
              <v-col cols="12" md="6" class="border-right">
                <h4 class="text-caption font-weight-bold text-primary mb-3"><v-icon size="small" class="mr-1">mdi-cash-plus</v-icon> Komponen Pendapatan</h4>
                <div v-for="c in masterComps.incomes" :key="'edit-in-'+c.id" class="mb-3">
                  <v-label class="text-xsmall font-weight-bold mb-1 d-block">{{ c.name }}</v-label>
                  <v-text-field v-model="editForm.salary_values[c.id]" type="number" variant="outlined" density="compact" prefix="Rp" hide-details class="bg-white small-input"></v-text-field>
                </div>

                <v-divider class="my-4"></v-divider>

                <h4 class="text-caption font-weight-bold text-error mb-3"><v-icon size="small" class="mr-1">mdi-cash-minus</v-icon> Komponen Potongan</h4>
                <div v-for="c in masterComps.deductions" :key="'edit-de-'+c.id" class="mb-3">
                  <v-label class="text-xsmall font-weight-bold mb-1 d-block">{{ c.name }}</v-label>
                  <v-text-field v-model="editForm.salary_values[c.id]" type="number" variant="outlined" density="compact" prefix="Rp" hide-details class="bg-white small-input text-error-input"></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <h4 class="text-caption font-weight-bold text-info mb-3"><v-icon size="small" class="mr-1">mdi-account-cog</v-icon> Parameter Individu</h4>
                
                <div class="mb-3">
                  <v-label class="text-xsmall font-weight-bold mb-1 d-block text-success">Tarif Lembur (Per Hari)</v-label>
                  <v-text-field v-model="editForm.overtime_rate" type="number" variant="outlined" density="compact" prefix="Rp" hide-details class="bg-white small-input"></v-text-field>
                </div>
                
                <div class="mb-3">
                  <v-label class="text-xsmall font-weight-bold mb-1 d-block text-error">Potongan Absen (Per Hari)</v-label>
                  <v-text-field v-model="editForm.absent_rate" type="number" variant="outlined" density="compact" prefix="Rp" hide-details class="bg-white small-input"></v-text-field>
                </div>

                <div class="mb-3">
                  <v-label class="text-xsmall font-weight-bold mb-1 d-block text-error">Potongan Telat (Per Menit)</v-label>
                  <v-text-field v-model="editForm.late_rate" type="number" variant="outlined" density="compact" prefix="Rp" hide-details class="bg-white small-input"></v-text-field>
                </div>

                <div class="mb-3">
                  <v-label class="text-xsmall font-weight-bold mb-1 d-block text-error">Iuran BPJS (Fixed)</v-label>
                  <v-text-field v-model="editForm.bpjs_amount" type="number" variant="outlined" density="compact" prefix="Rp" hide-details class="bg-white small-input"></v-text-field>
                </div>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider></v-divider>
          <v-card-actions class="pa-3 bg-white">
            <v-spacer></v-spacer>
            <v-btn color="secondary" variant="outlined" size="small" @click="editDialog = false" class="text-none">Batal</v-btn>
            <v-btn color="primary" variant="flat" size="small" :loading="savingEdit" @click="saveEdit" class="text-none px-6">Simpan Perubahan</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="simulateDialog" max-width="500" transition="dialog-bottom-transition" scrollable>
        <v-card v-if="simData" class="rounded-lg overflow-hidden" max-height="85vh">
          
          <div class="bg-gradient-smooth px-4 py-3 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="white" class="mr-2">mdi-calculator</v-icon>
              <h3 class="text-subtitle-1 font-weight-bold text-white mb-0">Simulasi Gaji: {{ simData.name }}</h3>
            </div>
            <v-btn icon variant="text" color="white" size="small" @click="simulateDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <v-card-text class="pa-5 bg-grey-lighten-5" style="overflow-y: auto;">
            
            <div class="bg-white pa-4 rounded-lg border mb-4 shadow-sm">
              <div class="text-caption font-weight-bold text-grey-darken-2 mb-2 text-uppercase d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-calendar-clock</v-icon> Asumsi Absensi (Dummy)
              </div>
              <v-divider class="border-dashed mb-3"></v-divider>
              <v-row dense class="text-caption">
                <v-col cols="6" class="d-flex justify-space-between pr-2">
                  <span class="text-grey-darken-1">Terlambat:</span> <b>{{ simData.dummy.late_min }} mnt</b>
                </v-col>
                <v-col cols="6" class="d-flex justify-space-between pl-2">
                  <span class="text-grey-darken-1">Pulang Cepat:</span> <b>{{ simData.dummy.early_min }} mnt</b>
                </v-col>
                <v-col cols="6" class="d-flex justify-space-between pr-2 mt-1">
                  <span class="text-grey-darken-1">Mangkir:</span> <b>{{ simData.dummy.absence_days }} hari</b>
                </v-col>
                <v-col cols="6" class="d-flex justify-space-between pl-2 mt-1">
                  <span class="text-grey-darken-1">Lembur:</span> <b>{{ simData.dummy.overtime_hours }} Hari</b>
                </v-col>
              </v-row>
            </div>

            <div class="bg-white pa-4 rounded-lg border mb-4 shadow-sm">
              <div class="text-caption font-weight-bold text-success mb-2 text-uppercase d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-cash-plus</v-icon> Rincian Pendapatan
              </div>
              <v-divider class="border-dashed mb-3"></v-divider>
              
              <div v-for="d in simData.incBreakdown" :key="'sim-inc-'+d.name" class="d-flex justify-space-between mb-2 text-caption">
                <span class="text-grey-darken-2">{{ d.name }}</span>
                <b class="text-success">{{ formatRp(d.amount) }}</b>
              </div>
              
              <div class="d-flex justify-space-between mb-1 text-caption">
                <span class="text-grey-darken-2">Lembur <span class="opacity-70">({{ simData.dummy.overtime_hours }} x {{ formatRp(simData.rates.overtime) }})</span></span>
                <b class="text-success">+ {{ formatRp(simData.otPay) }}</b>
              </div>
            </div>
            
            <div class="bg-white pa-4 rounded-lg border mb-4 shadow-sm">
              <div class="text-caption font-weight-bold text-error mb-2 text-uppercase d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-cash-minus</v-icon> Rincian Potongan
              </div>
              <v-divider class="border-dashed mb-3"></v-divider>
              
              <div v-for="d in simData.dedBreakdown" :key="'sim-ded-'+d.name" class="d-flex justify-space-between mb-2 text-caption">
                <span class="text-grey-darken-2">{{ d.name }}</span>
                <b class="text-error">- {{ formatRp(d.amount) }}</b>
              </div>
              
              <div class="d-flex justify-space-between mb-2 text-caption">
                <span class="text-grey-darken-2">Pot. Telat <span class="opacity-70">({{ simData.dummy.late_min }} x {{ formatRp(simData.rates.late) }})</span></span>
                <b class="text-error">- {{ formatRp(simData.latePen) }}</b>
              </div>
              
              <div class="d-flex justify-space-between mb-2 text-caption">
                <span class="text-grey-darken-2">Pot. Absen <span class="opacity-70">({{ simData.dummy.absence_days }} x {{ formatRp(simData.rates.absent) }})</span></span>
                <b class="text-error">- {{ formatRp(simData.absPen) }}</b>
              </div>

              <div class="d-flex justify-space-between mb-1 text-caption">
                <span class="text-grey-darken-2">BPJS <span class="opacity-70">(Fixed DB)</span></span>
                <b class="text-error">- {{ formatRp(simData.bpjs) }}</b>
              </div>
            </div>

            <div class="bg-gradient-smooth pa-4 rounded-lg shadow-sm text-white d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <v-icon color="white" class="mr-2">mdi-cash-multiple</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-uppercase">Net Salary</span>
              </div>
              <span class="text-h5 font-weight-bold">{{ formatRp(simData.net) }}</span>
            </div>

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
const period = ref('');
const availablePeriods = ref([]);
const payrollData = ref([]);
const employeeList = ref([]);
const masterComps = reactive({ incomes: [], deductions: [] });
const loading = ref(false);
const finalizing = ref(false);

const fileInput = ref(null);

// State untuk Modal Breakdown
const breakdownDialog = ref(false);
const selectedBreakdown = ref(null);

// State untuk Modal Edit Master Gaji
const editDialog = ref(false);
const editForm = ref(null);
const savingEdit = ref(false);

// State untuk Modal Simulasi Net Salary
const simulateDialog = ref(false);
const simData = ref(null);

// Menghitung Ringkasan Total
const totalGross = computed(() => payrollData.value.reduce((acc, p) => acc + (p.total_income + p.overtime_pay), 0));
const totalDeduction = computed(() => payrollData.value.reduce((acc, p) => acc + (p.total_deduction + p.late_penalty + p.abs_penalty + p.bpjs), 0));
const totalNet = computed(() => payrollData.value.reduce((acc, p) => acc + p.net, 0));

const loadPeriods = async () => {
  try {
    const r = await fetch(`${API_BASE}/GetAvailablePeriods.php`).then(res => res.json());
    if (r.s) {
      availablePeriods.value = r.d;
      if (availablePeriods.value.length > 0 && !period.value) {
        period.value = availablePeriods.value[0];
      } else if (availablePeriods.value.length === 0) {
        period.value = '';
      }
    }
  } catch (e) {
    console.error("Gagal load periode:", e);
  }
};

const loadSalaryMaster = async () => {
  const r = await fetch(`${API_BASE}/GetSalaryMaster.php`).then(res => res.json());
  if (r.s) {
    masterComps.incomes = r.d.components.filter(c => c.type === 'income');
    masterComps.deductions = r.d.components.filter(c => c.type === 'deduction');
    employeeList.value = r.d.employees;
  }
};

// --- FUNGSI EXCEL ---
const downloadTemplate = () => {
  window.open(`${API_BASE}/ExportTemplate.php`, '_blank');
};

const handleImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('excel_file', file);

  try {
    loading.value = true;
    const r = await fetch(`${API_BASE}/ImportSalary.php`, {
      method: 'POST',
      body: formData
    }).then(res => res.json());

    if (r.s) {
      alert(r.message);
      await loadSalaryMaster(); // Refresh data tabel
    } else {
      alert("Gagal Import: " + r.message);
    }
  } catch (e) {
    alert("Kesalahan koneksi saat import.");
  } finally {
    loading.value = false;
    event.target.value = ''; // Reset input file
  }
};

// --- FUNGSI MODAL EDIT ---
const openEditDialog = (emp) => {
  editForm.value = JSON.parse(JSON.stringify(emp));
  editDialog.value = true;
};

const saveEdit = async () => {
  savingEdit.value = true;
  try {
    const payload = {
      nik: editForm.value.nik,
      salary_values: editForm.value.salary_values,
      overtime_rate: editForm.value.overtime_rate,
      absent_rate: editForm.value.absent_rate,
      late_rate: editForm.value.late_rate,
      bpjs_amount: editForm.value.bpjs_amount
    };
    
    const r = await fetch(`${API_BASE}/SaveEmployeeSalary.php`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    }).then(res => res.json());
    
    if (r.s) {
      alert(r.message);
      const idx = employeeList.value.findIndex(x => x.nik === payload.nik);
      if (idx > -1) {
        employeeList.value[idx] = editForm.value;
      }
      editDialog.value = false;
    } else {
      alert(r.message);
    }
  } catch (e) {
    alert("Kesalahan koneksi ke server.");
  } finally {
    savingEdit.value = false;
  }
};

// --- FUNGSI MODAL SIMULASI ---
const openSimulateDialog = (emp) => {
  const dummy = { late_min: 45, early_min: 0, absence_days: 1, overtime_hours: 4 };
  let totalInc = 0; let totalDed = 0;
  const incBreakdown = []; const dedBreakdown = [];

  masterComps.incomes.forEach(c => {
    const amt = Number(emp.salary_values[c.id]) || 0;
    totalInc += amt;
    if (amt > 0) incBreakdown.push({ name: c.name, amount: amt });
  });

  masterComps.deductions.forEach(c => {
    const amt = Number(emp.salary_values[c.id]) || 0;
    totalDed += amt;
    if (amt > 0) dedBreakdown.push({ name: c.name, amount: amt });
  });

  const otPay = dummy.overtime_hours * Number(emp.overtime_rate || 0);
  const latePen = dummy.late_min * Number(emp.late_rate || 0);
  const absPen = dummy.absence_days * Number(emp.absent_rate || 0);
  const bpjs = Number(emp.bpjs_amount || 0);
  const net = (totalInc + otPay) - (totalDed + latePen + absPen + bpjs);

  simData.value = {
    name: emp.name, dummy, rates: { overtime: Number(emp.overtime_rate || 0), late: Number(emp.late_rate || 0), absent: Number(emp.absent_rate || 0) },
    incBreakdown, dedBreakdown, totalInc, totalDed, otPay, latePen, absPen, bpjs, net
  };
  simulateDialog.value = true;
};

// --- FUNGSI GENERATE & FINALIZE ---
const generate = async () => {
  if (!period.value) { alert("Silahkan pilih periode pembayaran terlebih dahulu!"); return; }
  loading.value = true;
  const r = await fetch(`${API_BASE}/Generate.php`, { method: 'POST', body: JSON.stringify({ period: period.value }) }).then(res => res.json());
  if (r.s) payrollData.value = r.d;
  loading.value = false;
};

const finalize = async () => {
  if (payrollData.value.length === 0) return;
  if (!confirm("Apakah anda yakin ingin memfinalisasi data payroll periode " + period.value + "?")) return;
  finalizing.value = true;
  try {
    const payload = { period: period.value, total_gross: totalGross.value, total_deduction: totalDeduction.value, total_net: totalNet.value, details: payrollData.value };
    const res = await fetch(`${API_BASE}/Finalize.php`, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json());
    if (res.s) { alert("Berhasil!"); payrollData.value = []; period.value = ''; await loadPeriods(); } else { alert("Gagal: " + res.message); }
  } catch (e) { alert("Kesalahan koneksi."); } finally { finalizing.value = false; }
};

const openBreakdown = (p) => { selectedBreakdown.value = p; breakdownDialog.value = true; };
const formatRp = (v) => 'Rp ' + Number(v).toLocaleString('id-ID');

onMounted(() => {
  loadPeriods();
  loadSalaryMaster();
});
</script>

<style scoped>
.table-responsive { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
.dynamic-payroll-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
.dynamic-payroll-table th, .dynamic-payroll-table td { border: 1px solid #ddd; padding: 8px; white-space: nowrap; }
.hover-row:hover td { background-color: #f8fafc !important; }
.sticky-left { position: sticky; left: 0; z-index: 10; border-right: 2px solid #ddd !important; }
.sticky-right { position: sticky; right: 0; z-index: 10; border-left: 2px solid #ddd !important; background-color: #f5f5f5; }
.dynamic-payroll-table tbody td.sticky-left, .dynamic-payroll-table tbody td.sticky-right { background-color: white !important; }
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 100%); }
.bg-gradient-danger { background: linear-gradient(135deg, #D32F2F 0%, #EF5350 100%); }
.bg-gradient-success { background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%); }
.border-dashed { border: 1px dashed #90CAF9 !important; }
.border-right { border-right: 1px solid #eee; }
.text-xsmall { font-size: 0.65rem; }
.small-input :deep(.v-field) { --v-field-padding-bottom: 4px; --v-field-padding-top: 4px; min-height: 36px !important; }
.text-error-input :deep(input) { color: #D32F2F !important; font-weight: bold; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important; }
.opacity-70 { opacity: 0.7; }
</style>