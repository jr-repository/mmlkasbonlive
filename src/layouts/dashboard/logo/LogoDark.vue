<template>
  <div class="logo">
    <RouterLink to="/" aria-label="logo">
      <img
        src="https://ptmultimitralogistik.com/wp-content/uploads/2023/05/Multi-Mitra-Logistik.png"
        alt="Logo"
        style="height: 40px;"
      />

    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
const primary = ref('rgb(var(--v-theme-primary))');
const darkprimary = ref('rgb(var(--v-theme-darkprimary))');
</script>
