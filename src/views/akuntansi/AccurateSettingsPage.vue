<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
  DeviceFloppyIcon, 
  ServerIcon, 
  KeyIcon, 
  MapPinIcon, 
  PercentageIcon, 
  ShieldCheckIcon, 
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  HelpIcon,
  SettingsIcon,
  LockIcon,       // Ikon Gembok
  LockOpenIcon,   // Ikon Gembok Terbuka
  EditIcon,       // Ikon Edit
  ToolIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";
const APP_KEY = "175c2c10-d684-4ad8-ab42-e6739b7a1ea4";
const FIXED_SIGNATURE = "rC8VEMrTx1AQuS3OWhbdjYnY7SgKjnOyFeecFaDpIiuW9K8XFFhk6lKHFJhuXin0";

// --- STATE ---
const loading = ref(false);
const fetching = ref(true);
const showToken = ref(false);
const showSignature = ref(false);
const activeTab = ref('credential'); 
const isEditable = ref(false); // State baru: FALSE = Readonly (Gembok)

const config = reactive({
  api_token: "",
  signature_secret: FIXED_SIGNATURE,
  accurate_host: "",
  branch_id: "",
  warehouse_name: "",
  tax_rate: ""
});

// --- SNACKBAR ---
const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { 
  snackbar.text = text; 
  snackbar.color = color; 
  snackbar.show = true; 
};

// --- METHODS ---
const fetchSettings = async () => {
  fetching.value = true;
  isEditable.value = false; // Pastikan terkunci saat memuat pengaturan
  try {
    const res = await fetch(`${API_BASE_URL}/Settings/Get.php`);
    const json = await res.json();
    
    if (json.s && json.d) {
      config.api_token = json.d.api_token?.setting_value || "";
      config.signature_secret = FIXED_SIGNATURE; 
      config.accurate_host = json.d.accurate_host?.setting_value || "https://zeus.accurate.id";
      config.branch_id = json.d.branch_id?.setting_value || "50";
      config.warehouse_name = json.d.warehouse_name?.setting_value || "GD. JAKARTA";
      config.tax_rate = json.d.tax_rate?.setting_value || "0.11";
    }
  } catch (error) {
    showMsg("Gagal Memuat Konfigurasi. Tidak dapat terhubung ke server.", "error");
  } finally {
    fetching.value = false;
  }
};

const handleSave = async () => {
  loading.value = true;
  try {
    // Pastikan signature secret yang dikirim adalah yang fixed
    const payload = { ...config, signature_secret: FIXED_SIGNATURE };
    
    const res = await fetch(`${API_BASE_URL}/Settings/Save.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.s) {
      showMsg("Konfigurasi sistem telah diperbarui.", "success");
      isEditable.value = false; // Kunci kembali setelah berhasil menyimpan
    } else {
      throw new Error(json.message || "Gagal menyimpan");
    }
  } catch (error: any) {
    showMsg(error.message || "Terjadi kesalahan", "error");
  } finally {
    loading.value = false;
  }
};

const copyAppKey = () => {
  navigator.clipboard.writeText(APP_KEY);
  showMsg("App Key disalin ke clipboard", "success");
};

// Fungsi untuk membuka/menutup mode edit
const toggleEditMode = () => {
    isEditable.value = !isEditable.value;
};

onMounted(fetchSettings);
</script>

<template>
  <v-card elevation="4" rounded="lg" class="mb-4 overflow-hidden compact-header-card">
    <div class="bg-gradient-smooth px-4 py-3">
      <div class="d-flex align-center gap-2">
        <div class="bg-white rounded-circle pa-2 d-flex">
          <SettingsIcon size="24" class="text-primary" />
        </div>
        <div>
          <h2 class="text-h6 font-weight-bold text-white mb-0">
            Accurate API Integration Settings
          </h2>
          <div class="text-caption text-white opacity-90">
            Kelola kredensial dan konfigurasi Accurate Online.
          </div>
        </div>
      </div>
    </div>
  </v-card>
  <v-row v-if="fetching" class="justify-center mt-6">
    <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
    <div class="text-caption mt-1 w-100 text-center">Memuat pengaturan...</div>
  </v-row>

  <v-row v-else>
    <v-col cols="12">
      <v-card elevation="4" rounded="lg" class="border overflow-hidden">
        
        <v-tabs 
            v-model="activeTab" 
            color="primary" 
            class="bg-grey-lighten-4" 
            density="compact" 
            grow
        >
          <v-tab value="credential" class="text-none font-weight-bold">
            <ToolIcon size="18" class="mr-1"/> Kredensial API & Operasional
          </v-tab>
          <v-tab value="guide" class="text-none font-weight-bold">
            <HelpIcon size="18" class="mr-1"/> Panduan Setup
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          
          <v-window-item value="credential">
            <v-card-text class="pa-4">
                <v-alert color="info" variant="tonal" class="mb-4 pa-2" border="start" border-color="info">
                    <template v-slot:prepend><AlertCircleIcon size="18" class="mr-1" /></template>
                    <div class="text-subtitle-2 font-weight-bold">Perhatian!</div>
                    <div class="text-caption">Token API harus dijaga kerahasiaannya. Signature Secret bersifat *fixed* dan tidak dapat diubah.</div>
                </v-alert>

                <form @submit.prevent="handleSave">
                    <v-row>
                        <v-col cols="12" md="8">
                            <UiParentCard title="Kredensial API" class="pa-0">
                                <template v-slot:action>
                                    <v-btn 
                                    :color="isEditable ? 'success' : 'primary'" 
                                    :variant="isEditable ? 'flat' : 'outlined'"
                                    size="small"
                                    class="text-caption text-none"
                                    :loading="loading"
                                    @click="isEditable ? handleSave() : toggleEditMode()"
                                    >
                                    <component :is="isEditable ? DeviceFloppyIcon : EditIcon" size="18" class="mr-1" />
                                    {{ isEditable ? "Simpan Perubahan" : "Edit Konfigurasi" }}
                                    </v-btn>
                                </template>
                                
                                <div class="mb-3 bg-lightprimary pa-3 rounded border border-primary border-opacity-25">
                                    <v-label class="mb-1 font-weight-bold text-primary text-caption">App Key (Aplikasi Saya)</v-label>
                                    <div class="d-flex align-center">
                                    <code class="flex-grow-1 font-weight-bold text-caption text-body-2">{{ APP_KEY }}</code>
                                    <v-btn size="x-small" variant="text" color="primary" @click="copyAppKey" class="ml-1 text-caption text-none">
                                        <CopyIcon size="16" class="mr-1"/> Salin
                                    </v-btn>
                                    </div>
                                    <div class="text-caption text-grey-darken-1 mt-1">Gunakan Key ini saat menginstall aplikasi di Accurate Store.</div>
                                </div>

                                <div class="mb-3">
                                    <v-label class="mb-1 font-weight-medium text-caption">API Access Token (Bearer)</v-label>
                                    <v-text-field
                                    v-model="config.api_token"
                                    :type="showToken ? 'text' : 'password'"
                                    placeholder="Tempel token di sini..."
                                    variant="outlined"
                                    density="compact"
                                    class="font-mono-input small-input"
                                    persistent-hint
                                    hint="Token ini didapatkan dari Developer Portal Accurate."
                                    :readonly="!isEditable || fetching"
                                    :class="{'bg-grey-lighten-4': !isEditable, 'bg-white': isEditable}"
                                    >
                                    <template v-slot:prepend-inner>
                                        <LockIcon v-if="!isEditable" size="18" class="text-grey" />
                                        <LockOpenIcon v-else size="18" class="text-success" />
                                    </template>
                                    <template v-slot:append-inner>
                                        <v-btn icon variant="text" size="x-small" @click="showToken = !showToken" color="grey">
                                        <component :is="showToken ? EyeOffIcon : EyeIcon" size="18" />
                                        </v-btn>
                                    </template>
                                    </v-text-field>
                                </div>

                                <div class="mb-3">
                                    <v-label class="mb-1 font-weight-medium text-caption">Signature Secret</v-label>
                                    <v-text-field
                                    v-model="config.signature_secret"
                                    :type="showSignature ? 'text' : 'password'"
                                    label="Signature Secret"
                                    variant="outlined"
                                    density="compact"
                                    class="font-mono-input bg-grey-lighten-4 small-input"
                                    readonly
                                    >
                                    <template v-slot:prepend-inner><ShieldCheckIcon size="18" class="text-success" /></template>
                                    <template v-slot:append-inner>
                                        <v-btn icon variant="text" size="x-small" @click="showSignature = !showSignature" color="grey">
                                        <component :is="showSignature ? EyeOffIcon : EyeIcon" size="18" />
                                        </v-btn>
                                    </template>
                                    </v-text-field>
                                </div>

                                <div class="mb-2">
                                    <v-label class="mb-1 font-weight-medium text-caption">API Host URL</v-label>
                                    <v-text-field
                                    v-model="config.accurate_host"
                                    placeholder="https://zeus.accurate.id"
                                    variant="outlined"
                                    density="compact"
                                    class="bg-grey-lighten-4 small-input"
                                    readonly
                                    >
                                    <template v-slot:prepend-inner><ServerIcon size="18" class="text-grey" /></template>
                                    </v-text-field>
                                </div>
                            </UiParentCard>
                        </v-col>

                        <v-col cols="12" md="4">
                            <UiParentCard title="Pengaturan Operasional" class="pa-0">
                                <template v-slot:action><MapPinIcon size="18" class="text-primary" /></template>
                                
                                <div class="mb-3">
                                    <v-label class="mb-1 font-weight-medium text-caption">Branch ID (ID Cabang)</v-label>
                                    <v-text-field
                                    v-model="config.branch_id"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                    persistent-hint
                                    hint="ID Cabang di Accurate (Default: 50)"
                                    :readonly="!isEditable || fetching"
                                    :class="{'bg-grey-lighten-4': !isEditable, 'bg-white': isEditable}"
                                    class="small-input"
                                    >
                                    <template v-slot:prepend-inner v-if="!isEditable">
                                        <LockIcon size="18" class="text-grey" />
                                    </template>
                                    </v-text-field>
                                </div>
                                
                                <div class="mb-3">
                                    <v-label class="mb-1 font-weight-medium text-caption">Nama Gudang</v-label>
                                    <v-text-field
                                    v-model="config.warehouse_name"
                                    variant="outlined"
                                    density="compact"
                                    persistent-hint
                                    hint="Nama Gudang harus persis sama dengan di Accurate."
                                    :readonly="!isEditable || fetching"
                                    :class="{'bg-grey-lighten-4': !isEditable, 'bg-white': isEditable}"
                                    class="small-input"
                                    >
                                    <template v-slot:prepend-inner v-if="!isEditable">
                                        <LockIcon size="18" class="text-grey" />
                                    </template>
                                    </v-text-field>
                                </div>
                                
                                <div class="mb-4">
                                    <v-label class="mb-1 font-weight-medium text-caption">Tarif PPN (Desimal)</v-label>
                                    <v-text-field
                                    v-model="config.tax_rate"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.11"
                                    variant="outlined"
                                    density="compact"
                                    persistent-hint
                                    hint="Contoh: 0.11 untuk 11%, 0.12 untuk 12%."
                                    :readonly="!isEditable || fetching"
                                    :class="{'bg-grey-lighten-4': !isEditable, 'bg-white': isEditable}"
                                    class="small-input"
                                    >
                                    <template v-slot:prepend-inner>
                                        <PercentageIcon size="18" :class="{'text-grey': !isEditable, 'text-primary': isEditable}" />
                                        <LockIcon v-if="!isEditable" size="18" class="text-grey ml-1" />
                                    </template>
                                    </v-text-field>
                                </div>
                                
                                <v-btn 
                                    v-if="isEditable"
                                    block 
                                    color="success" 
                                    size="small" 
                                    type="submit" 
                                    :loading="loading"
                                    class="text-none font-weight-bold mt-2"
                                >
                                    <DeviceFloppyIcon size="18" class="mr-1" />
                                    {{ loading ? "Menyimpan..." : "Simpan Konfigurasi" }}
                                </v-btn>
                            </UiParentCard>
                        </v-col>
                    </v-row>
                </form>
            </v-card-text>
          </v-window-item>

          <v-window-item value="guide">
            <v-card-text class="pa-4 bg-grey-lighten-5">
              <v-row class="justify-center">
                <v-col cols="12" md="8">
                  <UiParentCard title="Panduan Mendapatkan API Token" class="pa-0">
                    <v-timeline side="end" align="start" density="compact" class="my-2 timeline-custom">
                      <v-timeline-item dot-color="primary" size="x-small">
                        <div class="text-subtitle-2 font-weight-bold text-primary">Langkah 1: Masuk ke Pengaturan</div>
                        <div class="text-caption text-grey-darken-1">
                          Login ke Accurate Online Anda, lalu masuk ke menu <strong>Pengaturan</strong> → <strong>Accurate Store</strong>.
                        </div>
                      </v-timeline-item>

                      <v-timeline-item dot-color="info" size="x-small">
                        <div class="text-subtitle-2 font-weight-bold text-primary">Langkah 2: Instal Aplikasi</div>
                        <div class="text-caption text-grey-darken-1">
                          Pilih menu <strong>Aplikasi Saya</strong> → Klik tombol <strong>Instal Aplikasi</strong>.
                        </div>
                        <div class="mt-2 bg-grey-lighten-3 pa-2 rounded text-caption border border-info border-opacity-50">
                          Masukkan App Key berikut pada kolom yang tersedia:<br/>
                          <strong class="text-primary font-weight-bold">{{ APP_KEY }}</strong>
                          <v-btn size="x-small" variant="text" color="primary" @click="copyAppKey" class="ml-1 py-0 text-caption text-none">(Salin)</v-btn>
                        </div>
                      </v-timeline-item>

                      <v-timeline-item dot-color="warning" size="x-small">
                        <div class="text-subtitle-2 font-weight-bold text-primary">Langkah 3: Buat API Token</div>
                        <div class="text-caption text-grey-darken-1">
                          Setelah instalasi berhasil:
                          <ol class="ml-3 mt-1">
                            <li class="text-caption">Masuk ke menu <strong>API Token</strong> di Accurate Store.</li>
                            <li class="text-caption">Pilih aplikasi yang baru saja diinstal.</li>
                            <li class="text-caption">Klik tombol <strong>Buat API Token</strong>.</li>
                          </ol>
                        </div>
                      </v-timeline-item>

                      <v-timeline-item dot-color="success" size="x-small">
                        <div class="text-subtitle-2 font-weight-bold text-primary">Langkah 4: Simpan Token</div>
                        <div class="text-caption text-grey-darken-1">
                          Salin API Token yang muncul (token panjang), lalu kembali ke sistem ini.
                          <br/>Masuk ke Tab <strong>Kredensial API & Operasional</strong> dan tempelkan pada kolom <strong>API Access Token (Bearer)</strong>.
                        </div>
                      </v-timeline-item>
                    </v-timeline>
                  </UiParentCard>
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>

        </v-window>
      </v-card>
    </v-col>
  </v-row>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3000" variant="elevated">
    <div class="d-flex align-center text-caption">
      <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" class="mr-1" size="18"></v-icon>
      {{ snackbar.text }}
    </div>
    <template v-slot:actions>
      <v-btn variant="text" icon="mdi-close" size="x-small" @click="snackbar.show = false"></v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
/* GENERAL STYLES */
.bg-gradient-smooth {
 background: linear-gradient(135deg, #1565C0 0%, #42A5F5 60%, #BBDEFB 100%);
}

/* Menurunkan ukuran font di input yang bertipe monospace agar lebih kompak */
.font-mono-input :deep(input) { 
    font-family: monospace !important; 
    font-size: 0.8rem !important;
    height: 18px; 
}
/* Memastikan hint dan label pada text-field juga mengecil */
.v-input--density-compact :deep(.v-input__details) {
    min-height: 12px;
    padding: 2px 8px 0 !important;
}

/* Compact Input Styling (Adopted from InvoicePage) */
.small-input :deep(.v-field) {
 --v-field-padding-bottom: 4px;
 --v-field-padding-top: 4px;
 min-height: 36px !important;
}
.small-input :deep(.v-field__input) {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
    min-height: 32px; 
}
.small-input :deep(.v-field-label) {
 font-size: 0.8rem;
}
.small-input :deep(input) {
 font-size: 0.85rem;
}


/* Mengatur kembali warna dan kursor untuk input readonly */
.bg-grey-lighten-4 :deep(.v-field__input) { 
    color: #666 !important; 
    cursor: not-allowed; 
}

/* Menyesuaikan ukuran font dan padding di card-header (UiParentCard) */
:deep(.v-card-title) {
    font-size: 0.95rem !important; /* Slightly larger than original, but smaller than default */
    font-weight: 600;
    padding: 10px 16px !important; 
    background-color: #f5f5f5; /* Light grey header for child cards */
    border-bottom: 1px solid #eee;
}
/* Menyesuaikan padding di card-content (UiParentCard) */
:deep(.v-card-text) {
    padding: 16px !important; 
}
/* Menyesuaikan ukuran font dan padding tab */
.v-tabs :deep(.v-tab) {
    font-size: 0.8rem !important; 
    padding: 0 10px; 
}

/* Menyesuaikan ukuran font pada teks umum di Vuetify, secara global tidak disarankan, 
tapi bisa membantu konsistensi di konteks ini */
:deep(.v-alert__content) {
    font-size: 0.75rem !important;
}

:deep(.v-label) {
    font-size: 0.75rem;
}

:deep(.v-input__details .v-messages) {
    font-size: 0.7rem; 
}

/* Timeline adjustment */
.timeline-custom :deep(.v-timeline-item__body) {
    padding-top: 0 !important;
}
</style>