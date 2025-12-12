<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { PlusIcon, TrashIcon, CheckIcon, XIcon, ReceiptTaxIcon } from 'vue-tabler-icons';

const API_BASE_URL = "https://multimitralogistik.id/Api";

const loading = ref(false);
const taxes = ref<any[]>([]);
const dialog = ref(false);
const form = reactive({ id: 0, name: '', rate: 0, type: 'PPN', isDefault: false });

const headers = [
    { title: 'Nama Pajak', key: 'name' },
    { title: 'Rate (%)', key: 'rate' },
    { title: 'Tipe', key: 'type' },
    { title: 'Default', key: 'isDefault' },
    { title: 'Aksi', key: 'actions', sortable: false }
];

const fetchTaxes = async () => {
    loading.value = true;
    try {
        const res = await fetch(`${API_BASE_URL}/MasterData/Tax/List.php`);
        const json = await res.json();
        if(json.s) taxes.value = json.d;
    } finally { loading.value = false; }
};

const openModal = (item: any = null) => {
    if(item) {
        form.id = item.id;
        form.name = item.name;
        form.rate = item.rate;
        form.type = item.type;
        form.isDefault = item.isDefault;
    } else {
        form.id = 0;
        form.name = '';
        form.rate = 11;
        form.type = 'PPN';
        form.isDefault = false;
    }
    dialog.value = true;
};

const saveTax = async () => {
    await fetch(`${API_BASE_URL}/MasterData/Tax/Save.php`, {
        method: 'POST', body: JSON.stringify(form)
    });
    dialog.value = false;
    fetchTaxes();
};

const deleteTax = async (id: number) => {
    if(!confirm("Hapus?")) return;
    await fetch(`${API_BASE_URL}/MasterData/Tax/Delete.php`, {
        method: 'POST', body: JSON.stringify({id})
    });
    fetchTaxes();
};

onMounted(fetchTaxes);
</script>

<template>
    <UiParentCard title="Master Data Pajak">
        <v-btn color="primary" class="mb-4" @click="openModal()"><PlusIcon size="18" class="mr-1"/> Tambah Pajak</v-btn>
        
        <v-data-table :headers="headers" :items="taxes" :loading="loading" density="compact">
            <template v-slot:item.rate="{ item }">{{ item.rate }}%</template>
            <template v-slot:item.isDefault="{ item }">
                <v-icon v-if="item.isDefault" color="green">mdi-check-circle</v-icon>
            </template>
            <template v-slot:item.actions="{ item }">
                <v-btn icon variant="text" size="small" color="primary" @click="openModal(item)"><v-icon>mdi-pencil</v-icon></v-btn>
                <v-btn icon variant="text" size="small" color="error" @click="deleteTax(item.id)"><TrashIcon size="18"/></v-btn>
            </template>
        </v-data-table>
    </UiParentCard>

    <v-dialog v-model="dialog" max-width="500">
        <v-card>
            <v-card-title>Form Pajak</v-card-title>
            <v-card-text>
                <v-text-field label="Nama Pajak" v-model="form.name"></v-text-field>
                <v-text-field label="Rate (%)" v-model.number="form.rate" type="number"></v-text-field>
                <v-select label="Tipe" v-model="form.type" :items="['PPN','PPH']"></v-select>
                <v-checkbox label="Set sebagai Default" v-model="form.isDefault"></v-checkbox>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialog=false">Batal</v-btn>
                <v-btn color="primary" @click="saveTax">Simpan</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>