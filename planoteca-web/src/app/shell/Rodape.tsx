import { Link } from 'react-router'
import { Marca } from '@/components/marca'
import { Container } from '@/components/container'

/** O endereço de contato da Planoteca. Único canal que existe de verdade:
 * não há telefone, não há perfil em rede social, e não há newsletter. Link
 * para o vazio é pior que ausência — quem clica e não chega a lugar nenhum
 * perde a confiança no resto da página. */
const EMAIL = 'planoteca.escola@gmail.com'

/** O título de coluna do rodapé, no mesmo mono espacejado das etiquetas do
 * sistema (ficha do plano, catalogação). Repetir a etiqueta aqui é o que faz
 * o rodapé parecer parte do produto, e não um bloco colado no fim. */
function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-xs tracking-[0.1em] text-inverso-ink-2 uppercase">{children}</h2>
  )
}

/** Um link de coluna. `min-h-11` (44px) e não só `text-sm`: no celular estes
 * links ficam empilhados e próximos, e o alvo de toque é o que separa clicar
 * em "Blog" de clicar em "Entrar" sem querer. */
function ItemLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="flex min-h-11 items-center text-inverso-ink hover:underline">
        {children}
      </Link>
    </li>
  )
}

/**
 * O rodapé das telas públicas.
 *
 * Bloco invertido: fundo escuro (`inverso-*`) contra o papel claro do resto
 * da página. É o que fecha a leitura — sem ele o conteúdo simplesmente para,
 * e a landing, que agora sangra a largura da janela, não teria fim visível.
 *
 * O `border-t-2 border-traco` é a mesma assinatura de 2px que desenha card,
 * chip e cabeçalho. O rodapé não inventa um traço próprio.
 *
 * O que NÃO está aqui é decisão, não esquecimento: nenhum ícone de rede
 * social, nenhuma newsletter, nenhum "política de privacidade". Não existem.
 */
export function Rodape() {
  return (
    <footer className="border-t-2 border-traco bg-inverso-bg text-inverso-ink">
      <Container className="py-10">
        <div className="grid grid-cols-4 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div className="flex flex-col gap-3">
            {/* `tom="solido"` porque a caneta da marca colorida é a mesma cor
                do fundo invertido — sobre ele a barra simplesmente sumiria. */}
            <div className="flex items-center gap-2">
              <Marca tamanho={24} tom="solido" />
              <span className="text-base font-bold tracking-tight">Planoteca</span>
            </div>
            <p className="max-w-[34ch] text-sm text-inverso-ink-2">
              Acervo aberto de planos de aula com metodologias ativas. De professor para professor.
            </p>
          </div>

          <nav aria-label="Planoteca" className="flex flex-col gap-2">
            <Titulo>Planoteca</Titulo>
            <ul className="flex list-none flex-col p-0">
              <ItemLink to="/">Início</ItemLink>
              <ItemLink to="/biblioteca">Biblioteca</ItemLink>
              <ItemLink to="/blog">Blog</ItemLink>
              <ItemLink to="/entrar">Entrar</ItemLink>
            </ul>
          </nav>

          <nav aria-label="Para quem escreve" className="flex flex-col gap-2">
            <Titulo>Para quem escreve</Titulo>
            <ul className="flex list-none flex-col p-0">
              <ItemLink to="/entrar">Entrar para escrever</ItemLink>
              <ItemLink to="/blog">Ler o Blog</ItemLink>
            </ul>
            <p className="max-w-[32ch] text-sm text-inverso-ink-2">
              Professor escreve, o texto nasce pendente, um administrador lê e publica.
            </p>
          </nav>

          <div className="flex flex-col gap-2">
            <Titulo>Contato</Titulo>
            <a
              href={`mailto:${EMAIL}`}
              className="flex min-h-11 items-center text-inverso-ink hover:underline"
            >
              {EMAIL}
            </a>
          </div>
        </div>

        <p className="mt-8 border-t border-inverso-linha pt-5 font-mono text-xs tracking-[0.1em] text-inverso-ink-2 uppercase">
          © 2026 Planoteca
        </p>
      </Container>
    </footer>
  )
}
