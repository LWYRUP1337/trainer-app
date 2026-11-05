import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const vendorChunks: Record<string, RegExp> = {
  react: /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//,
  antd: /\/node_modules\/(antd|@ant-design|@rc-component|rc-[^/]+)\//,
}

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => Object.keys(vendorChunks).find((name) => vendorChunks[name].test(id)),
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: { usePolling: true },
  },
})
