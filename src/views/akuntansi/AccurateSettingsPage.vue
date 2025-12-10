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
    SettingsIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";
const APP_KEY = "175c2c10-d684-4ad8-ab42-e6739b7a1ea4";
const FIXED_SIGNATURE = "rC8VEMrTx1AQuS3OWhbdjYnY7SgKjnOyFeecFaDpIiuW9K8XFFhk6lKHFJhuXin0";

// --- STATE ---
const loading = ref(false);
const fetching = ref(true);
const showToken = ref(false);
const showSignature = ref(false);
const activeTab = ref('credential'); // State untuk Tab

const config = reactive({
    api_token: "",
    signature_secret: FIXED_SIGNATURE, // Default Value
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
    try {
        const res = await fetch(`${API_BASE_URL}/Settings/Get.php`);
        const json = await res.json();
        
        if (json.s && json.d) {
            config.api_token = json.d.api_token?.setting_value || "";
            // Gunakan nilai dari DB jika ada, jika tidak gunakan fixed value
            // Tapi requirement meminta untuk MENETAPKAN nilai ini, jadi kita bisa override atau gunakan default
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

onMounted(fetchSettings);
</script>

<template>
    <v-row v-if="fetching" class="justify-center mt-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="text-caption mt-2 w-100 text-center">Memuat pengaturan...</div>
    </v-row>

    <v-row v-else>
        <v-col cols="12">
            <v-card variant="flat" class="mb-6">
                <v-tabs v-model="activeTab" bg-color="primary" center-active>
                    <v-tab value="credential">
                        <SettingsIcon size="20" class="mr-2"/> Kredensial API
                    </v-tab>
                    <v-tab value="guide">
                        <HelpIcon size="20" class="mr-2"/> Cara Mendapat API Token
                    </v-tab>
                </v-tabs>
            </v-card>

            <v-window v-model="activeTab">
                
                <v-window-item value="credential">
                    <v-alert color="info" variant="tonal" class="mb-6" border="start" border-color="info">
                        <template v-slot:prepend><AlertCircleIcon size="24" class="mr-2" /></template>
                        <div class="text-subtitle-1 font-weight-bold">Penting</div>
                        <div class="text-body-2">Pastikan Token API selalu aktif. Signature Secret bersifat Read-Only untuk keamanan.</div>
                    </v-alert>

                    <form @submit.prevent="handleSave">
                        <v-row>
                            <v-col cols="12" md="8">
                                <UiParentCard title="Kredensial API">
                                    <template v-slot:action><KeyIcon size="20" class="text-primary" /></template>
                                    
                                    <div class="mb-4 bg-lightprimary pa-4 rounded border border-primary border-opacity-25">
                                        <v-label class="mb-1 font-weight-bold text-primary">App Key (Aplikasi Saya)</v-label>
                                        <div class="d-flex align-center">
                                            <code class="flex-grow-1 font-weight-bold text-body-2">{{ APP_KEY }}</code>
                                            <v-btn size="small" variant="text" color="primary" @click="copyAppKey" class="ml-2">
                                                <CopyIcon size="18" class="mr-1"/> Salin
                                            </v-btn>
                                        </div>
                                        <div class="text-caption text-grey-darken-1 mt-1">Gunakan Key ini saat menginstall aplikasi di Accurate Store.</div>
                                    </div>

                                    <div class="mb-4">
                                        <v-label class="mb-2 font-weight-medium">API Access Token (Bearer)</v-label>
                                        <v-text-field
                                            v-model="config.api_token"
                                            :type="showToken ? 'text' : 'password'"
                                            placeholder="Tempel token di sini..."
                                            variant="outlined"
                                            class="font-mono-input"
                                            persistent-hint
                                            hint="Token ini didapatkan dari Developer Portal Accurate."
                                        >
                                            <template v-slot:append-inner>
                                                <v-btn icon variant="text" size="small" @click="showToken = !showToken" color="grey">
                                                    <component :is="showToken ? EyeOffIcon : EyeIcon" size="20" />
                                                </v-btn>
                                            </template>
                                        </v-text-field>
                                    </div>

                                    <div class="mb-4">
                                        <v-text-field
                                            v-model="config.signature_secret"
                                            :type="showSignature ? 'text' : 'password'"
                                            label="Signature Secret"
                                            variant="outlined"
                                            density="compact"
                                            class="font-mono-input bg-grey-lighten-4"
                                            readonly
                                        >
                                            <template v-slot:prepend-inner><ShieldCheckIcon size="20" class="text-grey" /></template>
                                            <template v-slot:append-inner>
                                                <v-btn icon variant="text" size="small" @click="showSignature = !showSignature" color="grey">
                                                    <component :is="showSignature ? EyeOffIcon : EyeIcon" size="20" />
                                                </v-btn>
                                            </template>
                                        </v-text-field>
                                    </div>

                                    <div class="mb-2">
                                        <v-text-field
                                            v-model="config.accurate_host"
                                            label="API Host URL"
                                            placeholder="https://zeus.accurate.id"
                                            variant="outlined"
                                            density="compact"
                                            class="bg-grey-lighten-4"
                                            readonly
                                        >
                                            <template v-slot:prepend-inner><ServerIcon size="20" class="text-grey" /></template>
                                        </v-text-field>
                                    </div>
                                </UiParentCard>
                            </v-col>

                            <v-col cols="12" md="4">
                                <UiParentCard title="Operasional">
                                    <template v-slot:action><MapPinIcon size="20" class="text-orange" /></template>
                                    <div class="mb-4">
                                        <v-text-field
                                            v-model="config.branch_id"
                                            label="Branch ID (ID Cabang)"
                                            type="number"
                                            variant="outlined"
                                            density="compact"
                                            persistent-hint
                                            hint="ID Cabang di Accurate (Default: 50)"
                                        ></v-text-field>
                                    </div>
                                    <div class="mb-4">
                                        <v-text-field
                                            v-model="config.warehouse_name"
                                            label="Nama Gudang"
                                            variant="outlined"
                                            density="compact"
                                            persistent-hint
                                            hint="Nama Gudang harus persis sama dengan di Accurate."
                                        ></v-text-field>
                                    </div>
                                    <div class="mb-6">
                                        <v-text-field
                                            v-model="config.tax_rate"
                                            label="Tarif PPN (Desimal)"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.11"
                                            variant="outlined"
                                            density="compact"
                                            persistent-hint
                                            hint="Contoh: 0.11 untuk 11%, 0.12 untuk 12%."
                                        >
                                            <template v-slot:prepend-inner><PercentageIcon size="20" class="text-grey" /></template>
                                        </v-text-field>
                                    </div>
                                    <v-btn block color="primary" size="large" type="submit" :loading="loading">
                                        <DeviceFloppyIcon size="20" class="mr-2" />
                                        {{ loading ? "Menyimpan..." : "Simpan Konfigurasi" }}
                                    </v-btn>
                                </UiParentCard>
                            </v-col>
                        </v-row>
                    </form>
                </v-window-item>

                <v-window-item value="guide">
                    <v-row class="justify-center">
                        <v-col cols="12" md="8">
                            <UiParentCard title="Panduan Mendapatkan API Token">
                                <v-timeline side="end" align="start" density="compact" class="my-4">
                                    <v-timeline-item dot-color="primary" size="small">
                                        <div class="text-subtitle-1 font-weight-bold">Langkah 1: Masuk ke Pengaturan</div>
                                        <div class="text-body-2 text-grey-darken-1">
                                            Login ke Accurate Online Anda, lalu masuk ke menu <strong>Pengaturan</strong> → <strong>Accurate Store</strong>.
                                        </div>
                                    </v-timeline-item>

                                    <v-timeline-item dot-color="secondary" size="small">
                                        <div class="text-subtitle-1 font-weight-bold">Langkah 2: Instal Aplikasi</div>
                                        <div class="text-body-2 text-grey-darken-1">
                                            Pilih menu <strong>Aplikasi Saya</strong> → Klik tombol <strong>Instal Aplikasi</strong>.
                                        </div>
                                        <div class="mt-2 bg-grey-lighten-4 pa-3 rounded text-caption border">
                                            Masukkan App Key berikut pada kolom yang tersedia:<br/>
                                            <strong class="text-primary">{{ APP_KEY }}</strong>
                                            <v-btn size="x-small" variant="text" color="primary" @click="copyAppKey" class="ml-1">(Salin)</v-btn>
                                        </div>
                                    </v-timeline-item>

                                    <v-timeline-item dot-color="info" size="small">
                                        <div class="text-subtitle-1 font-weight-bold">Langkah 3: Buat API Token</div>
                                        <div class="text-body-2 text-grey-darken-1">
                                            Setelah instalasi berhasil:
                                            <ol class="ml-4 mt-1">
                                                <li>Masuk ke menu <strong>API Token</strong> di Accurate Store.</li>
                                                <li>Pilih aplikasi yang baru saja diinstal.</li>
                                                <li>Klik tombol <strong>Buat API Token</strong>.</li>
                                            </ol>
                                        </div>
                                    </v-timeline-item>

                                    <v-timeline-item dot-color="success" size="small">
                                        <div class="text-subtitle-1 font-weight-bold">Langkah 4: Simpan Token</div>
                                        <div class="text-body-2 text-grey-darken-1">
                                            Salin API Token yang muncul (token panjang), lalu kembali ke sistem ini.
                                            <br/>Masuk ke Tab <strong>Kredensial API</strong> dan tempelkan pada kolom <strong>API Access Token</strong>.
                                        </div>
                                    </v-timeline-item>
                                </v-timeline>
                            </UiParentCard>
                        </v-col>
                    </v-row>
                </v-window-item>

            </v-window>
        </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right">
        {{ snackbar.text }}
        <template v-slot:actions><v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn></template>
    </v-snackbar>
</template>

<style scoped>
.font-mono-input :deep(input) { font-family: monospace !important; font-size: 0.85rem; }
.bg-grey-lighten-4 :deep(.v-field__input) { color: #666 !important; cursor: not-allowed; }
</style>