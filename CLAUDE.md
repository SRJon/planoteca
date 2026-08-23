# CLAUDE.md

Guia para o Claude Code na raiz da Planoteca. Cada sub-projeto tem o seu:
`planoteca-web/CLAUDE.md` e `planoteca-api/CLAUDE.md`. Leia o da pasta em que for
mexer. Este arquivo cobre o que é comum aos dois, e o que o README não diz.

Contexto do produto: [README.md](README.md).

---

## O que este repositório é

Monorepo de duas pastas irmãs, sem workspace nem ferramenta de orquestração.
`planoteca-web` e `planoteca-api` sobem separados, com comandos próprios.

Os dois nasceram de boilerplates da SaraivaTech. Isso tem uma consequência que
custa tempo se você esquecer: **há código de exemplo que não pertence à
Planoteca**. A fatia `pessoa` no front (`src/entities/pessoa`,
`src/features/filtrar-pessoas`, `src/pages/pessoas`) e o `PersonSample` no back
são andaime. Não copie o padrão errado deles — copie o padrão certo, que é o
mesmo de `entities/plano`.

## Ordem de leitura antes de mexer

1. `Docs/todo.md` — o que está em curso
2. `Docs/lessons.md` — o que já deu errado aqui
3. O `CLAUDE.md` da pasta alvo
4. `design/tokens.css`, se a tarefa toca interface

## As decisões que não se renegociam

Cada uma delas já foi discutida. Se uma tarefa parecer pedir o contrário, pare e
pergunte, não implemente.

**Baixar plano nunca exige conta.** Nenhuma tela de plano, nenhum download,
nenhuma listagem pode ficar atrás de `RotaProtegida`. Login existe para escrever
no blog e para administrar. Um "só uma tela de e-mail antes do PDF" é a barreira
que o produto existe para não ter.

Isso está implementado em duas cascas, em `planoteca-web/src/app/`:

| Casca | Rotas | Guarda |
|---|---|---|
| `shell/LayoutPublico.tsx` | `/` (landing), `/biblioteca`, `/blog` | nenhuma |
| `shell/Shell.tsx` | `/pessoas` e o futuro painel administrativo | `RotaProtegida` |

E está travado por teste: `src/app/rotas/guarda.test.tsx` (bloco "o acervo é
público") e `e2e/biblioteca.spec.ts`, que filtra e pagina sem nunca fazer login.
Se um deles falhar porque alguém moveu a Biblioteca para dentro da guarda, o
teste está certo. A alteração é que está errada.

Do lado da API a regra é a mesma: quando `GET /api/v1/lesson-plans` e o
download de PDF nascerem, eles **não** levam `[Authorize]`.

**Autenticação é do Firebase; autorização é nossa.** Esta é a linha que não
se cruza.

O Firebase prova quem é a pessoa e emite o token.

O **papel** — professor ou administrador — mora na coluna `pessoa.papel`. O
`PapelClaimsMiddleware` o injeta como claim depois de resolver a pessoa.

Nunca use custom claim do Firebase para papel. O console dele é um lugar onde
alguém altera permissão sem passar por revisão.

Provedores habilitados: **Google e e-mail/senha** (decidido em 2026-08-23,
revisando o "só Google" do briefing original). A senha é guardada pelo
Firebase; não há hash no nosso banco.

**O primeiro administrador nasce por SQL.** Todo cadastro nasce professor —
não existe caminho de código que crie um administrador. Ver o
`COMO-TESTAR.md`.

**Blog passa por moderação.** Professor escreve, o texto nasce pendente,
administrador aprova. Não há publicação direta, nem para professor veterano.

**Componente curricular e ano são listas fechadas.** Estão em
`planoteca-web/src/entities/plano/modelo.ts` como union de literais, de
propósito. Acrescentar um componente altera três lugares: o union, o token de cor
em `tema.css` e a sigla de duas letras. Não relaxe para `string` para "facilitar":
o tipo fechado é o que impede um card nascer sem cor.

**Cor mora só no tema.** `npm run lint` reprova cor literal em componente. Isso
não é preferência de estilo, é o que sustenta a promessa de trocar a paleta num
arquivo só.

## Stack de hospedagem — tudo em plano gratuito

Decisão de 2026-08-22. A restrição que a governa: **custo zero**. Toda escolha
técnica que amarre a um serviço pago precisa ser questionada antes de entrar.

| Camada | Serviço | Consequência para o código |
|---|---|---|
| Front-end | **Vercel** | build estático do Vite. Detecta o framework e trata o fallback de SPA sozinho |
| Back-end | Render | plano gratuito **hiberna** após inatividade — a primeira requisição depois disso demora |
| Banco | Neon (PostgreSQL) | serverless, com escala a zero. Exige SSL e tolerância a conexão fria |
| Arquivos | Cloudflare R2 | API compatível com S3, sem taxa de egresso. O PDF do plano mora aqui |

### O que isso impõe ao código

- **`arquivo_url` aponta para o R2**, não para o disco da API. O Render tem sistema
  de arquivos efêmero: o que for gravado nele some no próximo deploy.
- **O upload usa URL pré-assinada.** O PDF vai do navegador direto para o R2. A API
  só assina a URL e a guarda. Passar o arquivo por ela gastaria a memória do plano
  gratuito.
- **A leitura do PDF é pública e anônima**, servida pelo domínio do R2. É a mesma
  regra do acervo público, agora também na camada de armazenamento.
- **O banco hiberna.** A connection string do Neon exige `SSL Mode=Require`. A
  primeira consulta depois da hibernação demora alguns segundos, e isso não é erro.
- **A API hiberna.** O front precisa tolerar a primeira requisição lenta sem parecer
  quebrado.
- **Segredo nunca fica versionado.** No Render tudo é variável de ambiente: chave do
  R2, credencial do Google, string do Neon.

**Por que Vercel, e não Azure Static Web Apps** (decidido em 2026-08-22): o
fallback de SPA sai de fábrica. Sem ele, quem abre `/biblioteca?componente=...`
direto — o link que um professor manda para outro — recebe 404. No Azure isso é
um `staticwebapp.config.json` escrito à mão. Some-se o preview por PR de graça e
uma conta a menos.

### Os arquivos de deploy, e o que falta neles

`render.yaml` (raiz) e `planoteca-web/vercel.json` já existem e estão testados
até onde dá sem conta criada. O `Dockerfile` da API foi corrigido e verificado:
`docker run -e PORT=10000` responde na porta injetada, que é como o Render
espera.

O que **não** está nos arquivos, de propósito: todo segredo. As chaves
`sync: false` do `render.yaml` são preenchidas uma vez no painel.

**As duas variáveis que quebram o deploy em silêncio.**

`VITE_URL_API` é obrigatória em tempo de BUILD (`shared/config/ambiente.ts`
lança sem ela). Ela é só a raiz da API: o `PREFIXO = '/api/v1'` já é
concatenado por `shared/api/cliente.ts`. Repeti-lo produz `/api/v1/api/v1`.

`Cors__OrigensPermitidas__0` na API guarda o domínio do front. Sem ela o
navegador recusa toda resposta: a tela carrega e fica vazia, e o erro só
aparece no console. Lista vazia significa nenhuma origem permitida, de
propósito — um front que não carrega denuncia a variável esquecida, enquanto
um curinga a esconderia.

**O deploy da API não é automático até você provar que é.** Duas vezes uma
correção pareceu não funcionar, e a causa era a mesma: o Render continuava
servindo a versão anterior. Funcionalidade nova respondendo 404 enquanto a
antiga responde 401 é a assinatura disso — a rota não existe no binário no
ar. Confirme com `curl` numa rota nova antes de procurar defeito no código.

**O schema é aplicado no arranque da API.** `Program.cs` chama
`MigrateAsync()` antes de aceitar tráfego, porque o Render não oferece passo
de release onde rodar `dotnet ef database update`. É idempotente.

No Vercel, ela entra em *Environment Variables* antes do primeiro deploy.
Esquecê-la produz um build que falha sem mencionar o Vercel.

### Ainda em aberto

- CI/CD: fica para depois de a API estar de pé
- Domínio próprio

## Tom da escrita — código e interface

Professor para professor. Sem verniz de startup, sem "descubra", sem
"revolucione sua sala de aula". Fala como colega.

Em texto de interface: verbo direto, frase curta, sem exclamação.
"Baixar plano", não "Baixe agora seu plano gratuito!".

Comentário de código explica **por quê**, não o quê. O padrão está em
`entities/plano/modelo.ts`: cada decisão fechada tem a razão escrita ao lado.
Siga esse nível quando a escolha não for óbvia — e não comente o óbvio.

Prosa em português correto, com acento. Vale para commit, comentário,
documentação e texto de tela.

## Estado que você não pode assumir como pronto

Verificado em 2026-08-22. Antes de planejar uma tarefa que dependa de qualquer
um destes pontos, confirme que ainda vale:

| Assunto | Estado real |
|---|---|
| Login / `/auth/login` / `/auth/userinfo` | Não existe no back-end. O front escreve contra o contrato; a API devolve 404. |
| Login com Google | Decisão de produto, ainda não implementada. O formulário atual é usuário e senha, herdado do boilerplate. |
| Endpoint de planos | Não existe. A Biblioteca roda contra mocks MSW (`src/teste/servidor.ts` e `e2e/simulacao.ts`). |
| Controllers na API | **Nenhum.** A fatia `PersonSample` foi removida na migração para PostgreSQL. |
| Migrations | Nenhuma versionada. `dotnet ef migrations add Inicial` antes do primeiro `database update`. |
| Blog | Só a rota e uma página de "em breve" (`src/pages/blog/`). Sem entidade, sem endpoint, sem moderação. |
| Painel administrativo | Não começou. |
| `/pessoas` | Andaime de boilerplate, ainda de pé. É para onde o login redireciona hoje, porque ainda não existe uma área de trabalho real. |
| `Api/Policies/` | Código morto herdado, não registrado em lugar nenhum. Alterar esses arquivos não altera o comportamento de nenhuma requisição. |

Se a tarefa pedir "ligar o login", isso é implementação nova nos dois lados, não
conexão de fio existente.

## Trabalhando com a API ausente

Enquanto o endpoint de planos não existe, a UI se desenvolve contra a simulação de
rede. São dois arquivos: `src/teste/servidor.ts` nos testes de unidade e
`e2e/simulacao.ts` no Playwright. Uma fixture nova entra nos dois, senão o e2e passa
com dado que o teste de unidade não conhece.

Quando o endpoint nascer, só `entities/plano/mapeador.ts` altera. Nenhum arquivo de
tela encosta nisso — é para isso que o mapeador existe.

## Portão antes de dizer "pronto"

Nenhuma tarefa de front fecha sem os três verdes, nesta ordem:

```bash
npm run lint     # inclui verifica-tokens
npm run test
npm run build    # typecheck dos 3 tsconfig
```

Tarefa que toca tela roda também `npm run e2e`.

Do lado da API: `dotnet build` e `dotnet test`.

Colar a saída do comando é o que conta como prova. "Deve estar funcionando" não
fecha tarefa.

## Onde escrever documento

- Plano de trabalho e lições: `Docs/todo.md`, `Docs/lessons.md`, sempre markdown
- Spec e plano de implementação: skill `spec-flow`
- Documento de entrega (PR writeup, postmortem, review): skill `doc-entrega`
- Artefato visual: `design/`, HTML single-file, sem JS e sem CDN
- Guia de operação: `docs/guias/`, HTML single-file. O de provisionamento das
  contas está em `docs/guias/2026-08-23-guia-provisionamento.html`

## Commit

Conventional Commits, escopo pelo domínio afetado:

```
feat(plano): adiciona filtro por metodologia
fix(biblioteca): corrige recorte do card em 390px
docs(readme): descreve o painel administrativo
```
