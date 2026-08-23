
## 2026-08-23 — Acessibilidade e o que ela revelou

**`userEvent.setup()` vem ANTES do `render`.** Chamado depois, ele não alcança
a árvore já montada e todo `getByRole` falha com `<body />` vazio — o sintoma
parece componente que não renderizou, e não é.

**Provider consumido por `features` mora em `shared`, não em `app`.** O
`boundaries` do ESLint recusa `features → app`. O `AcessibilidadeProvider`
nasceu em `app/providers` por simetria com o `TemaProvider` e teve de mudar de
casa. Regra: se uma fatia de `features` precisa do contexto, ele é
infraestrutura compartilhada.

**Altura fixa em pixel quebra com escala de texto.** `h-[60px]` na barra
prendia a caixa enquanto o conteúdo crescia: a 150% em 390px os itens se
sobrepunham e a página ganhava rolagem horizontal. `min-h` em `rem` mais
`flex-wrap` resolve. Vale para qualquer caixa que contenha texto.

**Auditar contraste antes de escrever o modo de alto contraste.** Medir
apontou o alvo real: `--tinta-300` a 1,94:1 sobre papel (texto de apoio,
reprovava até em texto grande), `--text-3` a 4,44:1 e `--warn` a 4,25:1. As 8
cores de componente já passavam com folga — sem medir, eu teria "consertado"
o que não estava quebrado.

**O painel do shadcn não segue a direção B sozinho.** `DropdownMenuContent`
traz `rounded-lg`, `shadow-md` e `ring-1` de fábrica. Numa direção de raio
zero e elevação por traço, isso precisa ser sobreposto em cada uso.
