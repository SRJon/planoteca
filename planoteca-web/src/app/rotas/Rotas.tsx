import { Navigate, Route, Routes } from 'react-router'
import { PaginaBiblioteca } from '@/pages/biblioteca'
import {
  PaginaCatalogar,
  PaginaEscrever,
  PaginaModeracao,
  PaginaPessoasAdmin,
  PaginaPlanos,
} from '@/pages/admin'
import { PaginaBlog, PaginaPost } from '@/pages/blog'
import { PaginaDesignSystem } from '@/pages/design-system'
import { PaginaEntrar } from '@/pages/entrar'
import { PaginaInicio } from '@/pages/inicio'
import { PaginaPlano } from '@/pages/plano'
import { PaginaPessoas } from '@/pages/pessoas'
import { useAutenticacao } from '../providers/AutenticacaoProvider'
import { LayoutPublico } from '../shell/LayoutPublico'
import { Shell } from '../shell/Shell'
import { RotaProtegida } from './RotaProtegida'

/** `pages/` não importa `app/` (fronteira de camada) — é este componente,
 * já dentro de `app/`, que lê o `Cliente` do provedor de sessão e o repassa
 * como prop. `PaginaEntrar` continua sem saber de onde o `Cliente` veio. */
/** `pages/` não importa `app/` (fronteira de camada) — é este componente,
 * já dentro de `app/`, que lê o provedor e repassa o que a tela precisa. */
function PaginaEntrarConectada() {
  const { sessao, carregando, disponivel, entrarComGoogle, entrarComSenha, cadastrarComSenha } =
    useAutenticacao()
  return (
    <PaginaEntrar
      temSessao={sessao !== null}
      carregando={carregando}
      disponivel={disponivel}
      entrarComGoogle={entrarComGoogle}
      entrarComSenha={entrarComSenha}
      cadastrarComSenha={cadastrarComSenha}
    />
  )
}

/** Mesmo raciocínio de `PaginaEntrarConectada`, para a fatia de exemplo. */
function PaginaPessoasConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaPessoas cliente={cliente} />
}

/** Mesmo raciocínio, para a landing: ela lê o vocabulário da API para montar
 * os atalhos por componente e por série. */
function PaginaInicioConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaInicio cliente={cliente} />
}

/** Mesmo raciocínio, para a Biblioteca — a tela principal da Planoteca. */
function PaginaBibliotecaConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaBiblioteca cliente={cliente} />
}

/** As quatro telas da área de trabalho, todas conectadas do mesmo jeito. */
function PaginaCatalogarConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaCatalogar cliente={cliente} />
}

function PaginaPlanosConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaPlanos cliente={cliente} />
}

function PaginaModeracaoConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaModeracao cliente={cliente} />
}

function PaginaEscreverConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaEscrever cliente={cliente} />
}

function PaginaPessoasAdminConectada() {
  const { cliente, sessao } = useAutenticacao()
  return <PaginaPessoasAdmin cliente={cliente} minhaContaId={sessao?.id ?? null} />
}

/** O Blog público: listagem e leitura. */
function PaginaBlogConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaBlog cliente={cliente} />
}

function PaginaPostConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaPost cliente={cliente} />
}

/** Mesmo raciocínio, para a ficha de um plano. */
function PaginaPlanoConectada() {
  const { cliente } = useAutenticacao()
  return <PaginaPlano cliente={cliente} />
}

/**
 * Tabela de rotas da aplicação. Fora de `App.tsx` para poder ser testada
 * isolada, dentro de um `MemoryRouter` — `App.tsx` fixa `BrowserRouter`
 * (o que a aplicação de verdade usa), mas os testes de guarda precisam
 * controlar a URL inicial, o que `MemoryRouter` faz e `BrowserRouter` não.
 *
 * ── Duas cascas, e a linha entre elas ───────────────────────────────────
 *
 * **`LayoutPublico`** envolve o acervo: Início, Biblioteca e Blog. Nenhuma
 * delas passa por `RotaProtegida`, e isso é DECISÃO DE PRODUTO, não
 * configuração: baixar um plano não pode exigir conta. O professor chega
 * pelo celular, com pressa, e qualquer porta entre ele e o PDF derruba o
 * uso. Se um dia alguém quiser "só um e-mail antes do download", é esta
 * linha que está sendo apagada — e ela foi desenhada de propósito.
 *
 * **`Shell`** envolve a mesa de trabalho de quem MANTÉM o acervo, atrás de
 * `RotaProtegida`. Login serve para escrever e administrar, não para
 * consumir.
 *
 * A raiz `/` é a landing, e o curinga cai nela. Antes o curinga apontava
 * para `/biblioteca`, que era protegida — a cadeia `/` → `/biblioteca` →
 * guarda → `/entrar` era o motivo de a aplicação abrir no formulário de
 * login.
 */
export function Rotas() {
  return (
    <Routes>
      <Route path="/entrar" element={<PaginaEntrarConectada />} />

      {/* O acervo. Público, sem guarda. */}
      <Route element={<LayoutPublico />}>
        <Route path="/" element={<PaginaInicioConectada />} />
        <Route path="/biblioteca" element={<PaginaBibliotecaConectada />} />
        {/* A ficha de um plano. Aninhada sob `/biblioteca` de propósito: o
            endereço conta de onde o plano veio, e "voltar à Biblioteca" é
            um caminho acima, não um destino inventado. */}
        <Route path="/biblioteca/:id" element={<PaginaPlanoConectada />} />
        <Route path="/blog" element={<PaginaBlogConectada />} />
        <Route path="/blog/:id" element={<PaginaPostConectada />} />
      </Route>

      {/* A área de quem mantém o acervo. */}
      <Route element={<RotaProtegida />}>
        <Route element={<Shell />}>
          <Route path="/admin/moderacao" element={<PaginaModeracaoConectada />} />
          <Route path="/admin/planos" element={<PaginaPlanosConectada />} />
          <Route path="/admin/catalogar" element={<PaginaCatalogarConectada />} />
          <Route path="/admin/escrever" element={<PaginaEscreverConectada />} />
          <Route path="/admin/pessoas" element={<PaginaPessoasAdminConectada />} />
          {/* Andaime do boilerplate. Não é domínio da Planoteca, e sai do
              menu — a rota fica de pé só para não quebrar link antigo de
              quem estava com a tela aberta. */}
          <Route path="/pessoas" element={<PaginaPessoasConectada />} />
        </Route>
      </Route>

      {/* `/design-system` (Tarefa 20) só existe no bundle de desenvolvimento.
       * `import.meta.env.DEV` vira `false` em `npm run build` — Vite/Rollup
       * eliminam este ramo (e o import estático de `PaginaDesignSystem` que
       * só ele referencia) do bundle de produção por análise estática, não
       * por convenção.
       *
       * Fora de `RotaProtegida` de propósito: a página não chama a API, não
       * usa `Cliente` — exigir login para ver uma vitrine de componentes
       * locais seria fricção sem ganho nenhum para quem só quer conferir um
       * token ou testar uma variante.
       *
       * Por que não em produção: a rota existe para quem escreve código e
       * para quem desenha telas, não para o professor que vem buscar um
       * plano. Mantê-la fora do build de produção evita expor o catálogo
       * interno de componentes numa URL adivinhável, sem custo nenhum para
       * quem trabalha no repositório: `npm run dev` alcança a rota a
       * qualquer momento. */}
      {import.meta.env.DEV && <Route path="/design-system" element={<PaginaDesignSystem />} />}

      {/* Uma URL desconhecida leva ao começo do acervo, não ao login. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
