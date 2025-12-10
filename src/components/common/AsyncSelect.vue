<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
    modelValue: { type: [String, Number], default: null },
    label: { type: String, default: 'Cari Data...' },
    placeholder: { type: String, default: '' },
    apiEndpoint: { type: String, required: true },
    itemTitle: { type: String, default: 'name' }, // Field JSON untuk label
    itemValue: { type: String, default: 'no' },    // Field JSON untuk value
    filterType: { type: String, default: '' }      // Parameter tambahan (opsional)
});

const emit = defineEmits(['update:modelValue', 'change']);

const items = ref<any[]>([]);
const loading = ref(false);
const search = ref('');

let timeout: ReturnType<typeof setTimeout>;

// Function fetch data dari API
const fetchItems = async (keyword: string) => {
    loading.value = true;
    try {
        const url = new URL(props.apiEndpoint);
        if (keyword) url.searchParams.append("q", keyword);
        if (props.filterType) url.searchParams.append("type", props.filterType);

        const res = await fetch(url.toString());
        const json = await res.json();

        if (json.s && Array.isArray(json.d)) {
            items.value = json.d;
        } else {
            items.value = [];
        }
    } catch (e) {
        items.value = [];
    } finally {
        loading.value = false;
    }
};

// Debounce Search Watcher
watch(search, (val) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        if (val && val.length > 1) {
            fetchItems(val);
        }
    }, 500);
});

// Handler saat user memilih item
const handleChange = (val: any) => {
    // 1. Emit update ke parent agar v-model di parent berubah
    emit('update:modelValue', val);
    
    // 2. Emit object lengkap untuk keperluan lain (misal ambil nama/harga)
    const selectedObj = items.value.find(i => i[props.itemValue] === val);
    emit('change', selectedObj);
};
</script>

<template>
    <v-autocomplete
        :model-value="modelValue"
        @update:model-value="handleChange"
        v-model:search="search"
        :items="items"
        :loading="loading"
        :label="label"
        :placeholder="placeholder"
        :item-title="itemTitle"
        :item-value="itemValue"
        variant="outlined"
        density="compact"
        hide-details="auto"
        clearable
        no-filter
        :return-object="false"
    >
        <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="item.raw[itemValue]"></v-list-item>
        </template>
        <template v-slot:no-data>
            <div class="px-4 py-2 text-caption text-grey">
                {{ loading ? 'Memuat...' : 'Ketik untuk mencari...' }}
            </div>
        </template>
    </v-autocomplete>
</template>