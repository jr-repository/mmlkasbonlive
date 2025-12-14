<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { 
  UserIcon,
  KeyIcon,
  BrandInstagramIcon, 
  BrandTwitterIcon, // Menggunakan BrandTwitterIcon sebagai pengganti BrandXIcon
  BrandLinkedinIcon,
  EditIcon,
  UserCircleIcon,
  DeviceFloppyIcon,
  CameraIcon,
  ActivityIcon,
  CalendarIcon,
  ShareIcon,
  LockIcon
} from 'vue-tabler-icons';

// --- CONFIG ---
const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";
const authStore = useAuthStore();
const currentUser = authStore.userData; // Mengambil ID dari store login

// --- STATE ---
const loading = ref(false);
const submitting = ref(false);
const activeTab = ref('personal'); // personal | social | password
const isEditable = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Data Form Utama
const form = reactive({
    id: 0,
    username: '',
    email: '',
    name: '', // First Name
    last_name: '',
    phone_code: '+62',
    phone_number: '',
    designation: '',
    address_1: '',
    address_2: '',
    country: '',
    state: '',
    birth_month: '',
    birth_day: '',
    birth_year: '',
    link_instagram: '',
    link_twitter: '',
    link_linkedin: '',
    profile_picture_url: '', // URL untuk display
});

// Data Form Password
const passForm = reactive({
    current_password: '',
    new_password: '',
    confirm_password: ''
});

// Statistik (Dari Backend)
const stats = reactive({
    total_activity: 0,
    member_since: '-'
});

// File Upload
const selectedFile = ref<File | null>(null);
const previewImage = ref<string | null>(null);

// Snackbar
const snackbar = reactive({ show: false, text: '', color: 'success' });
const showMsg = (text: string, color = 'success') => { 
    snackbar.text = text; 
    snackbar.color = color; 
    snackbar.show = true; 
};

// --- COMPUTED ---
const displayImage = computed(() => {
    if (previewImage.value) return previewImage.value;
    if (form.profile_picture_url) return form.profile_picture_url;
    return 'https://multimitralogistik.id/Backend/uploads/profile/default.png'; // Default Placeholder
});

const completionPercentage = computed(() => {
    let filled = 0;
    // Menggunakan keyof typeof form untuk type safety
    const fields: (keyof typeof form)[] = ['name', 'email', 'phone_number', 'designation', 'address_1', 'country', 'state'];
    fields.forEach(f => {
        if (form[f]) filled++;
    });
    return Math.round((filled / fields.length) * 100);
});

// --- METHODS ---

// 1. Fetch Data Profile
const fetchProfile = async () => {
    loading.value = true;
    try {
        const userId = currentUser?.id;
        if (!userId) throw new Error("User ID tidak ditemukan. Silakan login ulang.");

        const res = await fetch(`${API_BASE_URL}/Profile/Get.php?user_id=${userId}`);
        const json = await res.json();

        if (json.s && json.d) {
            const data = json.d.profile;
            const stat = json.d.stats;

            // Map Data to Form
            Object.assign(form, {
                ...data,
                // Pastikan null value menjadi string kosong agar tidak error di input
                last_name: data.last_name || '',
                phone_code: data.phone_code || '+62',
                phone_number: data.phone_number || '',
                designation: data.designation || '',
                address_1: data.address_1 || '',
                address_2: data.address_2 || '',
                country: data.country || '',
                state: data.state || '',
                birth_month: data.birth_month || '',
                birth_day: data.birth_day || '',
                birth_year: data.birth_year || '',
                link_instagram: data.link_instagram || '',
                link_twitter: data.link_twitter || '',
                link_linkedin: data.link_linkedin || '',
                profile_picture_url: data.profile_picture_url
            });

            // Map Stats
            stats.total_activity = stat.total_activity;
            stats.member_since = stat.member_since;
        }
    } catch (e: any) {
        showMsg(e.message || "Gagal memuat profil", "error");
    } finally {
        loading.value = false;
    }
};

// 2. Trigger File Input
const triggerUpload = () => {
    if (isEditable.value) {
        fileInput.value?.click();
    } else {
        showMsg("Klik tombol 'Edit Profile' terlebih dahulu untuk mengubah foto.", "warning");
    }
};

// 3. Handle File Change
const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        
        // Validasi ukuran (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showMsg("Ukuran foto maksimal 2MB", "error");
            return;
        }

        selectedFile.value = file;
        
        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
};

// 4. Save Profile & Social Media
const handleSaveProfile = async () => {
    if (!form.name || !form.email) {
        showMsg("Nama Depan dan Email wajib diisi!", "error");
        return;
    }

    submitting.value = true;
    try {
        const formData = new FormData();
        // Konversi ID ke string
        formData.append('user_id', String(currentUser.id));
        
        // Append semua field form manual
        for (const key in form) {
            if (key !== 'profile_picture_url') { // Skip URL, kita kirim file
                // [FIX] Mengkonversi value ke String agar kompatibel dengan FormData
                const value = form[key as keyof typeof form];
                formData.append(key, String(value ?? '')); 
            }
        }
        
        // Append File jika ada
        if (selectedFile.value) {
            formData.append('profile_picture', selectedFile.value);
        }

        // Mapping 'name' di database adalah First Name di Form
        formData.append('first_name', form.name);

        const res = await fetch(`${API_BASE_URL}/Profile/UpdateInfo.php`, {
            method: 'POST',
            body: formData
        });
        const json = await res.json();

        if (json.s) {
            showMsg("Profil berhasil diperbarui!", "success");
            isEditable.value = false;
            // Refresh data untuk memastikan URL gambar terbaru terload
            fetchProfile(); 
        } else {
            throw new Error(json.message);
        }

    } catch (e: any) {
        showMsg(e.message || "Gagal menyimpan data", "error");
    } finally {
        submitting.value = false;
    }
};

// 5. Change Password
const handleChangePassword = async () => {
    if (!passForm.current_password || !passForm.new_password || !passForm.confirm_password) {
        showMsg("Semua kolom password wajib diisi", "error");
        return;
    }
    if (passForm.new_password !== passForm.confirm_password) {
        showMsg("Konfirmasi password baru tidak cocok", "error");
        return;
    }

    submitting.value = true;
    try {
        const payload = {
            user_id: currentUser.id,
            ...passForm
        };

        const res = await fetch(`${API_BASE_URL}/Profile/ChangePassword.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.s) {
            showMsg("Password berhasil diubah!", "success");
            // Reset form
            passForm.current_password = '';
            passForm.new_password = '';
            passForm.confirm_password = '';
        } else {
            throw new Error(json.message);
        }
    } catch (e: any) {
        showMsg(e.message || "Gagal mengubah password", "error");
    } finally {
        submitting.value = false;
    }
};

onMounted(fetchProfile);
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card elevation="2" rounded="lg" class="mb-4 overflow-hidden profile-header-card">
        <div class="bg-gradient-header px-6 py-6 d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-4">
            <div class="profile-progress" style="width: 80px; height: 80px; position: relative;">
              <v-progress-circular 
                :model-value="completionPercentage" 
                size="80" 
                width="6" 
                color="white"
                track-color="rgba(255,255,255,0.3)"
              >
                <span class="text-subtitle-1 font-weight-bold text-white">{{ completionPercentage }}%</span>
              </v-progress-circular>
            </div>
            <div>
              <h2 class="text-h5 font-weight-bold text-white mb-1">
                Hello, {{ form.name }}!
              </h2>
              <div class="text-caption text-white opacity-80 d-flex align-center">
                <CalendarIcon size="16" class="mr-1"/> Member Since: {{ stats.member_since }}
              </div>
            </div>
          </div>

          <div>
            <v-btn 
                color="white" 
                variant="elevated" 
                class="text-primary font-weight-bold"
                @click="isEditable = !isEditable" 
                :prepend-icon="isEditable ? 'mdi-close' : EditIcon"
            >
                {{ isEditable ? 'Cancel Edit' : 'Edit Profile' }}
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12">
      <v-row>
        <v-col cols="12" md="3">
          <v-card elevation="2" rounded="lg" class="pa-0 h-100 overflow-hidden">
            <div class="text-center pa-6 bg-lightprimary">
              <div class="position-relative d-inline-block">
                  <v-avatar size="120" class="elevation-4 border-white">
                    <v-img :src="displayImage" alt="Profile Avatar" cover></v-img>
                  </v-avatar>
                  <v-btn 
                    icon 
                    size="small" 
                    color="primary" 
                    class="upload-btn"
                    @click="triggerUpload"
                    title="Upload Foto"
                  >
                    <CameraIcon size="16"/>
                  </v-btn>
                  <input type="file" ref="fileInput" class="d-none" accept="image/*" @change="handleFileChange">
              </div>
              
              <h3 class="text-h6 font-weight-bold mt-4 mb-1 text-truncate">{{ form.name }} {{ form.last_name }}</h3>
              <div class="text-caption text-grey-darken-1 font-weight-medium mb-3">
                {{ form.designation || 'No Designation' }}
              </div>
              
              <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
                {{ form.username }}
              </v-chip>
            </div>

            <v-divider></v-divider>

            <div class="pa-4">
                <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption font-weight-bold text-grey">Total Activity</span>
                    <ActivityIcon size="16" class="text-primary"/>
                </div>
                <div class="text-h4 font-weight-bold text-primary">{{ stats.total_activity }}</div>
                <div class="text-caption text-grey">Transactions processed</div>
            </div>

            <v-divider></v-divider>

            <div class="d-flex justify-center gap-4 py-4">
                <v-btn icon variant="text" :color="form.link_instagram ? 'pink' : 'grey'" :href="form.link_instagram || '#'" target="_blank" :disabled="!form.link_instagram">
                    <BrandInstagramIcon size="24"/>
                </v-btn>
                <v-btn icon variant="text" :color="form.link_twitter ? 'black' : 'grey'" :href="form.link_twitter || '#'" target="_blank" :disabled="!form.link_twitter">
                    <BrandTwitterIcon size="24"/>
                </v-btn>
                <v-btn icon variant="text" :color="form.link_linkedin ? 'blue-darken-2' : 'grey'" :href="form.link_linkedin || '#'" target="_blank" :disabled="!form.link_linkedin">
                    <BrandLinkedinIcon size="24"/>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <v-list density="compact" nav class="pa-2">
                <v-list-item 
                    color="primary" 
                    :active="activeTab === 'personal'" 
                    @click="activeTab = 'personal'"
                    rounded="md"
                    class="mb-1"
                >
                    <template v-slot:prepend><UserIcon size="20" class="mr-2"/></template>
                    <v-list-item-title class="text-body-2 font-weight-medium">Personal Information</v-list-item-title>
                </v-list-item>
                
                <v-list-item 
                    color="primary" 
                    :active="activeTab === 'social'" 
                    @click="activeTab = 'social'"
                    rounded="md"
                    class="mb-1"
                >
                    <template v-slot:prepend><ShareIcon size="20" class="mr-2"/></template>
                    <v-list-item-title class="text-body-2 font-weight-medium">Social Media</v-list-item-title>
                </v-list-item>

                <v-list-item 
                    color="primary" 
                    :active="activeTab === 'password'" 
                    @click="activeTab = 'password'"
                    rounded="md"
                >
                    <template v-slot:prepend><KeyIcon size="20" class="mr-2"/></template>
                    <v-list-item-title class="text-body-2 font-weight-medium">Change Password</v-list-item-title>
                </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="9">
          
          <v-window v-model="activeTab">
            
            <v-window-item value="personal">
                <UiParentCard title="Personal Information" class="h-100">
                    <template v-slot:action>
                        <v-chip v-if="isEditable" color="warning" size="small" variant="flat">Edit Mode Active</v-chip>
                    </template>
                    <v-form @submit.prevent="handleSaveProfile">
                        <h4 class="text-subtitle-2 font-weight-bold mb-4 text-grey-darken-2 text-uppercase">Identitas Diri</h4>
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">First Name *</v-label>
                                <v-text-field 
                                    v-model="form.name" 
                                    placeholder="Nama Depan"
                                    variant="outlined" 
                                    density="compact"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                ></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">Last Name</v-label>
                                <v-text-field 
                                    v-model="form.last_name" 
                                    placeholder="Nama Belakang"
                                    variant="outlined" 
                                    density="compact"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">Email Address *</v-label>
                                <v-text-field 
                                    v-model="form.email" 
                                    variant="outlined" 
                                    density="compact"
                                    prepend-inner-icon="mdi-email-outline"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                ></v-text-field>
                            </v-col>
                            
                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">Designation (Jabatan)</v-label>
                                <v-text-field 
                                    v-model="form.designation"
                                    placeholder="e.g. Finance Staff"
                                    variant="outlined" 
                                    density="compact"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                    prepend-inner-icon="mdi-briefcase-outline"
                                ></v-text-field>
                            </v-col>
                            
                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">Phone Number</v-label>
                                <v-row dense>
                                    <v-col cols="4" class="pr-0">
                                        <v-select 
                                            v-model="form.phone_code" 
                                            :items="['+62', '+1', '+60', '+65']" 
                                            variant="outlined" 
                                            density="compact"
                                            :readonly="!isEditable"
                                            :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                        ></v-select>
                                    </v-col>
                                    <v-col cols="8">
                                        <v-text-field 
                                            v-model="form.phone_number" 
                                            placeholder="812xxxx" 
                                            variant="outlined" 
                                            density="compact"
                                            :readonly="!isEditable"
                                            :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-col>
                            
                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">Date of Birth</v-label>
                                <v-row dense>
                                    <v-col cols="4">
                                        <v-select 
                                            v-model="form.birth_day" 
                                            :items="Array.from({length: 31}, (_, i) => String(i + 1))" 
                                            label="Day" 
                                            variant="outlined" 
                                            density="compact"
                                            :readonly="!isEditable"
                                            :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                        ></v-select>
                                    </v-col>
                                    <v-col cols="4">
                                        <v-select 
                                            v-model="form.birth_month" 
                                            :items="['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']" 
                                            label="Month" 
                                            variant="outlined" 
                                            density="compact"
                                            :readonly="!isEditable"
                                            :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                        ></v-select>
                                    </v-col>
                                    <v-col cols="4">
                                        <v-text-field 
                                            v-model="form.birth_year" 
                                            label="Year" 
                                            placeholder="YYYY"
                                            variant="outlined" 
                                            density="compact"
                                            :readonly="!isEditable"
                                            :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>

                        <v-divider class="my-4 border-dashed"></v-divider>

                        <h4 class="text-subtitle-2 font-weight-bold mb-4 text-grey-darken-2 text-uppercase">Address Information</h4>
                        <v-row dense>
                            <v-col cols="12">
                                <v-label class="mb-1 text-caption">Address Line 1</v-label>
                                <v-textarea 
                                    v-model="form.address_1" 
                                    variant="outlined" 
                                    density="compact"
                                    rows="2"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                ></v-textarea>
                            </v-col>
                            <v-col cols="12">
                                <v-label class="mb-1 text-caption">Address Line 2 (Optional)</v-label>
                                <v-textarea 
                                    v-model="form.address_2" 
                                    variant="outlined" 
                                    density="compact"
                                    rows="2"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                ></v-textarea>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">Country</v-label>
                                <v-text-field 
                                    v-model="form.country" 
                                    placeholder="Indonesia"
                                    variant="outlined" 
                                    density="compact"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                ></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-label class="mb-1 text-caption">State / Province</v-label>
                                <v-text-field 
                                    v-model="form.state" 
                                    placeholder="Jawa Barat"
                                    variant="outlined" 
                                    density="compact"
                                    :readonly="!isEditable"
                                    :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                                ></v-text-field>
                            </v-col>
                        </v-row>
                        
                        <div class="d-flex justify-end mt-6" v-if="isEditable">
                            <v-btn color="primary" variant="flat" size="large" type="submit" :loading="submitting">
                                <DeviceFloppyIcon size="20" class="mr-2"/> Save Changes
                            </v-btn>
                        </div>
                    </v-form>
                </UiParentCard>
            </v-window-item>

            <v-window-item value="social">
                <UiParentCard title="Social Media Profiles" class="h-100">
                    <template v-slot:action>
                        <v-chip v-if="isEditable" color="warning" size="small" variant="flat">Edit Mode Active</v-chip>
                    </template>
                    <v-form @submit.prevent="handleSaveProfile">
                        <div class="text-caption text-grey mb-4">
                            Tautkan akun sosial media Anda agar orang lain dapat lebih mudah menghubungi Anda.
                        </div>

                        <div class="mb-4">
                            <v-label class="mb-1 font-weight-bold">Instagram Profile URL</v-label>
                            <v-text-field 
                                v-model="form.link_instagram" 
                                placeholder="https://instagram.com/username" 
                                variant="outlined" 
                                density="compact"
                                :readonly="!isEditable"
                                :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                            >
                                <template v-slot:prepend-inner>
                                    <BrandInstagramIcon size="20" class="text-pink"/>
                                </template>
                            </v-text-field>
                        </div>

                        <div class="mb-4">
                            <v-label class="mb-1 font-weight-bold">X (Twitter) Profile URL</v-label>
                            <v-text-field 
                                v-model="form.link_twitter" 
                                placeholder="https://x.com/username" 
                                variant="outlined" 
                                density="compact"
                                :readonly="!isEditable"
                                :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                            >
                                <template v-slot:prepend-inner>
                                    <BrandTwitterIcon size="20" class="text-black"/>
                                </template>
                            </v-text-field>
                        </div>

                        <div class="mb-4">
                            <v-label class="mb-1 font-weight-bold">LinkedIn Profile URL</v-label>
                            <v-text-field 
                                v-model="form.link_linkedin" 
                                placeholder="https://linkedin.com/in/username" 
                                variant="outlined" 
                                density="compact"
                                :readonly="!isEditable"
                                :bg-color="!isEditable ? 'grey-lighten-4' : 'white'"
                            >
                                <template v-slot:prepend-inner>
                                    <BrandLinkedinIcon size="20" class="text-blue-darken-2"/>
                                </template>
                            </v-text-field>
                        </div>

                        <div class="d-flex justify-end mt-6" v-if="isEditable">
                            <v-btn color="primary" variant="flat" size="large" type="submit" :loading="submitting">
                                <DeviceFloppyIcon size="20" class="mr-2"/> Save Social Links
                            </v-btn>
                        </div>
                    </v-form>
                </UiParentCard>
            </v-window-item>

            <v-window-item value="password">
                <UiParentCard title="Change Password" class="h-100">
                    <v-alert color="info" variant="tonal" class="mb-4" density="compact">
                        <template v-slot:prepend><LockIcon size="20" class="mr-2"/></template>
                        <div class="text-caption">Password harus terdiri dari minimal 6 karakter. Pastikan Anda mengingat password baru Anda.</div>
                    </v-alert>

                    <v-form @submit.prevent="handleChangePassword">
                        <div class="mb-3">
                            <v-label class="mb-1 font-weight-bold">Current Password</v-label>
                            <v-text-field 
                                v-model="passForm.current_password" 
                                type="password" 
                                placeholder="********" 
                                variant="outlined" 
                                density="compact"
                            ></v-text-field>
                        </div>

                        <div class="mb-3">
                            <v-label class="mb-1 font-weight-bold">New Password</v-label>
                            <v-text-field 
                                v-model="passForm.new_password" 
                                type="password" 
                                placeholder="********" 
                                variant="outlined" 
                                density="compact"
                            ></v-text-field>
                        </div>

                        <div class="mb-4">
                            <v-label class="mb-1 font-weight-bold">Confirm New Password</v-label>
                            <v-text-field 
                                v-model="passForm.confirm_password" 
                                type="password" 
                                placeholder="********" 
                                variant="outlined" 
                                density="compact"
                            ></v-text-field>
                        </div>

                        <div class="d-flex justify-end">
                            <v-btn color="primary" variant="flat" size="large" type="submit" :loading="submitting">
                                Update Password
                            </v-btn>
                        </div>
                    </v-form>
                </UiParentCard>
            </v-window-item>

          </v-window>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3000">
    {{ snackbar.text }}
    <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
/* Gradient Header Modern */
.bg-gradient-header { 
    background: linear-gradient(135deg, #1976D2 0%, #42A5F5 60%, #BBDEFB 100%); 
}

/* Custom Styles */
.profile-header-card {
    border: none;
}

.upload-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    transform: translate(25%, 25%);
    border: 2px solid white;
}

.border-white {
    border: 3px solid white;
}

/* Override Vuetify Input Styles for Cleaner Look */
:deep(.v-field--variant-outlined) {
    border-radius: 8px !important;
}
:deep(.v-field__input) {
    min-height: 40px !important;
    padding-top: 8px !important;
    font-size: 0.9rem;
}
:deep(.v-label) {
    opacity: 0.8;
}

/* Sidebar List Active State */
.v-list-item--active {
    background-color: #E3F2FD !important;
    color: #1565C0 !important;
    font-weight: bold;
}
</style>