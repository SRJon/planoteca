import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
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
