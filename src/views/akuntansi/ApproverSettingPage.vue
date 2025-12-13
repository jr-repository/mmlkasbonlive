<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
  AlertCircleIcon
} from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

const loading = ref(false);
const users = ref<any[]>([]);
const snackbar = reactive({ show: false, text: '', color: 'success' });

const showMsg = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true;
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/Approver/List.php`);
    const json = await res.json();
    if (json.s) users.value = json.d;
  } catch (e) {
    showMsg("Gagal memuat data", "error");
  } finally {
    loading.value = false;
  }
};

const updatePermission = async (user: any, module: string, value: boolean) => {
  try {
    const res = await fetch(`${API_BASE_URL}/Approver/Update.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        module: module,
        value: value
      })
    });
    const json = await res.json();
    if (json.s) {
      showMsg(`Akses Approval ${module} diperbarui`, "success");
    } else {
      user.approvals[module] = !value; 
      showMsg(json.message, "error");
    }
  } catch (e) {
    user.approvals[module] = !value; 
    showMsg("Koneksi Error", "error");
  }
};

onMounted(fetchUsers);
</script>

<template>
  <v-row class="justify-center mt-2">
    <v-col cols="12" md="12">
      <v-alert color="info" variant="tonal" class="mb-4 pa-2" border="start">
        <template v-slot:prepend>
          <AlertCircleIcon size="18" class="mr-1" />
        </template>
        <div class="text-subtitle-2 font-weight-bold">Setting Approver</div>
        <div class="text-caption">
          Atur hak akses user untuk melakukan Approval pada modul-modul berikut.
        </div>
      </v-alert>

      <UiParentCard title="Matrix Otoritas Approval" class="compact-card">
        <v-table class="border rounded-md compact-table" density="compact">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th width="200" class="text-subtitle-2">User</th>
              <th class="text-center text-subtitle-2">Role</th>
              <th class="text-center text-subtitle-2">Kasbon & Biaya</th>
              <th class="text-center text-subtitle-2">Sales Invoice</th>
              <th class="text-center text-subtitle-2">Purchase Bill</th>
              <th class="text-center bg-blue-lighten-5 text-subtitle-2">Rekon Bank</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-2 text-caption">Loading...</td>
            </tr>
            <tr v-else v-for="u in users" :key="u.id" class="hover:bg-grey-lighten-5">
              <td class="py-2">
                <div class="d-flex align-center">
                  <v-avatar color="primary" variant="tonal" size="24" class="mr-2">
                    <span class="text-caption font-weight-bold">{{ u.name.charAt(0) }}</span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium text-body-2">{{ u.name }}</div>
                    <div class="text-caption text-grey">@{{ u.username }}</div>
                  </div>
                </div>
              </td>
              <td class="text-center">
                <v-chip size="x-small" :color="u.role === 'admin' ? 'purple' : 'grey'" variant="flat" class="font-weight-bold text-uppercase">
                  {{ u.role }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-switch v-model="u.approvals.KASBON" color="success" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'KASBON', val)" class="d-inline-flex compact-switch"></v-switch>
              </td>
              <td class="text-center">
                <v-switch v-model="u.approvals.INVOICE" color="success" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'INVOICE', val)" class="d-inline-flex compact-switch"></v-switch>
              </td>
              <td class="text-center">
                <v-switch v-model="u.approvals.BILL" color="success" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'BILL', val)" class="d-inline-flex compact-switch"></v-switch>
              </td>
              <td class="text-center bg-blue-lighten-5">
                <v-switch v-model="u.approvals.REKON" color="primary" hide-details density="compact" inset @update:model-value="(val:any) => updatePermission(u, 'REKON', val)" class="d-inline-flex compact-switch"></v-switch>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3000" class="text-caption">
    {{ snackbar.text }}
    <template v-slot:actions><v-btn variant="text" size="small" @click="snackbar.show = false">Tutup</v-btn></template>
  </v-snackbar>
</template>

<style scoped>
/* Menyesuaikan ukuran font dan padding di card-header (UiParentCard) */
:deep(.v-card-title) {
    font-size: 0.9rem !important; /* Dikecilkan */
    padding: 10px 16px !important; /* Dikecilkan */
}
/* Menyesuaikan padding di card-content (UiParentCard) */
:deep(.v-card-text) {
    padding: 12px 16px 16px !important; /* Dikecilkan */
}

/* Penyesuaian umum untuk tabel agar lebih kompak */
.compact-table :deep(th) {
    font-size: 0.75rem !important; /* Ukuran font header tabel dikecilkan */
    padding: 8px 10px !important; /* Padding header dikecilkan */
}
.compact-table :deep(td) {
    font-size: 0.8rem !important; /* Ukuran font cell dikecilkan */
    padding: 6px 10px !important; /* Padding cell dikecilkan */
}

/* Mengatur ukuran v-switch agar lebih kecil dan rapi di dalam tabel */
.compact-switch :deep(.v-selection-control__wrapper) {
    height: 16px; /* Tinggi wrapper switch dikecilkan */
    width: 32px; /* Lebar wrapper switch dikecilkan */
}
.compact-switch :deep(.v-switch__track) {
    height: 14px !important; /* Tinggi track dikecilkan */
    width: 30px !important; /* Lebar track dikecilkan */
}
.compact-switch :deep(.v-switch__thumb) {
    height: 10px !important; /* Ukuran thumb dikecilkan */
    width: 10px !important; /* Ukuran thumb dikecilkan */
    transform: translateX(0px); /* Reset transform */
    margin-top: 2px !important; /* Posisikan ke tengah vertikal */
}

/* Menyesuaikan posisi thumb saat aktif agar tetap kompak */
.compact-switch :deep(.v-switch--inset .v-selection-control__input:not(.v-selection-control__input--disabled) .v-switch__track) {
    transform: translateX(0) !important;
}

.compact-switch :deep(.v-selection-control__input:checked + .v-switch__track + .v-switch__thumb) {
    transform: translateX(16px) !important; /* Jarak perpindahan thumb disesuaikan */
}

/* memastikan teks di avatar kecil */
.v-avatar :deep(span) {
    font-size: 0.7rem !important;
}

/* memastikan chip kecil */
.v-chip {
    height: 18px !important;
}
.v-chip :deep(.v-chip__content) {
    font-size: 0.65rem !important;
    padding-left: 6px !important;
    padding-right: 6px !important;
}
</style>