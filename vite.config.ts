import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Na Vercel, o front precisa saber onde está a API. Sem isso o site publicaria,
// mas todas as telas mostrariam erro de conexão — melhor falhar o deploy aqui.
if (process.env.VERCEL && !process.env.VITE_API_URL) {
  throw new Error(
    'Defina VITE_API_URL nas variáveis de ambiente do projeto do front na Vercel ' +
      '(o endereço da API, ex.: https://erp-ijunior-api.vercel.app).',
  )
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
