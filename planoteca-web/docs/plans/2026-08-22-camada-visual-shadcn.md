<!-- gerado de docs/specs/2026-08-22-camada-visual-shadcn.html
     sha256 da fonte: 3a7a4777e3512a88
     em: 2026-08-22T07:43
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Camada visual em Tailwind e shadcn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o `shared/ui` sai inteiro e da lugar ao shadcn, com Tailwind v4. A fundacao de dados nao e tocada, e a tela `/pessoas` continua verde.

**Architecture:** a troca acontece de baixo para cima. Primeiro a base de estilo, depois os componentes, depois as telas que os consomem. As camadas `entities/`, `shared/api`, `shared/lib` e `shared/config` nao sao alcancadas: elas tem zero import de CSS.

**Tech Stack:** React 19, Vite 6, TypeScript estrito, Tailwind v4, shadcn, Phosphor, Vitest, MSW, Playwright.

## Global Constraints

- O trabalho acontece na `main`. Nenhuma branch nova.
- `entities/`, `shared/api`, `shared/lib` e `shared/config` NAO sao alterados.
- O contrato, o cliente HTTP, a sessao e a permissao nao tem o comportamento alterado.
- A ordem das camadas continua `app -> pages -> features -> entities -> shared`.
- O `@tanstack/react-table` permanece.
- A paleta Fotus, azul e dourado, permanece.
- Os testes executam sem rede.
- Nenhum arquivo `.module.css` sobra em `src/` ao final.

## Fontes

| Caminho | O que decide |
|---|---|
| `src/shared/ui/` | a superficie de 32 exportacoes a cobrir |
| `src/app/estilos/tokens.css` | a paleta a traduzir para `@theme` |
| `src/app/providers/TemaProvider.tsx` | o atributo que vira classe |
| `scripts/verifica-tokens.mjs` | a regra a reapontar |
| `src/pages/pessoas/` | a tela que prova a fundacao |
| `e2e/camadas.spec.ts` | a ordem de pintura a preservar |
| `New-Project.ps1` | o marcador `Fotus Default` na marca |
| `docs/specs/2026-08-06-boilerplate-front.html` | a spec anterior, que criou o que esta altera |

---

### Task 1: Instalar o Tailwind e traduzir os tokens

**Papel:** analise
**Verificação:** `npm run build && node scripts/verifica-tokens.mjs`

**Fontes:**
- `src/app/estilos/tokens.css` — a paleta a traduzir
- `src/app/estilos/tipografia.css` — a escala tipografica
- `src/app/estilos/base.css` — o reset que o Tailwind cobre em parte
- `vite.config.ts` — onde o plugin entra

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `src/app/estilos/tema.css`
- Delete: `src/app/estilos/tokens.css`, `tipografia.css`, `espaco.css`, `base.css`

Cumpre RF-01 e RF-02.

> Nota de execucao, 2026-08-22: o bloco `@theme` da v4 exige valor estatico. Ele nao aceita
> valor que troque entre claro e escuro. A paleta ficou em duas camadas: as primitivas no `@theme`,
> e os nomes semanticos num `:root`/`.dark` que aponta por `var()`. Os nomes antigos sobrevivem
> nessa segunda camada enquanto os 24 arquivos de estilo de modulo existirem.
>
> Achado do subagente: o `@layer` derruba a folha inteira no jsdom 25. O `style.sheet` volta
> nulo, e nenhuma regra anterior sobrevive. O `Shell.test.tsx` injeta o CSS real, e passou a
> remover o `@layer` antes de injetar. O motivo esta comentado no teste.

**Interfaces:**
- Produces: o bloco `@theme` com a paleta Fotus, em claro e escuro.

- [x] **Step 1: Instalar o Tailwind**

```bash
npm install tailwindcss @tailwindcss/vite
```

Esperado: os dois pacotes entram no `package.json`.

- [x] **Step 2: Acrescentar o plugin ao Vite**

O `vite.config.ts` recebe `tailwindcss()` na lista de plugins, ao lado do `react()`. O alias
`@` permanece.

- [x] **Step 3: Traduzir os tokens**

O `tema.css` abre com `@import "tailwindcss"`. A paleta vira bloco `@theme`. O tema escuro vira
a classe `.dark`, e nao o atributo `data-theme`.

Preserve os valores de azul e de dourado. O que era escala de espaco pode sair: o Tailwind ja
traz a dele.

- [x] **Step 4: Confirmar que o artefato sai**

```bash
npm run build
```

Esperado: codigo 0.

- [x] **Step 5: Commitar**

```bash
git add package.json package-lock.json vite.config.ts src/app/estilos
git commit -m "feat: instala o Tailwind v4 e traduz os tokens para @theme"
```

---

### Task 2: Reapontar o verificador de token

**Papel:** analise
**Verificação:** `node scripts/verifica-tokens.mjs && npm run lint`

**Fontes:**
- `scripts/verifica-tokens.mjs` — a regra a reapontar
- `src/app/estilos/tema.css` — o novo alvo da guarda

**Files:**
- Modify: `scripts/verifica-tokens.mjs`

Cumpre RF-08.

> Nota de execucao, 2026-08-22: as primitivas Fotus usam nome que colide com a paleta embutida
> do Tailwind. O `@theme` declara `--color-blue-500`, e a paleta tem `blue-500`. A guarda
> confere a paleta ANTES do tema, entao `bg-red-500` no JSX reprova mesmo resolvendo para um
> token real. Primitiva e materia-prima, nao nome semantico.
>
> A guarda e lista negra, nao lista branca: `bg-inventado-999` passa. Isso e deliberado. Classe
> que o tema nao declara tambem nao pinta nada. Uma lista branca reprovaria o que e legitimo:
> `bg-[url(...)]`, `bg-gradient-to-r` e classe de plugin.

**Interfaces:**
- Consumes: o `tema.css` da Task 1.
- Produces: a guarda que aceita classe do Tailwind e recusa cor literal.

- [x] **Step 1: Ler a regra atual**

O script hoje varre todo CSS e recusa cor literal fora do `tokens.css`. Ele tambem recusa raio
fora da escala e `z-index` numerico.

- [x] **Step 2: Reapontar**

O alvo passa a ser o bloco `@theme` do `tema.css`. Classe utilitaria do Tailwind e aceita: ela
resolve para token no tempo de build.

Cor literal em arquivo de componente continua recusada. E isso que impede o proximo projeto de
espalhar hex pelo JSX.

- [x] **Step 3: Provar que a guarda ainda morde**

Plante uma cor literal num arquivo de componente e confirme que o script recusa. Depois retire
a cor plantada.

```bash
node scripts/verifica-tokens.mjs
```

Esperado: codigo 1 com a cor plantada, codigo 0 sem ela.

- [x] **Step 4: Commitar**

```bash
git add scripts/verifica-tokens.mjs
git commit -m "refactor: o verificador de token passa a mirar o bloco @theme"
```

---

### Task 3: Inicializar o shadcn e instalar os componentes

**Papel:** escrita
**Verificação:** `npm run typecheck && test -f components.json`

**Fontes:**
- `src/shared/ui/` — a superficie que os componentes precisam cobrir
- `src/shared/lib/cn.ts` — o utilitario que permanece
- `tsconfig.json` — o alias `@` que o shadcn usa

**Files:**
- Create: `components.json`, `src/components/ui/*`
- Modify: `package.json`

Cumpre RF-04 e RF-07.

> Correcao, 2026-08-22: o plano manda `init -d`. Essa flag trava o preset em `base-nova`, que
> usa `@base-ui/react` e nao o Radix. Ela tambem sobrescreve o CSS principal, e destruiu a
> paleta Fotus na primeira tentativa. O comando certo e
> `npx shadcn@latest init -y -b radix -p nova --template vite`.
>
> O plano tambem manda instalar `form`. Esse item nao existe no registry deste preset: o `add`
> executa sem erro e sem gravar arquivo. A substituta e `field`.
>
> Divida com prazo: cinco arquivos de `shared/ui` importam `@radix-ui/react-*`, que saiu do
> `package.json`. Eles resolvem por hoisting do `radix-ui` unificado. Confirmado com
> `npm ci` limpo. Os cinco saem na Task 8, e a divida morre la.

**Interfaces:**
- Consumes: o Tailwind da Task 1.
- Produces: os componentes do shadcn em `src/components/ui/`.

- [x] **Step 1: Inicializar sem interacao**

```bash
npx shadcn@latest init -d
```

Esperado: nasce o `components.json`, e o `cn` e configurado.

- [x] **Step 2: Apontar o cn para o que ja existe**

O `shared/lib/cn.ts` permanece. O `components.json` aponta para ele em vez de criar um segundo.

- [x] **Step 3: Instalar os componentes**

```bash
npx shadcn@latest add button input textarea label card dialog tooltip select dropdown-menu tabs badge table form
```

Esperado: os arquivos nascem em `src/components/ui/`.

- [x] **Step 4: Instalar o Phosphor e remover os Radix antigos**

```bash
npm install @phosphor-icons/react
npm uninstall @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip
```

Esperado: o `package.json` fica sem os cinco pacotes individuais.

- [x] **Step 5: Confirmar que o TypeScript aceita**

```bash
npm run typecheck
```

Esperado: codigo 0. A aplicacao ainda nao compila inteira; as telas vem nas tasks seguintes.

- [x] **Step 6: Commitar**

```bash
git add components.json package.json package-lock.json src/components src/shared/lib
git commit -m "feat: instala o shadcn, o Phosphor e remove os Radix avulsos"
```

---

### Task 4: O tema vira classe

**Papel:** escrita
**Verificação:** `npx vitest run src/app`

**Fontes:**
- `src/app/providers/TemaProvider.tsx` — o provedor a alterar
- `src/app/shell/BarraSuperior.tsx` — quem alterna o tema
- `src/app/estilos/tema.css` — a classe que o CSS espera

**Files:**
- Modify: `src/app/providers/TemaProvider.tsx`
- Modify: os arquivos que leem `data-theme`

Cumpre RF-03.

**Interfaces:**
- Consumes: o `tema.css` da Task 1.
- Produces: a classe `.dark` no elemento raiz.

- [x] **Step 1: Localizar quem depende do atributo**

```bash
grep -rn "data-theme" src
```

Esperado: a lista dos arquivos a alterar.

- [x] **Step 2: Trocar o atributo pela classe**

O `TemaProvider` passa a escrever `.dark` no elemento raiz. O atributo sai.

- [x] **Step 3: Confirmar que os testes de app passam**

```bash
npx vitest run src/app
```

Esperado: codigo 0.

- [x] **Step 4: Commitar**

```bash
git add src/app/providers src/app/shell
git commit -m "refactor: o tema vira a classe dark, e nao o atributo data-theme"
```

---

### Task 5: Reescrever o shell

**Papel:** escrita
**Verificação:** `npx vitest run src/app/shell`

**Fontes:**
- `src/app/shell/` — os quatro componentes a reescrever
- `src/components/ui/` — os componentes do shadcn
- `src/app/shell/permissoes.ts` — a logica de menu, que NAO e alterada

**Files:**
- Modify: `src/app/shell/Shell.tsx`, `BarraLateral.tsx`, `BarraSuperior.tsx`, `Trilha.tsx`
- Delete: os `.module.css` do shell

Cumpre RF-09.

**Interfaces:**
- Consumes: os componentes da Task 3.
- Produces: o shell em classe utilitaria.

- [x] **Step 1: Reescrever os quatro componentes**

A logica de menu e de permissao NAO e alterada. So a marcacao e o estilo. O `filtrarMenu` e o
`ITENS_MENU` continuam como estao.

Os icones vem do Phosphor, importados pelo caminho direto.

- [x] **Step 2: Remover os estilos de modulo do shell**

```bash
git rm src/app/shell/*.module.css
```

Esperado: nenhuma saida.

- [x] **Step 3: Confirmar que os testes passam**

```bash
npx vitest run src/app/shell && npm run lint
```

Esperado: os dois com codigo 0.

- [x] **Step 4: Commitar**

```bash
git add src/app/shell
git commit -m "refactor: reescreve o shell com shadcn"
```

---

### Task 6: Reescrever a tela de entrada

**Papel:** escrita
**Verificação:** `npx vitest run src/pages/entrar src/features/autenticar`

**Fontes:**
- `src/pages/entrar/` — a tela a reescrever
- `src/features/autenticar/FormularioEntrar.tsx` — o formulario
- `src/components/ui/form` — o componente do shadcn

**Files:**
- Modify: `src/pages/entrar/PaginaEntrar.tsx`, `src/features/autenticar/FormularioEntrar.tsx`
- Delete: os `.module.css` das duas pastas

Cumpre RF-09.

**Interfaces:**
- Consumes: os componentes da Task 3.
- Produces: a tela de entrada em classe utilitaria.

- [x] **Step 1: Reescrever o formulario e a tela**

O `useEntrar` e o `api.ts` NAO sao alterados. So a marcacao.

O `react-hook-form` e o `zod` ja estao instalados, e o `form` do shadcn usa os dois.

- [x] **Step 2: Remover os estilos de modulo**

```bash
git rm src/pages/entrar/*.module.css src/features/autenticar/*.module.css
```

Esperado: nenhuma saida.

- [x] **Step 3: Confirmar que os testes passam**

```bash
npx vitest run src/pages/entrar src/features/autenticar
```

Esperado: codigo 0. O teste que afirma um `h1` unico continua valendo.

- [x] **Step 4: Commitar**

```bash
git add src/pages/entrar src/features/autenticar
git commit -m "refactor: reescreve a tela de entrada com shadcn"
```

---

### Task 7: Reescrever a tela de pessoas

**Papel:** analise
**Verificação:** `npx vitest run src/pages/pessoas src/features/filtrar-pessoas`

**Fontes:**
- `src/pages/pessoas/` — a tela e as colunas
- `src/features/filtrar-pessoas/FiltrosPessoas.tsx` — o filtro
- `src/entities/pessoa/` — a fatia, que NAO e alterada
- `src/components/ui/table` — a tabela do shadcn

**Files:**
- Modify: `src/pages/pessoas/PaginaPessoas.tsx`, `colunas.tsx`, `src/features/filtrar-pessoas/FiltrosPessoas.tsx`
- Delete: os `.module.css` das duas pastas

Cumpre RF-09 e RF-10.

**Interfaces:**
- Consumes: `usePessoas` e `useFiltroPessoas`, sem alteracao.
- Produces: a tela que lista, pagina e filtra.

- [x] **Step 1: Reescrever a tabela e as colunas**

O `@tanstack/react-table` permanece. A tabela do shadcn e marcacao sobre ele.

O `usePessoas`, o `ordenacaoApi.ts` e o `useFiltroPessoas.ts` NAO sao alterados.

- [x] **Step 2: Manter a paginacao e o estado vazio**

A paginacao vira composicao de `button`. O estado vazio vira composicao de `card`.

As duas armadilhas continuam cobertas: o `204` vira estado vazio, e a paginacao le o
`X-Total-Count`.

- [x] **Step 3: Remover os estilos de modulo**

```bash
git rm src/pages/pessoas/*.module.css src/features/filtrar-pessoas/*.module.css
```

Esperado: nenhuma saida.

- [x] **Step 4: Confirmar que os tres casos passam**

```bash
npx vitest run src/pages/pessoas src/features/filtrar-pessoas
```

Esperado: codigo 0, com os tres casos da pagina verdes.

- [x] **Step 5: Commitar**

```bash
git add src/pages/pessoas src/features/filtrar-pessoas
git commit -m "refactor: reescreve a tela de pessoas com shadcn"
```

---

### Task 8: Remover o shared/ui e reescrever o catalogo

**Papel:** escrita
**Verificação:** `npm run build && npm run e2e`

**Fontes:**
- `src/shared/ui/` — o que sai inteiro
- `src/pages/design-system/` — o catalogo a reescrever
- `e2e/camadas.spec.ts` — a ordem de pintura a preservar

**Files:**
- Delete: `src/shared/ui/` inteiro
- Modify: `src/pages/design-system/PaginaDesignSystem.tsx` e o teste
- Modify: `e2e/camadas.spec.ts`
- Keep: `src/shared/ui/marca/` movido para `src/components/marca/`

Cumpre RF-05, RF-06 e RF-11.

> Achado das Tasks 5 a 7, 2026-08-22: tres arquivos fora de `shared/ui` ainda importam dele.
> Apagar a pasta sem tratar isso quebra o typecheck.
>
> - `features/filtrar-pessoas/ordenacaoApi.ts` importa o tipo `Ordenacao`.
> - `features/filtrar-pessoas/useFiltroPessoas.ts` importa `Ordenacao` e `DirecaoOrdenacao`.
> - `pages/entrar/PaginaEntrar.tsx` importa o componente `Marca`.
>
> Os dois tipos de ordenacao tem um consumidor so. A casa certa e a propria fatia
> `filtrar-pessoas`. A `Marca` vai para `src/components/marca/`.
>
> Achado da execucao: o `npm run e2e` estava vermelho desde o commit da Task 7. A bateria que
> o coordenador reportou como verde nao o incluia. O `CardTitle` do shadcn renderiza
> `div`, e o spec cobrava `heading`. A pagina voltou a ter cabecalho de verdade, e o spec
> passou a cobrar `level: 1`.
>
> Nao existe defeito de ordem de pintura no shadcn. O `SelectContent` e o `DialogOverlay` usam
> ambos `z-50`, e a ordem do DOM desempata a favor da lista. A prova negativa foi executada:
> com o `z-50` do select baixado para `z-40`, o teste falha.

**Interfaces:**
- Consumes: os componentes da Task 3.
- Produces: um `src/` sem estilo de modulo.

- [x] **Step 1: Preservar a marca**

O `Marca.tsx` carrega o marcador `Fotus Default`, que o `New-Project.ps1` substitui. Mova-o
para `src/components/marca/` e reescreva em classe utilitaria.

```bash
grep -rn "Fotus Default" src
```

Esperado: o marcador continua presente depois da alteracao.

- [x] **Step 2: Remover o shared/ui**

```bash
git rm -r src/shared/ui
```

Esperado: nenhuma saida.

- [x] **Step 3: Reescrever o catalogo**

A pagina `/design-system` passa a mostrar o que o shadcn traz. Ela continua visivel so em
desenvolvimento.

- [x] **Step 4: Alinhar o spec de ordem de pintura**

O `camadas.spec.ts` prova, por `elementFromPoint`, que a lista do `select` pinta acima do veu
do `dialog`. A assercao NAO e alterada; so o rotulo do exemplo.

- [x] **Step 5: Confirmar que nada sobrou**

```bash
find src -name "*.module.css" | wc -l
grep -rn "@/shared/ui" src e2e | wc -l
```

Esperado: zero nos dois.

- [x] **Step 6: Confirmar a bateria inteira**

```bash
npx vitest run && npm run lint && npm run typecheck && npm run build && npm run e2e
```

Esperado: todos com codigo 0.

- [x] **Step 7: Commitar**

```bash
git add -A src e2e
git commit -m "refactor: remove o shared/ui e reescreve o catalogo"
```

---

### Task 9: Atualizar a documentacao e provar o gerado

**Papel:** analise
**Verificação:** `cd "$TEMP/prova-shadcn" && npm ci && npm run lint && npm run typecheck && npx vitest run && npm run build`

**Fontes:**
- `README.md`, `CLAUDE.md`, `CONTRIBUTING.md` — o vocabulario de interface a atualizar
- `New-Project.ps1` — o script que gera o projeto

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`

Cumpre os criterios de aceite do projeto gerado.

**Interfaces:**
- Consumes: tudo o que as tasks anteriores produziram.
- Produces: o veredito da troca.

- [x] **Step 1: Atualizar a documentacao**

O vocabulario de interface e outro. A lista de caminhos a remover no README continua valendo,
com os caminhos novos.

Confirme a prosa:

```bash
python ~/.claude/skills/portugues-tecnico/scripts/check_docs.py README.md CLAUDE.md CONTRIBUTING.md
```

Esperado: codigo 0.

- [x] **Step 2: Executar a bateria inteira no boilerplate**

```bash
npm ci && npm run lint && npm run typecheck && npx vitest run && npm run api:check && npm run build && npm run e2e
```

Esperado: todos com codigo 0.

- [x] **Step 3: Gerar um projeto para destino temporario**

```powershell
$destino = Join-Path $env:TEMP 'prova-shadcn'
Remove-Item -Recurse -Force $destino -ErrorAction SilentlyContinue
.\New-Project.ps1 -Name prova-shadcn -Titulo "Prova Shadcn" -OutputPath $destino
```

Esperado: o script imprime os proximos passos.

- [x] **Step 4: Confirmar que nenhum arquivo carrega BOM**

O ciclo anterior encontrou esse defeito. A guarda continua valendo.

```bash
cd "$TEMP/prova-shadcn"
for f in $(find . -name "*.json" -o -name "*.html" -not -path "./node_modules/*"); do
  head -c3 "$f" | od -An -tx1 | grep -q "ef bb bf" && echo "COM BOM: $f"
done
```

Esperado: nenhuma linha.

- [x] **Step 5: Executar a bateria inteira no destino**

```bash
cd "$TEMP/prova-shadcn"
npm ci && npm run lint && npm run typecheck && npx vitest run && npm run build && npm run e2e
```

Esperado: todos com codigo 0.

- [x] **Step 6: Commitar**

```bash
git add README.md CLAUDE.md CONTRIBUTING.md
git commit -m "docs: atualiza o vocabulario de interface, e prova o gerado"
```

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
