import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => ['v-list-recognize-title'].includes(tag)
        }
      }
    }),
    vuetify({
      autoImport: true
    }),

    // ❗ HANYA aktif saat build, bukan dev
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, 'dist/index.html'),
          dest: '.',
          rename: '404.html'
        }
      ],
      // Disable during dev so it doesn't error
      watch: process.env.NODE_ENV === 'production'
    })
  ],

  // ⬅️ FIX: gunakan root `/`
  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.esm-bundler.js'
    }
  },

  css: {
    preprocessorOptions: {
      scss: {}
    }
  },

  build: {
    chunkSizeWarningLimit: 1024 * 1024
  },

  optimizeDeps: {
    exclude: ['vuetify'],
    entries: ['./src/**/*.vue']
  }
});
