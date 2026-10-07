// Entrada da API na Vercel: o vercel.json manda toda requisição para cá.
// Usa o build de dist/, gerado por `npm run vercel-build` antes do empacotamento.
// Localmente a API continua subindo por src/index.ts (`npm run dev`).
import { createApp } from '../dist/app.js'

export default createApp()
