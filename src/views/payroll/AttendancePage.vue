<script setup>
import { ref, onMounted, reactive } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { 
  CloudUploadIcon, 
  HistoryIcon, 
  FileSpreadsheetIcon, 
  DownloadIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  AlertCircleIcon,
  XIcon,
  TrashIcon, // Tambahan icon baru
  CheckIcon
} from 'vue-tabler-icons';

const API = 'https://multimitralogistik.id/Backend/Api/Payroll/Attendance';
const TEMPLATE_URL = `${API}/DownloadTemplate.php`;

// --- STATE ---
const file = ref(null);
const loading = ref(false);
const logs = ref([]);
const exRows = ref([]);
const details = reactive({});
const errs = ref([]);
const errDialog = ref(false);

// --- METHODS ---
const load = async () => {
  const r = await fetch(`${API}/List.php`).then(res => res.json());
  if (r.s) logs.value = r.d;
};

const toggle = async (id) => {
  const i = exRows.value.indexOf(id);
  if (i > -1) exRows.value.splice(i, 1);
  else {
    exRows.value.push(id);
    if (!details[id]) {
      const r = await fetch(`${API}/Detail.php?sync_id=${id}`).then(res => res.json());
      if (r.s) details[id] = r.d;
    }
  }
};

const isEx = (id) => exRows.value.includes(id);

const uploadFile = async () => {
  if (!file.value) return;
  loading.value = true;
  const fd = new FormData();
  fd.append('file', file.value[0] || file.value);
  try {
    const r = await fetch(`${API}/Sync.php`, { method: 'POST', body: fd }).then(res => res.json());
    if (r.s) {
      if (r.errors && r.errors.length > 0) { 
        errs.value = r.errors; 
        errDialog.value = true; 
      }
      file.value = null;
      await load();
      if (logs.value.length > 0) toggle(logs.value[0].id);
    } else alert(r.message);
  } catch (e) { 
    alert("Server Error"); 
  } finally { 
    loading.value = false; 
  }
};

const downloadLog = (id) => {
  window.open(`${API}/Download.php?id=${id}`, '_blank');
};

const deleteLog = async (id) => {
  if (!confirm("Apakah Anda yakin ingin menghapus riwayat ini? File di server dan data absensi terkait akan dihapus permanen.")) return;
  
  try {
    const r = await fetch(`${API}/Delete.php`, { 
      method: 'POST', 
      body: JSON.stringify({ id }) 
    }).then(res => res.json());
    
    if (r.s) {
      alert(r.message);
      await load();
    } else alert(r.message);
  } catch (e) {
    alert("Gagal menghapus data.");
  }
};

const formatDate = (s) => new Date(s).toLocaleString('id-ID', { 
  day: '2-digit', 
  month: 'short', 
  year: 'numeric',
  hour: '2-digit', 
  minute: '2-digit' 
});

onMounted(load);
</script>

<template>
  <v-row>
    <v-col cols="12">
      <BaseBreadcrumb title="Absensi Fingerprint" :breadcrumbs="[{title: 'Payroll', disabled: false}, {title: 'Absensi', disabled: true}]"></BaseBreadcrumb>
      
      <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
        <div class="bg-gradient-smooth px-4 py-3">
          <div class="d-flex align-center gap-2">
            <div>
              <h2 class="text-h6 font-weight-bold text-white mb-0">Attendance Synchronization</h2>
              <div class="text-caption text-white opacity-90">
                Sync fingerprint data with system records based on Name and Department.
              </div>
            </div>
          </div>
        </div>
      </v-card>

      <v-row>
        <v-col cols="12" md="4">
          <v-card elevation="4" rounded="lg" class="border overflow-hidden h-100">
            <div class="bg-gradient-smooth px-4 py-3 d-flex align-center">
              <CloudUploadIcon size="18" class="text-white mr-2" />
              <h3 class="text-subtitle-1 font-weight-bold text-white">Import Absensi</h3>
            </div>
            
            <v-card-text class="pa-6 bg-grey-lighten-5 h-100">
              <div class="mb-4 bg-blue-lighten-5 pa-3 rounded-lg border-dashed">
                <p class="text-caption text-blue-darken-3 mb-0">
                  Pastikan file Excel menggunakan format terbaru. Sistem akan mencocokkan <b>Nama</b> dan <b>Departemen</b> secara otomatis.
                </p>
              </div>

              <v-label class="mb-2 text-caption font-weight-bold text-grey-darken-2">Pilih File Excel (.xlsx)</v-label>
              <v-file-input 
                v-model="file" 
                variant="outlined" 
                density="compact" 
                accept=".xlsx" 
                prepend-icon="" 
                color="primary"
                bg-color="white"
                prepend-inner-icon="mdi-file-excel" 
                placeholder="Upload file fingerprint"
                hide-details 
                class="mb-4 small-input"
              ></v-file-input>

              <v-btn 
                :loading="loading" 
                color="primary" 
                block 
                elevation="2"
                class="text-none font-weight-bold mb-3"
                @click="uploadFile" 
                :disabled="!file"
              >
                <CloudUploadIcon size="18" class="mr-2"/> Proses Import Data
              </v-btn>

              <v-divider class="my-4"></v-divider>

              <v-btn 
                variant="text" 
                color="secondary" 
                block 
                class="text-none text-caption font-weight-medium" 
                :href="TEMPLATE_URL" 
                target="_blank"
              >
                <DownloadIcon size="16" class="mr-1"/> Download Format Template
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card elevation="4" rounded="lg" class="border overflow-hidden">
            <div class="bg-gradient-smooth px-4 py-3 d-flex align-center">
              <HistoryIcon size="18" class="text-white mr-2" />
              <h3 class="text-subtitle-1 font-weight-bold text-white">Riwayat Sinkronisasi</h3>
            </div>

            <v-table density="compact" class="compact-data-table modern-table hover">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th width="40"></th>
                  <th class="text-caption font-weight-bold text-uppercase py-2">Waktu Upload</th>
                  <th class="text-caption font-weight-bold text-uppercase py-2">Nama File</th>
                  <th class="text-caption font-weight-bold text-uppercase py-2 text-right">Total Berhasil</th>
                  <th class="text-caption font-weight-bold text-uppercase py-2 text-center" width="100">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="log in logs" :key="log.id">
                  <tr class="log-row">
                    <td @click="toggle(log.id)" style="cursor: pointer">
                      <component :is="isEx(log.id) ? ChevronDownIcon : ChevronRightIcon" size="18" class="text-primary" />
                    </td>
                    <td class="text-caption text-medium-emphasis" @click="toggle(log.id)" style="cursor: pointer">{{ formatDate(log.created_at) }}</td>
                    <td @click="toggle(log.id)" style="cursor: pointer">
                      <div class="d-flex align-center">
                        <FileSpreadsheetIcon size="16" class="mr-2 text-success" />
                        <span class="text-caption font-weight-medium">{{ log.file_name }}</span>
                      </div>
                    </td>
                    <td class="text-right" @click="toggle(log.id)" style="cursor: pointer">
                      <v-chip size="x-small" color="success" variant="tonal" class="font-weight-bold">
                        {{ log.total_rows }} Rows
                      </v-chip>
                    </td>
                    <td class="text-center">
                      <div class="d-flex justify-center gap-1">
                        <v-btn icon size="x-small" variant="text" color="primary" @click="downloadLog(log.id)">
                          <DownloadIcon size="16" />
                        </v-btn>
                        <v-btn icon size="x-small" variant="text" color="error" @click="deleteLog(log.id)">
                          <TrashIcon size="16" />
                        </v-btn>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="isEx(log.id)">
                    <td colspan="5" class="pa-4 bg-grey-lighten-5">
                      <v-card variant="outlined" class="rounded-lg bg-white overflow-hidden">
                        <v-table density="compact" class="inner-table">
                          <thead>
                            <tr class="bg-blue-grey-lighten-5">
                              <th class="text-xsmall font-weight-bold">Nama Karyawan</th>
                              <th class="text-xsmall font-weight-bold">Dept</th>
                              <th class="text-xsmall font-weight-bold text-center">Terlambat</th>
                              <th class="text-xsmall font-weight-bold text-center">Absen</th>
                              <th class="text-xsmall font-weight-bold text-center">Lembur</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="d in details[log.id]" :key="d.id">
                              <td class="text-caption font-weight-bold">{{ d.name }}</td>
                              <td><v-chip size="x-small" variant="flat" color="grey-lighten-3" class="text-caption">{{ d.dept }}</v-chip></td>
                              <td class="text-center text-caption">{{ d.late_min }}m</td>
                              <td class="text-center text-caption text-error font-weight-bold">{{ d.absence_days }}h</td>
                              <td class="text-center text-caption text-success font-weight-bold">{{ d.overtime_hours }}j</td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-card>
                    </td>
                  </tr>
                </template>
                <tr v-if="logs.length === 0">
                  <td colspan="5" class="text-center py-10 text-caption text-medium-emphasis">Belum ada riwayat sinkronisasi.</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <v-dialog v-model="errDialog" max-width="500" transition="dialog-bottom-transition">
    <v-card class="rounded-lg overflow-hidden small-dialog-card">
      <div class="bg-gradient-danger px-4 py-3 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <div class="bg-white rounded-circle pa-1 d-flex">
            <AlertCircleIcon size="16" class="text-error" />
          </div>
          <span class="text-subtitle-1 font-weight-bold text-white">Kesalahan Validasi</span>
        </div>
        <v-btn icon variant="text" color="white" size="small" @click="errDialog = false">
          <XIcon size="18" />
        </v-btn>
      </div>

      <v-card-text class="pa-5 bg-grey-lighten-5">
        <p class="text-caption font-weight-medium mb-3">Data berikut gagal disimpan karena Nama & Dept tidak cocok di database:</p>
        <v-list density="compact" class="bg-white border rounded-lg max-h-300 overflow-y-auto">
          <v-list-item v-for="(e, i) in errs" :key="i">
            <template v-slot:prepend>
              <XIcon size="14" class="text-error mr-2"/>
            </template>
            <v-list-item-title class="text-caption">{{ e }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="bg-white pa-3">
        <v-spacer></v-spacer>
        <v-btn color="error" variant="flat" size="small" class="px-6 text-none font-weight-bold" @click="errDialog = false">Tutup</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Tambahkan style untuk gap agar tombol aksi tidak menempel */
.gap-1 {
  gap: 4px;
}
/* Style lainnya tetap sama seperti kode Anda sebelumnya */
.bg-gradient-smooth { background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%); }
.bg-gradient-danger { background: linear-gradient(135deg, #D32F2F 0%, #EF5350 60%, #FFCDD2 100%); }
.border-dashed { border: 1px dashed #90CAF9 !important; }
.compact-data-table :deep(th) { height: 40px !important; font-size: 0.75rem !important; }
.compact-data-table :deep(td) { height: 44px !important; font-size: 0.75rem !important; }
.log-row:hover { background-color: #f1f5f9 !important; }
.inner-table :deep(th) { background-color: #f8fafc; height: 32px !important; }
.small-input :deep(.v-field) { border-radius: 8px; }
.text-xsmall { font-size: 0.65rem !important; }
.max-h-300 { max-height: 300px; }
.gap-2 { gap: 8px; }
</style>