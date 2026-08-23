# Como testar a Planoteca

Guia para rodar o projeto inteiro na sua máquina, sem nenhuma conta na nuvem.

## O que você precisa

- Docker (para o PostgreSQL)
- .NET 10 SDK
- Node 22 ou mais novo

## 1. Subir o banco

```bash
cd planoteca-api
docker compose up -d db
```

O `.env` já existe, com uma senha aleatória gerada no desenvolvimento. Se ele
tiver sumido, copie de `.env.template` e preencha `POSTGRES_PASSWORD`.

O compose tem healthcheck: espere o container ficar `healthy` antes de seguir.

```bash
docker ps --format '{{.Names}}\t{{.Status}}'
```

## 2. Aplicar o schema

```bash
cd planoteca-api
dotnet ef database update --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api
```

Isso cria as 11 tabelas e semeia o vocabulário.

São 13 componentes, 7 séries e as 41 metodologias do Guia.

Validar:

```bash
docker exec planoteca-api-db-1 psql -U postgres -d planoteca \
  -c "select tipo, count(*) from metodologia group by tipo;" \
  -c "select count(*) from serie;" \
  -c "select count(*) from componente;"
```

Esperado: 16 metodologias, 13 técnicas, 12 ferramentas; 7 séries; 13 componentes.

## 3. Subir a API

```bash
cd planoteca-api
dotnet run --project src/SaraivaTech.Planoteca.Api
```

Ela sobe em `https://localhost:7206` e `http://localhost:5226`.
Documentação interativa: `https://localhost:7206/scalar/v1`.

A connection string vem de `appsettings.Local.json`, que é gitignored e já
está preenchido.

## 4. Subir o front

```bash
cd planoteca-web
npm install
npm run dev
```

Ele precisa de `VITE_URL_API` — o `.env.local` já existe apontando para a API
local. Sem essa variável, o build falha com uma mensagem que não menciona o
Vite.

## 5. O que dá para testar

### Sem login (o acervo é público)

| Caminho | O que ver |
|---|---|
| `/` | Landing, com atalhos por componente e por série |
| `/biblioteca` | Filtros por série, componente e metodologia; busca |
| `/biblioteca/{id}` | Ficha do plano: objetivo, recursos, roteiro, download |
| `/blog` | Lista de textos publicados |
| `/blog/{id}` | Leitura de um texto |

**O acervo começa vazio.** Para ver a Biblioteca com conteúdo, cadastre um
plano pelo painel, abaixo.

Outra saída é `npm run e2e`, que roda contra dados simulados.

### Com login (Firebase)

O login existe e funciona — mas precisa de um projeto no Firebase.

**Sem configurar**, a tela de entrar avisa que o login está indisponível, e o
resto do site continua de pé. É o comportamento esperado, não um defeito.

**Para habilitar**, no console do Firebase:

1. Crie um projeto
2. Em *Authentication*, habilite **Google** e **E-mail/senha**
3. Em *Configurações do projeto*, copie os dados do app web

No `planoteca-web/.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
```

No `planoteca-api/src/SaraivaTech.Planoteca.Api/appsettings.Local.json`:

```json
{ "Firebase": { "ProjectId": "seu-projeto" } }
```

O `ProjectId` é o mesmo dos dois lados. A API deriva dele os endereços de
validação, e não precisa de segredo nenhum para VALIDAR token.

Estes valores do front são **públicos** por natureza: viajam no bundle do
navegador. O que protege o projeto são as regras e a lista de domínios
autorizados no console.

### O primeiro administrador

Todo cadastro nasce **professor**. Não existe caminho de código que crie um
administrador — é deliberado.

Depois de entrar uma vez, promova a si mesmo:

```bash
docker exec planoteca-api-db-1 psql -U postgres -d planoteca -c "
update pessoa set papel='administrador' where email='SEU-EMAIL-AQUI';"
```

A partir daí o menu mostra as telas de administração:

| Rota | Tela | Quem vê |
|---|---|---|
| `/admin/moderacao` | Fila de textos aguardando aprovação | administrador |
| `/admin/planos` | Gestão do acervo: publicar, despublicar, remover | administrador |
| `/admin/catalogar` | Formulário de catalogação | administrador |
| `/admin/escrever` | Escrever para o blog | qualquer conta |

### O upload de PDF ainda não funciona

Falta a credencial do Cloudflare R2.

Ao catalogar, a API responde dizendo qual configuração falta. É o
comportamento esperado, não um defeito.

Para testar a catalogação **sem** o R2, insira um plano direto no banco:

```bash
docker exec planoteca-api-db-1 psql -U postgres -d planoteca -c "
insert into plano (id,titulo,autoria,objetos_conhecimento,objetivo,expectativas_aprendizagem,arquivo_url,situacao,publicado_em,duracao_aulas)
values (gen_random_uuid(),'Escape Room: Missao Termoscopio','Anna Ruth','Escalas Termometricas.','Promover aprendizagem ativa.','Converter entre escalas.','https://exemplo/x.pdf','publicado',now(),2);
insert into plano_componente select p.id, c.id, true from plano p, componente c where c.nome='Química' limit 1;
insert into plano_serie select p.id, s.id from plano p, serie s where s.nome='2ª série' limit 1;"
```

### Testar o blog de ponta a ponta

Com o Firebase configurado, o cadastro nasce sozinho no primeiro acesso.

1. Entre com uma conta — ela nasce professor
2. Escreva em `/admin/escrever`; o texto entra na fila
3. Promova-se a administrador pelo SQL acima
4. Modere em `/admin/moderacao`: publicar, ou devolver com um comentário
5. Veja o texto aparecer em `/blog`

Devolver ou recusar **exige** comentário — a API recusa sem ele. É a regra que
impede a moderação de virar silêncio.

## 6. Rodar as suítes

```bash
# API
cd planoteca-api && dotnet build && dotnet test

# Front
cd planoteca-web
npm run lint     # eslint + guarda de tokens de cor
npm run test     # vitest
npm run build    # typecheck dos 3 tsconfig + build
npm run e2e      # playwright, contra simulação
```

Os testes de integração da API são pulados quando o banco não está de pé.

A razão: a suíte precisa rodar na máquina de quem não subiu o Docker. Um
vermelho por falta de infraestrutura treina a pessoa a ignorar vermelho.

## 7. O que falta para publicar

Três contas, e nada mais:

| Serviço | O que criar | O que me dizer |
|---|---|---|
| Cloudflare R2 | bucket `planoteca-planos`, token *Object Read & Write*, domínio público, CORS liberado para o domínio do front | `Account ID`, `Access Key`, `Secret`, URL pública |
| Neon | projeto, região `aws-us-east-1` | connection string com `SSL Mode=Require` |
| Render | conectar o repositório — ele lê o `render.yaml` sozinho | só preencher as chaves `sync: false` |
| Vercel | root `planoteca-web` | definir `VITE_URL_API` **antes** do primeiro deploy |

## Lacunas conhecidas

1. **O login exige um projeto no Firebase.** Sem ele, a tela avisa e o resto
   do site funciona.

   As rotas administrativas já exigem `[Authorize]`. O autor e o moderador
   saem do token, nunca do corpo da requisição.
2. **Upload depende do R2.** Sem credencial, a catalogação falha com mensagem
   clara.
3. **Arquivo órfão.** Se a catalogação falhar depois do upload, o PDF fica no
   bucket sem plano. Precisa de rotina de limpeza.
4. **`/pessoas`** ainda existe como rota, mas saiu do menu — é andaime do
   boilerplate.
