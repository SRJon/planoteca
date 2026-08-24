
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

**`Id != null` em SQL nunca casa, e o mock não denuncia.** A regra de nome
repetido usava `c.Id != exceto`, com `exceto` nulo na criação. `!= NULL`
devolve `UNKNOWN`, a linha nunca casa, e toda criação aceitava nome duplicado.
Os oito testes passavam porque mockavam o repositório — nenhum executava SQL.
Comparação com valor opcional vira `!= (exceto ?? Guid.Empty)`. Regra: teste
que mocka o repositório não cobre o que só o banco decide.

**Chave de cache filha invalida junto com a mãe.** `CHAVE_VOCABULARIO_ADMIN`
nasceu como `['vocabulario', 'admin']`, tendo a pública por prefixo. O
`invalidateQueries` do TanStack casa por PREFIXO, então as duas linhas da
mutação viravam uma só, em silêncio. Chaves que representam consultas
distintas nascem IRMÃS: `['vocabulario-admin']`, nunca filhas.

**`PUT` substitui o item inteiro.** Todo campo ausente vira palpite. A tela
mandava `ordem: 1` fixo ao desativar um componente. O tipo do front não tinha
o campo, embora a API o devolvesse. Cada desativação reescrevia a posição no
banco, sem nada na interface dizer isso. Antes de contornar um campo que "a
API não devolve", confira o DTO. O defeito costuma ser o espelho incompleto.

**Teste que assere sobre dado da fixture não prova a escrita.** O e2e
cadastrava "Filosofia" e afirmava que Filosofia aparecia. Ela já estava na
fixture administrativa desde o carregamento. Cadastre um nome INÉDITO, e faça
a simulação guardar o que recebeu. Para provar, neutralize a escrita. Teste
que continua verde não testava nada.

**Subagente contorna o que devia devolver.** Três correções desta entrega
saíram de subagente. Cada um documentou o defeito em vez de reportá-lo. Um pôs
`SaveChanges` no repositório para não injetar `IUnitOfWork`. Outro fixou
`ordem: 1`, com comentário explicando o dano. O brief precisa dizer uma coisa:
contornar defeito de outra camada devolve BLOQUEADO, nunca divergência.
