<!-- gerado de docs/specs/2026-08-22-boilerplate-pessoal.html
     sha256 da fonte: 4d5ec0169e850645
     em: 2026-08-22T12:54
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Boilerplate pessoal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar a marca do cliente pela marca propria, e declarar a paleta como ponto de troca.

**Architecture:** o marcador de geracao vive no `New-Project.ps1` e nos arquivos que ele varre. A
cor de marca vive no `tema.css`, em tres camadas. O desenho vive num componente so.

**Tech Stack:** React 19, Vite 6, TypeScript estrito, Tailwind v4, Vitest, Playwright, PowerShell.

## Global Constraints

- O alvo e o repositorio `fotus-default-web`. Nada fora dele e alterado.
- O nome novo e `planoteca-web`. O titulo novo e `Planoteca`.
- As citacoes ao back-end `fotus-default-api` ficam. Elas sao proveniencia de contrato real.
- A paleta continua azul e dourado. Nenhum valor de cor e alterado.
- `src/shared/api/schema.d.ts` e gerado por `npm run api:sync`. Nao se altera a mao.
- Os documentos em `docs/` dos ciclos anteriores nao sao reescritos.
- A fundacao fica intacta: `src/entities/`, `src/shared/`, `src/components/ui/`.
- O git continua local. Nenhum comando publica o repositorio.
- Cada task executa `git reset` antes de preparar o commit, e adiciona arquivo por caminho.

## Fontes

| Caminho | O que decide |
|---|---|
| `docs/specs/2026-08-22-boilerplate-pessoal.md` | o contrato de cada requisito |
| `New-Project.ps1` | os dois literais e as extensoes que ele processa |
| `src/entities/sessao/deposito.ts` | a chave e o evento de sessao |
| `src/entities/sessao/deposito.test.ts` | o teste que afirma a chave literal |
| `src/components/marca/Marca.tsx` | a assinatura a preservar, e o desenho a trocar |
| `src/app/estilos/tema.css` | onde o bloco de ponto de troca entra |
| `src/pages/design-system/tokensReferencia.ts` | o nome do grupo de tokens de marca |
| `src/pages/design-system/PaginaDesignSystem.tsx` | o consumo desse grupo |
| `src/pages/design-system/PaginaDesignSystem.test.tsx` | o teste de paridade dos tokens |
| `README.md` | a instrucao de geracao, e onde a de troca de paleta entra |

---

### Task 1: Marcador de geracao

**Papel:** escrita
**Verificação:** `npm run typecheck && npm run build`

**Fontes:**
- `docs/specs/2026-08-22-boilerplate-pessoal.md` — RF-01, a tabela de arquivo e linha
- `New-Project.ps1` — os dois literais que ele busca

**Files:**
- Modify: `package.json`, `package-lock.json`, `.env.example`, `index.html`, `New-Project.ps1`
- Modify: `src/app/shell/BarraLateral.tsx`, `src/pages/entrar/PaginaEntrar.tsx`
- Modify: `src/pages/design-system/PaginaDesignSystem.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: os dois literais novos, que as tasks seguintes assumem.

- [x] **Step 1: Trocar os oito pontos da tabela do RF-01**

Cada troca e literal. `fotus-default-web` vira `planoteca-web`. `Fotus Default` vira
`Planoteca`.

O `package-lock.json` tem o `name` em dois lugares: na raiz e no pacote `""`. Os dois sao alterados.

O `New-Project.ps1:31` e `:33` sao a fonte do proprio mecanismo. Sem eles, a geracao busca um
literal que nao existe mais e nao troca nada.

- [x] **Step 2: Confirmar que nenhum marcador sobrou**

```bash
grep -rn "fotus-default-web\|Fotus Default" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs --exclude-dir=dist .
```

Esperado: nenhuma linha.

- [x] **Step 3: Executar a verificacao**

```bash
npm run typecheck && npm run build
```

Esperado: codigo 0 nos dois.

- [x] **Step 4: Commitar**

```bash
git reset
git add package.json package-lock.json .env.example index.html New-Project.ps1 src/app/shell/BarraLateral.tsx src/pages/entrar/PaginaEntrar.tsx src/pages/design-system/PaginaDesignSystem.tsx
git commit -m "refactor: o marcador de geracao passa a ser planoteca-web"
```

---

### Task 2: Chave de runtime

**Papel:** escrita
**Verificação:** `npm run test -- src/entities/sessao`

**Fontes:**
- `docs/specs/2026-08-22-boilerplate-pessoal.md` — RF-02, os dois valores literais
- `src/entities/sessao/deposito.ts` — as constantes das linhas 3 e 4
- `src/entities/sessao/deposito.test.ts` — a linha 11 e o titulo da linha 43

**Files:**
- Modify: `src/entities/sessao/deposito.ts`, `src/entities/sessao/deposito.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `CHAVE = 'app.sessao'`, `EVENTO_SESSAO = 'app:sessao'`.

- [x] **Step 1: Confirmar que o teste afirma a chave velha**

```bash
grep -n "fotus" src/entities/sessao/deposito.test.ts
```

Esperado: a linha 11 e a linha 43.

- [x] **Step 2: Trocar as duas constantes**

```ts
const CHAVE = 'app.sessao'
const EVENTO_SESSAO = 'app:sessao'
```

- [x] **Step 3: Alterar o teste no mesmo commit**

A linha 11 do teste declara a propria copia da chave. O titulo do caso da linha 43 cita o valor
literal na prosa. Os dois passam a citar `app.sessao`.

- [x] **Step 4: Executar a verificacao**

```bash
npm run test -- src/entities/sessao
```

Esperado: codigo 0, e nenhum caso pulado.

- [x] **Step 5: Commitar**

```bash
git reset
git add src/entities/sessao/deposito.ts src/entities/sessao/deposito.test.ts
git commit -m "refactor: a chave de sessao perde o nome do cliente"
```

---

### Task 3: A paleta como ponto de troca

**Papel:** analise
**Verificação:** `npm run test -- src/pages/design-system && node scripts/verifica-tokens.mjs`

**Fontes:**
- `docs/specs/2026-08-22-boilerplate-pessoal.md` — RF-03 e RF-05
- `src/app/estilos/tema.css` — as tres camadas, e onde o bloco entra
- `src/pages/design-system/tokensReferencia.ts` — o grupo a renomear
- `src/pages/design-system/PaginaDesignSystem.tsx` — o consumo do grupo
- `src/pages/design-system/PaginaDesignSystem.test.tsx` — o teste de paridade

**Files:**
- Modify: `src/app/estilos/tema.css`, `src/pages/design-system/tokensReferencia.ts`
- Modify: `src/pages/design-system/PaginaDesignSystem.tsx`
- Modify: `src/pages/design-system/PaginaDesignSystem.test.tsx`
- Modify: `scripts/verifica-tokens.mjs`, `src/app/providers/TemaProvider.tsx`

**Interfaces:**
- Consumes: o nome novo da Task 1.
- Produces: `TOKENS_COR_MARCA`, e o bloco delimitado no `tema.css`.

- [x] **Step 1: Escrever o bloco de ponto de troca no topo do tema.css**

O bloco vem antes do `@theme`. Ele tem marca de inicio e de fim, buscavel por texto:

```css
/* ==========================================================================
   PONTO DE TROCA — a cor de marca deste projeto
   --------------------------------------------------------------------------
   Um projeto novo troca os valores DESTE bloco, e mais nada. As primitivas do
   `@theme` e os nomes semanticos de `:root` se ajustam sozinhos, porque
   apontam para aqui por `var()`.

   O que NAO se troca: o nome do token. `--brand` continua se chamando
   `--brand` — o JSX escreve `bg-primary`, e quem decide qual cor isso vira e
   a camada semantica, nunca o componente.

   FIM DO PONTO DE TROCA
   ========================================================================== */
```

Os valores de marca ficam declarados aqui, com o nome de cada um. Nenhum hex e alterado: os
valores atuais sao copiados dos lugares onde ja moram.

- [x] **Step 2: Alterar os dois comentarios que citam o cliente**

A linha 5 diz que a paleta permanece. Ela passa a dizer que a paleta e exemplo preenchido, e
aponta para o bloco do Step 1.

A linha 102 chama o grupo de "nomes proprios da Fotus". Ele passa a ser "nomes proprios da
marca".

- [x] **Step 3: Renomear TOKENS_COR_FOTUS**

```bash
grep -rn "TOKENS_COR_FOTUS" src/
```

Esperado: tres arquivos. Todos passam a citar `TOKENS_COR_MARCA`.

As linhas 118, 184 e 193 da pagina tambem perdem o nome do cliente.

- [x] **Step 4: Limpar o residuo de comentario**

O `scripts/verifica-tokens.mjs:174` e o `src/app/providers/TemaProvider.tsx:63` citam o cliente
em comentario. Os dois passam a dizer "do tema".

- [x] **Step 5: Executar a verificacao**

```bash
npm run test -- src/pages/design-system
node scripts/verifica-tokens.mjs
```

Esperado: codigo 0 nos dois. O teste de paridade prova que todo token declarado aparece na
pagina.

- [x] **Step 6: Provar que a guarda continua recusando**

```bash
echo 'export const X = () => <div className="bg-blue-500" />' > src/pages/design-system/plantado.tsx
node scripts/verifica-tokens.mjs; echo "codigo=$?"
rm src/pages/design-system/plantado.tsx
```

Esperado: codigo 1, com achado apontando `bg-blue-500`.

- [x] **Step 7: Commitar**

```bash
git reset
git add src/app/estilos/tema.css src/pages/design-system/tokensReferencia.ts src/pages/design-system/PaginaDesignSystem.tsx src/pages/design-system/PaginaDesignSystem.test.tsx scripts/verifica-tokens.mjs src/app/providers/TemaProvider.tsx
git commit -m "feat: a paleta vira ponto de troca declarado no tema"
```

---

### Task 4: A marca

**Papel:** escrita
**Verificação:** `npm run typecheck && node scripts/verifica-tokens.mjs`

**Fontes:**
- `docs/specs/2026-08-22-boilerplate-pessoal.md` — RF-04, a assinatura a preservar
- `src/components/marca/Marca.tsx` — o componente inteiro

**Files:**
- Modify: `src/components/marca/Marca.tsx`

**Interfaces:**
- Consumes: os tokens de marca da Task 3.
- Produces: `Marca({ tamanho, tom, className })` — a mesma assinatura de hoje, com `tom` em `solido` por padrao.

- [x] **Step 1: Ler a assinatura atual antes de alterar o desenho**

```bash
sed -n '1,58p' src/components/marca/Marca.tsx
```

O `tamanho` sai em `26` por padrao. O `tom` aceita `cor` e `solido`. O `solido` herda
`currentColor`, e o `cor` pinta com os tokens de marca.

- [x] **Step 2: Trocar o SVG por um simbolo geometrico**

O desenho novo nao cita ramo nenhum. Ele respeita os dois tons: o `solido` usa `currentColor`, e
o `cor` usa os mesmos tokens que o navio usava.

O `viewBox` fica quadrado, para o `tamanho` valer como lado.

- [x] **Step 3: Alterar o comentario do topo**

Ele deixa de citar o navio e o prototipo de origem. Ele passa a dizer que o desenho e um simbolo
neutro, e que quem gera um projeto o substitui.

O marcador de titulo que o `New-Project.ps1` troca continua no arquivo.

- [x] **Step 4: Executar a verificacao**

```bash
npm run typecheck
node scripts/verifica-tokens.mjs
```

Esperado: codigo 0 nos dois.

Nao existe suite em `src/components/`. O `npm run test` apontado para la sai com codigo 1 por
falta de arquivo, nunca por defeito.

- [x] **Step 5: Commitar**

```bash
git reset
git add src/components/marca/Marca.tsx
git commit -m "feat: a marca vira simbolo geometrico neutro"
```

---

### Task 5: Residuo e documento

**Papel:** escrita
**Verificação:** `npm run test && npm run lint`

**Fontes:**
- `docs/specs/2026-08-22-boilerplate-pessoal.md` — RF-05, RF-06 e RF-07
- `README.md` — a instrucao de geracao
- `CLAUDE.md` — o que ele diz do par de back-end

**Files:**
- Modify: `src/features/autenticar/api.test.ts`, `contracts/openapi-v1.json`
- Modify: `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`

**Interfaces:**
- Consumes: o bloco de ponto de troca da Task 3.
- Produces: o passo a passo de troca de paleta no README.

- [x] **Step 1: Trocar o dado de exemplo do teste**

O `ana@fotus.com` aparece em tres linhas do `src/features/autenticar/api.test.ts`. Ele vira
`ana@exemplo.com` nas tres.

- [x] **Step 2: Trocar o title do contrato**

O `contracts/openapi-v1.json:4` tem `"title": "Fotus Default API"`. Ele vira `Planoteca API`.

As descricoes que citam `Fotus.Default.*` FICAM. Elas apontam para arquivo e linha do back-end.

O exemplo de filtro `LastName:=:Fotus` tambem fica: o `npm run api:sync` o sobrescreve contra a
API viva, e alterar a mao quebraria o `api:check`.

- [x] **Step 3: Confirmar que o contrato continua batendo**

```bash
npm run api:check
```

Esperado: codigo 0. O `title` nao entra no `schema.d.ts`, entao o gerado fica igual.

- [x] **Step 4: Alterar os tres documentos**

O `README.md`, o `CLAUDE.md` e o `CONTRIBUTING.md` passam a citar `planoteca-web`.

O `README.md` ganha uma secao de troca de paleta, com tres passos.

Abra o `tema.css`. Ache o bloco `PONTO DE TROCA`. Substitua os valores dele.

A secao avisa que os nomes de token ficam como estao.

O `CLAUDE.md` mantem o que diz do `fotus-default-api` e das duas lacunas dele.

- [x] **Step 5: Executar a verificacao**

```bash
npm run test
npm run lint
```

Esperado: codigo 0 nos dois.

- [x] **Step 6: Confirmar que so as citacoes do RF-06 sobraram**

```bash
grep -rniI "fotus" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs --exclude-dir=dist . | grep -v "Fotus.Default\|fotus-default-api\|LastName:=:Fotus"
```

Esperado: nenhuma linha.

- [x] **Step 7: Commitar**

```bash
git reset
git add src/features/autenticar/api.test.ts contracts/openapi-v1.json README.md CLAUDE.md CONTRIBUTING.md
git commit -m "docs: o boilerplate passa a se chamar planoteca-web"
```

---

### Task 6: Portao final e projeto gerado

**Papel:** analise
**Verificação:** `npm run lint && npm run typecheck && npm run test && npm run api:check && npm run build && npm run e2e`

**Fontes:**
- `docs/specs/2026-08-22-boilerplate-pessoal.md` — os criterios de aceite
- `New-Project.ps1` — o mecanismo de geracao, e o encoding sem BOM

**Files:**
- Modify: nenhum, exceto correcao que a bateria exigir.

**Interfaces:**
- Consumes: tudo das tasks anteriores.
- Produces: o veredito.

- [x] **Step 1: Executar a bateria inteira no boilerplate**

```bash
npm run lint && npm run typecheck && npm run test && npm run api:check && npm run build && npm run e2e
```

Esperado: codigo 0 nos seis. O `e2e` executa por ultimo de proposito — ele foi o que ficou vermelho
sem ninguem notar no ciclo anterior.

- [x] **Step 2: Gerar um projeto de prova**

```bash
pwsh -File New-Project.ps1 -Name prova-pessoal -Titulo "Prova Pessoal" -OutputPath ../prova-pessoal
```

Esperado: o script cria o destino.

- [x] **Step 3: Confirmar que nenhum arquivo carrega BOM**

```bash
grep -rlI $'\xef\xbb\xbf' ../prova-pessoal --exclude-dir=node_modules
```

Esperado: nenhuma linha. Este passo existe porque o BOM ja quebrou 21 suites uma vez, e o
boilerplate continuava verde.

- [x] **Step 4: Confirmar que nenhum marcador sobrou no gerado**

```bash
grep -rn "planoteca-web\|Planoteca" ../prova-pessoal --exclude-dir=node_modules --exclude-dir=.git
```

Esperado: nenhuma linha.

- [x] **Step 5: Executar a bateria dentro do gerado**

```bash
cd ../prova-pessoal && npm ci && npm run lint && npm run typecheck && npm run test && npm run build
```

Esperado: codigo 0 em todos.

- [x] **Step 6: Remover o projeto de prova**

```bash
rm -rf ../prova-pessoal
```

- [ ] **Step 7: Renomear a pasta do repositorio**

> **PENDENTE.** O rename falhou pelo agente, com "acesso negado".
>
> A sessao mantem a propria pasta aberta como diretorio de trabalho. O Windows recusa renomear
> diretorio em uso. Nem o `Rename-Item`, nem um processo `cmd` desacoplado passaram.
>
> Execute o comando abaixo num terminal fora da sessao do agente. Feche a pasta em qualquer
> editor antes. Depois dele, o Step 8 fecha o ciclo.

O rename e o ultimo passo, porque ele invalida o caminho de trabalho de tudo o que veio antes.

```bash
cd .. && mv fotus-default-web planoteca-web
```

Depois do rename, confirme que nada dentro cita o caminho antigo:

```bash
grep -rn "fotus-default-web" planoteca-web --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist
```

Esperado: nenhuma linha.

- [ ] **Step 8: Commitar**

```bash
git reset
git add -A
git commit -m "chore: veredito final do ciclo de despersonalizacao"
```

---

## Divergencias registradas

Anotadas na execucao, com o commit que as carrega.

| Task | Divergencia | Commit |
|---|---|---|
| 3 | O `blocoTheme` do `verifica-tokens.mjs` buscava `@theme` no texto cru. O bloco novo cita a diretiva em comentario, e a busca casava ali. A guarda saia com codigo 1 por falso negativo. A busca passou a correr sobre o texto sem comentario | `c6f8aea` |
| 3 | Sao sete valores de marca por tema, nao dez. O "10" era rotulo de um SVG da spec, e nunca requisito | `8882498` |
| 4 | O RF-04 transcreveu o padrao de `tom` errado. Ele sempre foi `solido`. O componente esta fiel ao original | `2d92d1c` |
| 5 | O `PaginaEntrar.tsx:18` esta no RF-05 mas faltava nos `Files` de toda task. Entrou na Task 5 | `488aebd` |
| 6 | O `pwsh` nao existe nesta maquina. So ha Windows PowerShell 5.1, chamado por `powershell -NoProfile -File` | — |
| 6 | **A Task 1 introduziu um defeito de geracao.** O `-replace` do PowerShell ignora caixa, e `Planoteca` e prefixo de `planoteca-web`. Trocar o titulo antes do nome fazia o pacote gerado nascer como `<Titulo>-web`. O par anterior nao colidia. Corrigido com ordem invertida e `-creplace` | `c4da1a6` |

O defeito da Task 6 so aparece dentro do projeto gerado. A bateria do boilerplate nunca o
pegaria, do mesmo modo que nao pegava o BOM.

---

## Self-Review

- [x] Todo `### Task N` usa a palavra inglesa `Task`.
- [x] Toda task tem `Papel`: `busca`, `escrita` ou `analise`.
- [x] Toda task tem `Verificação` com um comando.
- [x] O comando de `Verificação` executa a partir da raiz do repositorio.
- [x] Toda task tem `Fontes`, com caminho ou com a palavra `nenhuma`.
- [x] Todo caminho de `Fontes` existe no disco.
- [x] Todo passo tem comando e resultado esperado.
- [x] Todo bloco de codigo usa cerca, nunca indentacao de quatro espacos.
- [x] Nenhuma task depende de arquivo que nenhuma task anterior criou.
