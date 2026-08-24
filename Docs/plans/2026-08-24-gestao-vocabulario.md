<!-- gerado de docs/specs/2026-08-24-gestao-vocabulario.html
     sha256 da fonte: 058b176af8742040
     em: 2026-08-24T15:02
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Gestão de vocabulário no painel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o administrador cadastra componente, série e metodologia pelo painel. A
rota pública da Biblioteca não se altera.

**Architecture:** a API ganha um bloco de escrita sob `/api/v1/admin/vocabulary`,
fechado pela policy `Administrador`. Ele reusa as três tabelas que o seed já povoa.
O front ganha a rota `/admin/vocabulario`, com três abas, e as mutações moram em
`entities/vocabulario`.

**Tech Stack:** .NET com xUnit, NSubstitute e FluentAssertions. React com Vitest,
Testing Library, MSW e Playwright.

## Global Constraints

- O alvo são as pastas `planoteca-api` e `planoteca-web`. Nada fora delas se altera.
- `GET /api/v1/vocabulary` continua `AllowAnonymous` e continua devolvendo só os ativos.
- Escrita fica sob `[Authorize(Policy = "Administrador")]`. A policy já existe.
- Papel nunca vira custom claim do Firebase. Ele mora em `pessoa.papel`.
- Não existe exclusão física. Desativar é alterar o campo `Ativo` ou `Ativa`.
- Cor de componente sai de uma lista fechada de quatro tokens. O Tailwind só gera
  classe escrita literalmente no fonte.
- Cor literal em componente reprova no `npm run lint`. Use token.
- Escrita exige entidade rastreada. Não use `AsNoTracking` na busca por id.
- Fixture nova entra em `src/teste/servidor.ts` e em `e2e/simulacao.ts`, nos dois.
- Teste da API usa xUnit, NSubstitute e FluentAssertions.
- Teste do front usa Vitest, Testing Library e MSW.
- Commit segue Conventional Commits, com escopo pelo domínio.

## Fontes

| Caminho | O que decide |
|---|---|
| `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/AdminPessoasController.cs` | forma do controller administrativo: policy, rota, recusa por `Result` |
| `planoteca-api/src/SaraivaTech.Planoteca.Application.Core/Services/PessoaAdminAppService.cs` | como a regra recusada vira `Result.Failure` e como a transação fecha |
| `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/VocabularyController.cs` | a rota pública que não se altera |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Componente.cs` | campos do componente e razão de cada obrigatoriedade |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Serie.cs` | campos da série e a chave natural |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Metodologia.cs` | campos da metodologia e o campo `Tipo` |
| `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Repositories/VocabularioRepository.cs` | ordenação de cada lista e o uso de `AsNoTracking` |
| `planoteca-api/src/SaraivaTech.Planoteca.Application/Dto/VocabularioDto.cs` | o contrato de saída que a rota pública já entrega |
| `planoteca-api/src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs` | onde registrar o serviço novo |
| `planoteca-api/tests/SaraivaTech.Planoteca.Test/Application/PostAppServiceTest.cs` | forma do teste de AppService com NSubstitute |
| `planoteca-web/src/entities/vocabulario/modelo.ts` | os quatro tokens de cor e por que o mapa é escrito |
| `planoteca-web/src/entities/vocabulario/api.ts` | o contrato de fio e o cliente por parâmetro |
| `planoteca-web/src/entities/vocabulario/useVocabulario.ts` | a chave de cache e o `staleTime` de uma hora |
| `planoteca-web/src/entities/conta/useContas.ts` | forma da mutação: `useMutation` com `invalidateQueries` |
| `planoteca-web/src/entities/conta/api.ts` | como a função de escrita chama `cliente.enviar` |
| `planoteca-web/src/shared/api/cliente.ts` | os métodos do cliente: `obter`, `listar`, `enviar`, `remover` |
| `planoteca-web/src/pages/admin/PaginaModeracao.tsx` | as abas por `Chip` e a forma do estado vazio |
| `planoteca-web/src/pages/admin/PaginaPessoasAdmin.test.tsx` | setup do teste de página com `QueryClientProvider` |
| `planoteca-web/src/app/shell/permissoes.ts` | o item de menu e o papel que o revela |
| `planoteca-web/src/app/rotas/Rotas.tsx` | onde a rota protegida entra |
| `planoteca-web/src/teste/servidor.ts` | handler MSW do teste de unidade |
| `planoteca-web/e2e/simulacao.ts` | handler da simulação do Playwright |
| `CLAUDE.md` | decisões que não se renegociam e o portão antes de fechar |

---

### Task 1: O contrato de entrada e a leitura completa na API

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet build`

**Fontes:**
- `planoteca-api/src/SaraivaTech.Planoteca.Application/Dto/VocabularioDto.cs` — o contrato de saída atual
- `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Componente.cs` — os campos e a obrigatoriedade
- `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Serie.cs` — a chave natural
- `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Metodologia.cs` — o campo `Tipo`
- `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Repositories/VocabularioRepository.cs` — a ordenação e o `AsNoTracking`

**Files:**
- Modify: `src/SaraivaTech.Planoteca.Application/Dto/VocabularioDto.cs`
- Create: `src/SaraivaTech.Planoteca.Application/Dto/VocabularioEntradaDto.cs`
- Modify: `src/SaraivaTech.Planoteca.Domain/Repositories/Interfaces/IVocabularioRepository.cs`
- Modify: `src/SaraivaTech.Planoteca.Infra.Data/Repositories/VocabularioRepository.cs`

**Interfaces:**
- Produces: `Task<IEnumerable<Componente>> ComponentesTodosAsync()`
- Produces: `Task<IEnumerable<Serie>> SeriesTodasAsync()`
- Produces: `Task<IEnumerable<Metodologia>> MetodologiasTodasAsync()`
- Produces: `Task<Componente?> ComponentePorIdAsync(Guid id)`
- Produces: `Task<Serie?> SeriePorIdAsync(Guid id)`
- Produces: `Task<Metodologia?> MetodologiaPorIdAsync(Guid id)`
- Produces: `Task<bool> ExisteComponenteComNomeAsync(string nome, Guid? exceto)`
- Produces: `Task<bool> ExisteSerieComNomeAsync(string nome, string etapa, Guid? exceto)`
- Produces: `Task<bool> ExisteMetodologiaComNomeAsync(string nome, Guid? exceto)`

- [x] **Step 1: Acrescentar `ativo` aos DTO de saída**

Os três DTO de saída ganham o campo. A tela de gestão precisa dele para mostrar o
estado, e a rota pública devolve sempre `true` porque só carrega ativo.

- [x] **Step 2: Escrever os DTO de entrada**

```csharp
public class ComponenteEntradaDto
{
    public string Nome { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Sigla { get; set; } = string.Empty;
    public string Cor { get; set; } = string.Empty;
    public int Ordem { get; set; }
    public bool Ativo { get; set; } = true;
}
```

Série e metodologia seguem a mesma forma, com os campos das entidades.

- [x] **Step 3: Ampliar a interface do repositório**

As nove assinaturas de `Interfaces` acima. A busca por id e a consulta de nome
existem para o AppService checar a regra antes de escrever.

- [x] **Step 4: Implementar no repositório**

A leitura completa repete a ordenação da leitura de ativos. A busca por id não usa
`AsNoTracking`, porque o `Commit` do UnitOfWork persiste o que o contexto rastreia.

- [x] **Step 5: Compilar**

```bash
cd planoteca-api && dotnet build
```

Esperado: `Build succeeded` e código 0.

- [x] **Step 6: Commitar**

```bash
git add planoteca-api/src
git commit -m "feat(vocabulario): contrato de entrada e leitura completa"
```

---

### Task 2: O AppService de escrita, com as regras de recusa

**Papel:** analise
**Verificação:** `cd planoteca-api && dotnet test`

**Fontes:**
- `planoteca-api/src/SaraivaTech.Planoteca.Application.Core/Services/PessoaAdminAppService.cs` — como a regra recusada vira `Result.Failure`
- `planoteca-api/tests/SaraivaTech.Planoteca.Test/Application/PostAppServiceTest.cs` — a forma do teste com NSubstitute
- `docs/specs/2026-08-24-gestao-vocabulario.md` — RF-04, RF-05 e RF-10

**Files:**
- Create: `src/SaraivaTech.Planoteca.Application/Services/IVocabularioAdminAppService.cs`
- Create: `src/SaraivaTech.Planoteca.Application.Core/Services/VocabularioAdminAppService.cs`
- Create: `src/SaraivaTech.Planoteca.Domain/Enumerable/CorComponente.cs`
- Test: `tests/SaraivaTech.Planoteca.Test/Application/VocabularioAdminAppServiceTest.cs`

**Interfaces:**
- Consumes: as nove assinaturas de repositório da Task 1.
- Produces: `Task<VocabularioDto> ObterTudoAsync()`
- Produces: `Task<Result<ComponenteDto>> CriarComponenteAsync(ComponenteEntradaDto e)`
- Produces: `Task<Result> AlterarComponenteAsync(Guid id, ComponenteEntradaDto e)`
- Produces: as mesmas duas formas para série e metodologia.

- [x] **Step 1: Escrever os testes que falham**

Um teste por regra de RF-10, mais o caminho feliz. Todos com repositório e
UnitOfWork por `Substitute.For`.

```csharp
[Fact]
public async Task CriarComponenteAsync_recusa_cor_fora_do_tema()
{
    var sut = CriarSut();
    var entrada = new ComponenteEntradaDto
    {
        Nome = "Filosofia", Area = "Ciências Humanas",
        Sigla = "FI", Cor = "comp-roxo", Ordem = 1,
    };

    var resultado = await sut.CriarComponenteAsync(entrada);

    resultado.IsSuccess.Should().BeFalse();
    resultado.Error!.Message.Should().Be("A cor precisa ser um token que o tema conhece.");
}

[Fact]
public async Task CriarComponenteAsync_recusa_nome_repetido()
{
    _repositorio.ExisteComponenteComNomeAsync("Filosofia", null).Returns(true);
    var sut = CriarSut();
    var entrada = new ComponenteEntradaDto
    {
        Nome = "Filosofia", Area = "Ciências Humanas",
        Sigla = "FI", Cor = "comp-humanas", Ordem = 1,
    };

    var resultado = await sut.CriarComponenteAsync(entrada);

    resultado.IsSuccess.Should().BeFalse();
    resultado.Error!.Message.Should().Be("Já existe um item com este nome.");
}

[Fact]
public async Task CriarComponenteAsync_grava_quando_a_entrada_e_valida()
{
    _repositorio.ExisteComponenteComNomeAsync("Filosofia", null).Returns(false);
    var sut = CriarSut();
    var entrada = new ComponenteEntradaDto
    {
        Nome = "Filosofia", Area = "Ciências Humanas",
        Sigla = "FI", Cor = "comp-humanas", Ordem = 1,
    };

    var resultado = await sut.CriarComponenteAsync(entrada);

    resultado.IsSuccess.Should().BeTrue();
    _repositorio.Received(1).Insert(Arg.Is<Componente>(c =>
        c.Nome == "Filosofia" && c.Cor == "comp-humanas" && c.Ativo));
}

[Fact]
public async Task AlterarComponenteAsync_aceita_o_proprio_nome()
{
    var id = Guid.NewGuid();
    _repositorio.ComponentePorIdAsync(id).Returns(new Componente
    {
        Nome = "Filosofia", Area = "Ciências Humanas",
        Sigla = "FI", Cor = "comp-humanas", Ordem = 1,
    });
    _repositorio.ExisteComponenteComNomeAsync("Filosofia", id).Returns(false);
    var sut = CriarSut();
    var entrada = new ComponenteEntradaDto
    {
        Nome = "Filosofia", Area = "Ciências Humanas",
        Sigla = "FI", Cor = "comp-humanas", Ordem = 2,
    };

    var resultado = await sut.AlterarComponenteAsync(id, entrada);

    resultado.IsSuccess.Should().BeTrue();
}

[Fact]
public async Task AlterarComponenteAsync_recusa_id_que_nao_existe()
{
    var id = Guid.NewGuid();
    _repositorio.ComponentePorIdAsync(id).Returns((Componente?)null);
    var sut = CriarSut();
    var entrada = new ComponenteEntradaDto
    {
        Nome = "Filosofia", Area = "Ciências Humanas",
        Sigla = "FI", Cor = "comp-humanas", Ordem = 1,
    };

    var resultado = await sut.AlterarComponenteAsync(id, entrada);

    resultado.IsSuccess.Should().BeFalse();
    resultado.Error!.Message.Should().Be("Componente não encontrado.");
}

[Fact]
public async Task CriarSerieAsync_recusa_etapa_desconhecida()
{
    var sut = CriarSut();
    var entrada = new SerieEntradaDto
    {
        Nome = "4ª série", Etapa = "superior",
        RotuloCompleto = "4ª série do superior", Sigla = "4S", Ordem = 8,
    };

    var resultado = await sut.CriarSerieAsync(entrada);

    resultado.IsSuccess.Should().BeFalse();
    resultado.Error!.Message.Should().Be("A etapa é fundamental ou médio.");
}

[Fact]
public async Task CriarMetodologiaAsync_recusa_tipo_desconhecido()
{
    var sut = CriarSut();
    var entrada = new MetodologiaEntradaDto { Nome = "Escape Room", Tipo = "dinamica" };

    var resultado = await sut.CriarMetodologiaAsync(entrada);

    resultado.IsSuccess.Should().BeFalse();
    resultado.Error!.Message.Should().Be("O tipo é metodologia, técnica ou ferramenta.");
}

[Fact]
public async Task ObterTudoAsync_devolve_o_inativo()
{
    _repositorio.ComponentesTodosAsync().Returns([
        new Componente { Nome = "Filosofia", Cor = "comp-humanas", Sigla = "FI", Ativo = false },
    ]);
    var sut = CriarSut();

    var vocabulario = await sut.ObterTudoAsync();

    vocabulario.Componentes.Should().ContainSingle(c => !c.Ativo);
}
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-api && dotnet test --filter VocabularioAdminAppServiceTest
```

Esperado: falha de compilação, porque `IVocabularioAdminAppService` ainda não existe.

- [x] **Step 3: Escrever a lista fechada de cor**

```csharp
public static class CorComponente
{
    public const string Linguagens = "comp-linguagens";
    public const string Matematica = "comp-matematica";
    public const string Natureza = "comp-natureza";
    public const string Humanas = "comp-humanas";

    public static readonly string[] Todas =
        [Linguagens, Matematica, Natureza, Humanas];
}
```

Ela é a metade de servidor do mapa escrito em `modelo.ts`. As duas listas precisam
concordar, e um comentário em cada uma aponta para a outra.

- [x] **Step 4: Implementar o AppService**

Sete métodos. Cada escrita checa a regra, depois `Insert` ou `Update`, depois
`BeginTransaction` e `Commit` com `Rollback` no `catch`. É o padrão de
`PessoaAdminAppService`.

- [x] **Step 5: Executar e confirmar que passa**

```bash
cd planoteca-api && dotnet test
```

Esperado: `Passed!` e código 0.

- [x] **Step 6: Commitar**

```bash
git add planoteca-api/src planoteca-api/tests
git commit -m "feat(vocabulario): regras de cadastro e alteração"
```

---

### Task 3: O controller administrativo e o registro de DI

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet build && dotnet test`

**Fontes:**
- `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/AdminPessoasController.cs` — policy, rota e recusa por `Result`
- `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/VocabularyController.cs` — a rota pública que não se altera
- `planoteca-api/src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs` — onde registrar
- `docs/specs/2026-08-24-gestao-vocabulario.md` — RF-09

**Files:**
- Create: `src/SaraivaTech.Planoteca.Api/Controllers/AdminVocabularyController.cs`
- Modify: `src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs`

**Interfaces:**
- Consumes: `IVocabularioAdminAppService` da Task 2.
- Produces: as sete rotas de RF-09.

- [x] **Step 1: Escrever o controller**

`[Authorize(Policy = "Administrador")]` na classe, rota
`api/v{version:apiVersion}/admin/vocabulary`. Cada `POST` devolve `201` com
`CreatedAtAction`, cada `PUT` devolve `204`, e a recusa devolve `BadRequest` com o
corpo de `Error`.

- [x] **Step 2: Registrar no DI**

```csharp
services.AddScoped<IVocabularioAdminAppService, VocabularioAdminAppService>();
```

Ao lado do registro de `IVocabularioAppService`, que já existe.

- [x] **Step 3: Compilar e testar**

```bash
cd planoteca-api && dotnet build && dotnet test
```

Esperado: `Build succeeded`, `Passed!` e código 0.

- [x] **Step 4: Commitar**

```bash
git add planoteca-api/src
git commit -m "feat(vocabulario): rotas administrativas de cadastro"
```

---

### Task 4: A camada de dados do vocabulário no front

**Papel:** escrita
**Verificação:** `cd planoteca-web && npm run test -- vocabulario`

**Fontes:**
- `planoteca-web/src/entities/vocabulario/modelo.ts` — os quatro tokens e o mapa escrito
- `planoteca-web/src/entities/vocabulario/api.ts` — o contrato de fio
- `planoteca-web/src/entities/vocabulario/useVocabulario.ts` — a chave de cache
- `planoteca-web/src/entities/conta/useContas.ts` — a forma da mutação
- `planoteca-web/src/entities/conta/api.ts` — como a escrita chama `cliente.enviar`
- `planoteca-web/src/shared/api/cliente.ts` — os métodos do cliente

**Files:**
- Modify: `src/entities/vocabulario/modelo.ts`
- Modify: `src/entities/vocabulario/api.ts`
- Modify: `src/entities/vocabulario/useVocabulario.ts`
- Modify: `src/entities/vocabulario/index.ts`
- Modify: `src/teste/servidor.ts`
- Test: `src/entities/vocabulario/useVocabulario.test.ts`

**Interfaces:**
- Consumes: as rotas de RF-09.
- Produces: `buscarVocabularioAdmin(cliente): Promise<Vocabulario>`
- Produces: `useVocabularioAdmin(cliente)`
- Produces: `useSalvarComponente(cliente)`, `useSalvarSerie(cliente)`, `useSalvarMetodologia(cliente)`
- Produces: `CORES_COMPONENTE: { token: string; rotulo: string }[]`

- [x] **Step 1: Escrever o teste que falha**

O teste confirma RF-08: a mutação invalida `CHAVE_VOCABULARIO`.

```ts
it('invalida o vocabulário depois de salvar um componente', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
  const cliente = criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })

  const { result } = renderHook(() => useSalvarComponente(cliente), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  await act(async () => {
    await result.current.mutateAsync({
      nome: 'Filosofia',
      area: 'Ciências Humanas',
      sigla: 'FI',
      cor: 'comp-humanas',
      ordem: 1,
      ativo: true,
    })
  })

  expect(invalidar).toHaveBeenCalledWith({ queryKey: CHAVE_VOCABULARIO })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npm run test -- vocabulario
```

Esperado: falha de importação, porque `useSalvarComponente` ainda não existe.

- [x] **Step 3: Acrescentar `ativo` e a lista de cor ao modelo**

`CORES_COMPONENTE` deriva do mapa que já existe. Um comentário aponta para
`CorComponente.cs`, porque as duas listas precisam concordar.

- [x] **Step 4: Escrever a api e os hooks**

Toda mutação invalida `CHAVE_VOCABULARIO` e a chave administrativa. Sem isso, quem
cadastra espera uma hora para ver o item na Biblioteca.

- [x] **Step 5: Acrescentar os handler MSW**

`GET /admin/vocabulary`, e os `POST` e `PUT` das três listas.

- [x] **Step 6: Executar e confirmar que passa**

```bash
cd planoteca-web && npm run test -- vocabulario
```

Esperado: todos os testes verdes.

- [x] **Step 7: Commitar**

```bash
git add planoteca-web/src
git commit -m "feat(vocabulario): mutações e leitura administrativa no front"
```

---

### Task 5: A tela de gestão, com as três abas

**Papel:** escrita
**Verificação:** `cd planoteca-web && npm run lint && npm run test && npm run build`

**Fontes:**
- `planoteca-web/src/pages/admin/PaginaModeracao.tsx` — as abas por `Chip` e o estado vazio
- `planoteca-web/src/pages/admin/PaginaPessoasAdmin.tsx` — a linha com ações e o diálogo de confirmação
- `planoteca-web/src/pages/admin/PaginaPessoasAdmin.test.tsx` — o setup do teste de página
- `planoteca-web/src/app/shell/permissoes.ts` — o item de menu
- `planoteca-web/src/app/rotas/Rotas.tsx` — onde a rota entra
- `~/.claude/skills/sem-plastico/SKILL.md` — as receitas anti-plástico da interface

**Files:**
- Create: `src/pages/admin/PaginaVocabulario.tsx`
- Test: `src/pages/admin/PaginaVocabulario.test.tsx`
- Modify: `src/pages/admin/index.ts`
- Modify: `src/app/shell/permissoes.ts`
- Modify: `src/app/rotas/Rotas.tsx`

**Interfaces:**
- Consumes: `useVocabularioAdmin` e as três mutações da Task 4.
- Produces: `PaginaVocabulario({ cliente })`

- [x] **Step 1: Escrever o teste que falha**

```tsx
describe('PaginaVocabulario', () => {
  it('mostra as três abas e começa em componentes', async () => {
    renderizar()

    expect(await screen.findByRole('button', { name: 'Componentes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Séries' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Metodologias' })).toBeInTheDocument()
    expect(await screen.findByText('Língua Portuguesa')).toBeInTheDocument()
  })

  it('troca de aba e mostra a lista daquele tipo', async () => {
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Séries' }))

    expect(await screen.findByText('6º ano')).toBeInTheDocument()
  })

  it('mostra o item desativado com o estado à vista', async () => {
    renderizar()

    const linha = await screen.findByText('Filosofia')
    expect(within(linha.closest('article')!).getByText('Desativado')).toBeInTheDocument()
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npm run test -- PaginaVocabulario
```

Esperado: falha de importação, porque a página ainda não existe.

- [x] **Step 3: Escrever a página**

Três abas por `Chip`, como `PaginaModeracao`. Cada linha traz nome, os campos do
tipo, o estado e os botões de alterar e de desativar. O formulário abre em
`Dialog`, e o campo de cor é `select` sobre `CORES_COMPONENTE`.

- [x] **Step 4: Registrar a rota e o item de menu**

```ts
{ rota: '/admin/vocabulario', titulo: 'Vocabulário', icone: Tag, papel: 'administrador' },
```

Entre `Catalogar` e `Pessoas`, porque é onde a tarefa dele acontece.

- [x] **Step 5: Executar o portão do front**

```bash
cd planoteca-web && npm run lint && npm run test && npm run build
```

Esperado: os três verdes.

- [x] **Step 6: Executar o detector de plástico**

```bash
python ~/.claude/skills/sem-plastico/scripts/detectar.py planoteca-web/src/pages/admin/PaginaVocabulario.tsx
```

Esperado: código 0.

- [x] **Step 7: Commitar**

```bash
git add planoteca-web/src
git commit -m "feat(vocabulario): tela de gestão no painel"
```

---

### Task 6: O portão inteiro, com o e2e

**Papel:** analise
**Verificação:** `cd planoteca-web && npm run e2e`

**Fontes:**
- `planoteca-web/e2e/simulacao.ts` — o handler da simulação do Playwright
- `planoteca-web/e2e/biblioteca.spec.ts` — a forma do teste de ponta a ponta
- `CLAUDE.md` — o portão antes de fechar

**Files:**
- Modify: `e2e/simulacao.ts`
- Test: `e2e/vocabulario.spec.ts`

**Interfaces:**
- Consumes: a tela da Task 5 e as rotas da Task 3.

- [x] **Step 1: Acrescentar os handler à simulação**

As mesmas rotas que a Task 4 pôs em `src/teste/servidor.ts`. Fixture que entra num
arquivo precisa entrar no outro. Sem isso o e2e passa com dado que o teste de
unidade não conhece.

- [x] **Step 2: Escrever o teste de ponta a ponta**

Ele entra como administrador, abre `/admin/vocabulario`, cadastra um componente e
confirma que ele aparece na lista.

- [x] **Step 3: Executar o portão dos dois lados**

```bash
cd planoteca-api && dotnet build && dotnet test
cd planoteca-web && npm run lint && npm run test && npm run build && npm run e2e
```

Esperado: código 0 em todos.

- [x] **Step 4: Confirmar que a rota pública não se alterou**

```bash
cd planoteca-api && dotnet test --filter Vocabulary
```

Esperado: o teste de RF-01 verde. A rota pública responde sem token e devolve só
ativo.

- [x] **Step 5: Commitar**

```bash
git add planoteca-web/e2e
git commit -m "test(vocabulario): cobre a gestão de ponta a ponta"
```

---

## Self-Review

- [x] Todo `### Task N` usa a palavra inglesa `Task`.
- [x] Toda task tem `Papel`: `busca`, `escrita` ou `analise`.
- [x] Toda task tem `Verificação` com um comando.
- [x] O comando de `Verificação` executa a partir da raiz do repositório.
- [x] Toda task tem `Fontes`, com caminho ou com a palavra `nenhuma`.
- [x] Todo caminho de `Fontes` existe no disco.
- [x] Todo passo tem comando e resultado esperado.
- [x] Todo bloco de teste está inteiro, sem reticência.
- [x] Todo bloco de código usa cerca, nunca indentação de quatro espaços.
- [x] Nenhuma task depende de arquivo que nenhuma task anterior criou.
