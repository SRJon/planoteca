import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // O ambiente da SUÍTE, declarado aqui e não herdado de `.env.local`.
  //
  // `shared/config/ambiente.ts` LANÇA sem `VITE_URL_API`, e o Vitest carrega
  // `.env.local` sozinho — o que fazia a suíte passar na máquina de quem tem
  // o arquivo e falhar no CI, que não tem (nem deveria: ele é gitignored).
  //
  // O valor é inalcançável de propósito. Nenhum teste fala com a rede real:
  // as requisições passam pelo MSW, e uma que escapasse precisa falhar
  // ruidosamente em vez de bater num servidor de verdade.
  define: {
    'import.meta.env.VITE_URL_API': JSON.stringify('https://api.invalid'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/teste/preparo.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
    // `e2e/**` roda sob Playwright (Tarefa 21), um runner incompatível com
    // Vitest — sem esta exclusão, `*.spec.ts` ali dentro bateria no padrão
    // padrão de teste do Vitest e os dois runners disputariam o mesmo
    // arquivo com resultados incoerentes (Playwright não exporta `describe`/
    // `it` do jeito que o Vitest espera).
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
