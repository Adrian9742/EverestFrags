import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite config — EverestFrags
 *
 * Em dev local (sem VITE_API_URL definido), o proxy intercepta chamadas /api/*
 * e as repassa para o backend FastAPI na porta 8001.
 *
 * ATENÇÃO: o rewrite foi removido — as rotas do backend já têm prefixo /api,
 * então o path deve ser passado inteiro (sem strip). Bug anterior: tinha
 * `rewrite: path => path.replace(/^\/api/, '')` que removia o /api e quebrava todas as rotas.
 *
 * Em produção (Vercel), definir VITE_API_URL com a URL do Render e
 * o proxy não é usado (o client.ts usa BASE_URL diretamente).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        // sem rewrite — /api/ranking vai para http://localhost:8001/api/ranking
      },
    },
  },
})
