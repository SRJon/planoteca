import { defineConfig, devices } from '@playwright/test'

const PORTA = 5180
const URL_BASE = `http://localhost:${PORTA}`

/** Segundo servidor: `dist` servido por `vite preview`. Ver o projeto
 * `producao` e `e2e/producao.spec.ts`. */
const PORTA_PRODUCAO = 5181
const URL_PRODUCAO = `http://localhost:${PORTA_PRODUCAO}`

/**
 * Configuração do caminho ponta a ponta (Tarefa 21) — o primeiro teste desta
 * suíte que roda num navegador de verdade, não em jsdom.
 *
 * Roda contra o SERVIDOR DE DESENVOLVIMENTO (`vite`/`npm run dev`), não
 * contra `vite preview` de um build de produção. Motivo: `/design-system`
 * (Tarefa 20) só existe quando `import.meta.env.DEV` é `true` — em produção
 * o Rollup elimina a rota e o import estático de `PaginaDesignSystem` do
 * bundle. `e2e/camadas.spec.ts` depende dessa rota para provar a ordem de
 * camada da Tarefa 12 (`--camada-menu` acima de `--camada-dialogo`); um
 * `vite preview` não a serviria. O caminho de entrar/listar/filtrar
 * (`entrar-e-listar.spec.ts`) funcionaria nos dois modos — mas não vale a
 * pena manter dois `webServer` (duas portas, dois builds) só por isso: os
 * dois specs, incluindo o smoke path, rodam contra o mesmo servidor de dev.
 *
 * `VITE_URL_API`: `shared/config/ambiente.ts` lança se a variável não
 * existir — `npm run dev` sem `.env.local` quebraria no primeiro import de
 * `App.tsx`. `simulacao.ts` intercepta toda chamada `**\/api/v1/**` antes
 * dela sair do navegador (a API real está desligada — ver `CLAUDE.md`), então
 * o host nunca precisa resolver de verdade — MAS precisa ser a MESMA origem
 * da página (`URL_BASE`, não um host fictício de outro domínio). Um `fetch`
 * de página em `http://localhost:5180` contra `http://e2e.invalido` é
 * cross-origin de verdade aos olhos do Chromium mesmo quando a resposta é
 * fabricada por `route.fulfill` — o body chega, mas o navegador esconde
 * qualquer cabeçalho fora da lista CORS-safelisted (`X-Total-Count` incluso)
 * de `Response.headers.get()` sem `Access-Control-Expose-Headers`. Isso
 * derrubou `cliente.listar` (`shared/api/cliente.ts`) para o fallback
 * `total = itens.length` em vez do total real — descoberto rodando este
 * spec pela primeira vez (ver `task-21-report.md`). Mesma origem elimina o
 * problema na raiz, sem precisar simular cabeçalho CORS nenhum. `env` aqui
 * popula `process.env` só para o processo filho que o `webServer` spawna;
 * não vaza para o resto da máquina nem para outros comandos deste gate.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'dev',
      testIgnore: /producao\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: URL_BASE },
    },
    {
      // O único projeto que exercita o artefato de produção. Ver o cabeçalho
      // de `e2e/producao.spec.ts` para o motivo: `npm run build` sai com
      // código 0 mesmo emitindo um bundle onde `VITE_URL_API` é estaticamente
      // `undefined`, e `shared/config` lança no carregamento do módulo. Até
      // aqui, nenhum portão jamais subia o que a build produz.
      name: 'producao',
      testMatch: /producao\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: URL_PRODUCAO },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${PORTA} --strictPort`,
      url: URL_BASE,
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
      env: { VITE_URL_API: URL_BASE },
    },
    {
      // `npx vite build`, não `npm run build`: o script do package.json
      // encadeia três passagens de `tsc --noEmit` que `npm run typecheck` já
      // é o portão de cobrir. Aqui interessa só o bundle.
      //
      // `reuseExistingServer: false` sempre, inclusive local: reaproveitar um
      // `vite preview` de outra execução serviria um `dist` velho, e o
      // artefato desatualizado é exatamente o que este projeto existe para
      // não deixar passar.
      //
      // `VITE_URL_API` vale para os DOIS comandos da linha — é no build que
      // ela é substituída no bundle. Aponta para a própria origem da página
      // pelo mesmo motivo documentado acima: `simulacao.ts` intercepta antes
      // de sair do navegador, mas origem diferente esconde `X-Total-Count`
      // sem cabeçalho CORS.
      command: `npx vite build && npx vite preview --port ${PORTA_PRODUCAO} --strictPort`,
      url: URL_PRODUCAO,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { VITE_URL_API: URL_PRODUCAO },
    },
  ],
})
