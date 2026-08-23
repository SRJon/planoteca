import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { AutenticacaoProvider } from './providers/AutenticacaoProvider'
import { TemaProvider } from './providers/TemaProvider'
import { queryClient } from './providers/queryClient'
import { Rotas } from './rotas/Rotas'

/**
 * Ordem dos provedores, de fora para dentro: autenticação, cliente de dados,
 * tema, rotas.
 *
 * Autenticação primeiro: constrói o `Cliente` HTTP único da aplicação, e a
 * guarda de rota (lá dentro, em `Rotas`) depende do estado de sessão para
 * decidir o que renderizar — nada abaixo funciona sem isto existir primeiro.
 *
 * Cliente de dados (TanStack Query) em seguida: é genérico, não depende de
 * sessão nenhuma, mas qualquer tela que use `useQuery` precisa dele no
 * caminho até a raiz. Tema não depende de nada disto — fica antes das rotas
 * só porque é mais barato aplicar a classe `.dark` antes da primeira pintura
 * do que depois. Rotas por último: decide QUAL tela aparece, e só faz sentido
 * depois que sessão, dados e tema já existem para ela consumir.
 *
 * `AutenticacaoProvider` lê `shared/config` por dentro, ao contrário do
 * `SessaoProvider` que o antecedeu: a configuração do Firebase é lida pelo
 * SDK na inicialização, e passá-la por prop só empurraria o acoplamento um
 * nível acima sem ganhar testabilidade — os testes montam o provedor real
 * com o Firebase ausente, que é um caminho legítimo da aplicação.
 */
export function App() {
  return (
    <AutenticacaoProvider>
      <QueryClientProvider client={queryClient}>
        <TemaProvider>
          <BrowserRouter>
            <Rotas />
          </BrowserRouter>
        </TemaProvider>
      </QueryClientProvider>
    </AutenticacaoProvider>
  )
}
