import { defineConfig } from 'vite'

export default defineConfig({
  // Configuración para preview en hosts remotos
  preview: {
    host: '0.0.0.0',
    port: 4173,
    // Permitir tu dominio de Railway
    allowedHosts: ['ali2-clean-production.up.railway.app']
  }
})