import { useState } from 'react'
import { Tag } from '@phosphor-icons/react/dist/csr/Tag'
import {
  CORES_COMPONENTE,
  useSalvarComponente,
  useSalvarMetodologia,
  useSalvarSerie,
  useVocabularioAdmin,
} from '@/entities/vocabulario'
import type { Componente, Metodologia, Serie } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

/** As duas etapas que a série aceita — espelha a validação de RF-10 no
 * back-end (`A etapa é fundamental ou médio.`). Lista fechada, igual à
 * de cor: um `select` livre deixaria a tela aceitar o que a API recusa. */
const ETAPAS = [
  { valor: 'fundamental_anos_finais', rotulo: 'Fundamental — Anos Finais' },
  { valor: 'medio', rotulo: 'Médio' },
]

/** Os três tipos que a metodologia aceita — espelha `O tipo é metodologia,
 * técnica ou ferramenta.` de RF-10. */
const TIPOS_METODOLOGIA = [
  { valor: 'metodologia', rotulo: 'Metodologia' },
  { valor: 'tecnica', rotulo: 'Técnica' },
  { valor: 'ferramenta', rotulo: 'Ferramenta' },
]

type Aba = 'componentes' | 'series' | 'metodologias'

const ABAS: { aba: Aba; rotulo: string }[] = [
  { aba: 'componentes', rotulo: 'Componentes' },
  { aba: 'series', rotulo: 'Séries' },
  { aba: 'metodologias', rotulo: 'Metodologias' },
]

/** O rótulo legível de um token de cor — para a linha da lista mostrar
 * "Ciências Humanas..." em vez do token cru `comp-humanas`. */
function rotuloCor(token: string): string {
  return CORES_COMPONENTE.find((c) => c.token === token)?.rotulo ?? token
}

function rotuloEtapa(etapa: string): string {
  return ETAPAS.find((e) => e.valor === etapa)?.rotulo ?? etapa
}

function rotuloTipo(tipo: string): string {
  return TIPOS_METODOLOGIA.find((t) => t.valor === tipo)?.rotulo ?? tipo
}

/** O selo de estado — a mesma forma de `LinhaConta` em `PaginaPessoasAdmin`.
 * O item desativado FICA na lista: é dali que se reativa. */
function SeloEstado({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-block px-[7px] py-[3px] text-[11px] font-bold ${
        ativo ? 'bg-ok-bg text-ok' : 'bg-err-bg text-err'
      }`}
    >
      {ativo ? 'Ativo' : 'Desativado'}
    </span>
  )
}

/** O formulário de um componente, dentro do `Dialog`. `cor` é `select`
 * fechado sobre `CORES_COMPONENTE` — nunca texto livre (RF-04). */
function FormularioComponente({
  componente,
  aoSalvar,
  ocupado,
}: {
  componente: Componente | null
  aoSalvar: (entrada: { nome: string; area: string; sigla: string; cor: string; ativo: boolean }) => void
  ocupado: boolean
}) {
  const [nome, setNome] = useState(componente?.nome ?? '')
  const [area, setArea] = useState(componente?.area ?? '')
  const [sigla, setSigla] = useState(componente?.sigla ?? '')
  const [cor, setCor] = useState(componente?.cor ?? CORES_COMPONENTE[0]!.token)

  return (
    <form
      id="form-vocabulario"
      onSubmit={(evento) => {
        evento.preventDefault()
        aoSalvar({ nome, area, sigla, cor, ativo: componente?.ativo ?? true })
      }}
      className="flex flex-col gap-4"
    >
      <Field>
        <FieldLabel htmlFor="nome-componente">Nome</FieldLabel>
        <Input id="nome-componente" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={ocupado} />
      </Field>
      <Field>
        <FieldLabel htmlFor="area-componente">Área do conhecimento</FieldLabel>
        <Input id="area-componente" value={area} onChange={(e) => setArea(e.target.value)} required disabled={ocupado} />
      </Field>
      <Field>
        <FieldLabel htmlFor="sigla-componente">Sigla (duas letras)</FieldLabel>
        <Input
          id="sigla-componente"
          value={sigla}
          onChange={(e) => setSigla(e.target.value.toUpperCase())}
          maxLength={2}
          required
          disabled={ocupado}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="cor-componente">Cor</FieldLabel>
        {/* Lista fechada, não texto livre: a classe Tailwind precisa existir
            escrita em `modelo.ts` para o build gerar o utilitário (RF-04). */}
        <Select value={cor} onValueChange={setCor} disabled={ocupado}>
          <SelectTrigger id="cor-componente" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CORES_COMPONENTE.map((c) => (
              <SelectItem key={c.token} value={c.token}>
                {c.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </form>
  )
}

/** O formulário de uma série. `etapa` é `select` fechado sobre `ETAPAS`. */
function FormularioSerie({
  serie,
  aoSalvar,
  ocupado,
}: {
  serie: Serie | null
  aoSalvar: (entrada: { nome: string; etapa: string; rotuloCompleto: string; sigla: string; ativa: boolean }) => void
  ocupado: boolean
}) {
  const [nome, setNome] = useState(serie?.nome ?? '')
  const [etapa, setEtapa] = useState(serie?.etapa ?? ETAPAS[0]!.valor)
  const [rotuloCompleto, setRotuloCompleto] = useState(serie?.rotuloCompleto ?? '')
  const [sigla, setSigla] = useState(serie?.sigla ?? '')

  return (
    <form
      id="form-vocabulario"
      onSubmit={(evento) => {
        evento.preventDefault()
        aoSalvar({ nome, etapa, rotuloCompleto, sigla, ativa: serie?.ativa ?? true })
      }}
      className="flex flex-col gap-4"
    >
      <Field>
        <FieldLabel htmlFor="nome-serie">Nome</FieldLabel>
        <Input id="nome-serie" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="6º ano" required disabled={ocupado} />
      </Field>
      <Field>
        <FieldLabel htmlFor="rotulo-serie">Rótulo completo</FieldLabel>
        <Input
          id="rotulo-serie"
          value={rotuloCompleto}
          onChange={(e) => setRotuloCompleto(e.target.value)}
          placeholder="6º ano do Ensino Fundamental"
          required
          disabled={ocupado}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="sigla-serie">Sigla</FieldLabel>
        <Input id="sigla-serie" value={sigla} onChange={(e) => setSigla(e.target.value)} placeholder="6º" required disabled={ocupado} />
      </Field>
      <Field>
        <FieldLabel htmlFor="etapa-serie">Etapa</FieldLabel>
        <Select value={etapa} onValueChange={setEtapa} disabled={ocupado}>
          <SelectTrigger id="etapa-serie" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ETAPAS.map((e) => (
              <SelectItem key={e.valor} value={e.valor}>
                {e.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </form>
  )
}

/** O formulário de uma metodologia. `tipo` é `select` fechado sobre
 * `TIPOS_METODOLOGIA`. */
function FormularioMetodologia({
  metodologia,
  aoSalvar,
  ocupado,
}: {
  metodologia: Metodologia | null
  aoSalvar: (entrada: { nome: string; tipo: string; ativa: boolean }) => void
  ocupado: boolean
}) {
  const [nome, setNome] = useState(metodologia?.nome ?? '')
  const [tipo, setTipo] = useState(metodologia?.tipo ?? TIPOS_METODOLOGIA[0]!.valor)

  return (
    <form
      id="form-vocabulario"
      onSubmit={(evento) => {
        evento.preventDefault()
        aoSalvar({ nome, tipo, ativa: metodologia?.ativa ?? true })
      }}
      className="flex flex-col gap-4"
    >
      <Field>
        <FieldLabel htmlFor="nome-metodologia">Nome</FieldLabel>
        <Input id="nome-metodologia" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={ocupado} />
      </Field>
      <Field>
        <FieldLabel htmlFor="tipo-metodologia">Tipo</FieldLabel>
        <Select value={tipo} onValueChange={setTipo} disabled={ocupado}>
          <SelectTrigger id="tipo-metodologia" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_METODOLOGIA.map((t) => (
              <SelectItem key={t.valor} value={t.valor}>
                {t.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </form>
  )
}

/** Uma linha de item — nome, os campos daquele tipo, o estado e as ações.
 * Mesma forma de `LinhaConta` em `PaginaPessoasAdmin`: `article`, selo,
 * botões à direita. */
function LinhaItem({
  nome,
  detalhe,
  ativo,
  aoAlterar,
  aoAlternarAtivo,
  ocupado,
}: {
  nome: string
  detalhe: string
  ativo: boolean
  aoAlterar: () => void
  aoAlternarAtivo: () => void
  ocupado: boolean
}) {
  return (
    <article className="flex flex-wrap items-center gap-3 border-2 border-traco bg-card px-3 py-2.5">
      <div className="flex min-w-[220px] grow flex-col gap-0.5">
        <h3 className="text-base leading-tight">{nome}</h3>
        <p className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">{detalhe}</p>
      </div>

      <SeloEstado ativo={ativo} />

      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          onClick={aoAlterar}
          className="min-h-11 rounded-none border-2 px-4 text-[13px] font-bold"
        >
          Alterar
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={ocupado}
          onClick={aoAlternarAtivo}
          className={`min-h-11 rounded-none px-3 text-[13px] ${ativo ? 'text-err' : ''}`}
        >
          {ativo ? 'Desativar' : 'Reativar'}
          <span className="sr-only">: {nome}</span>
        </Button>
      </div>
    </article>
  )
}

/**
 * A tela de gestão de vocabulário: componente curricular, série e
 * metodologia, num painel só (RF-07).
 *
 * Três abas, como `PaginaModeracao` — o mesmo padrão de `Chip` com
 * `role="tablist"`. O formulário abre em `Dialog`, e serve as duas ações
 * (cadastrar e alterar): sem `id` na entrada, a mutação cria; com `id`,
 * altera (`useSalvarComponente` e as duas irmãs decidem por isso).
 *
 * O item desativado continua na lista, com o selo à vista — é dali que se
 * reativa. Esconder equivaleria a uma exclusão que a API não faz.
 */
export function PaginaVocabulario({ cliente }: { cliente: Cliente }) {
  const [aba, setAba] = useState<Aba>('componentes')
  const [itemEmEdicao, setItemEmEdicao] = useState<
    | { tipo: 'componentes'; item: Componente | null }
    | { tipo: 'series'; item: Serie | null }
    | { tipo: 'metodologias'; item: Metodologia | null }
    | null
  >(null)
  // Desativar passa por confirmação, como em `PaginaPessoasAdmin`: o item
  // some do filtro da Biblioteca INTEIRA, e os planos que já o citam ficam
  // sem a opção que os encontra. Reativar não pergunta — devolver o item ao
  // filtro não tira nada de ninguém.
  const [aDesativar, setADesativar] = useState<{ nome: string; desativar: () => void } | null>(null)

  const { vocabulario, carregando, erro } = useVocabularioAdmin(cliente)
  const salvarComponente = useSalvarComponente(cliente)
  const salvarSerie = useSalvarSerie(cliente)
  const salvarMetodologia = useSalvarMetodologia(cliente)

  const salvando = salvarComponente.isPending || salvarSerie.isPending || salvarMetodologia.isPending
  const erroSalvar = salvarComponente.error ?? salvarSerie.error ?? salvarMetodologia.error

  /**
   * Limpa o erro das três mutações.
   *
   * Sem o `reset`, o `error` do TanStack Query sobrevive ao fechamento do
   * diálogo: a falha de um cadastro de série reaparecia no formulário de
   * metodologia aberto em seguida, apontando para um problema que não era
   * daquela tela. Todo caminho que ABRE um diálogo passa por aqui.
   */
  function limparErro() {
    salvarComponente.reset()
    salvarSerie.reset()
    salvarMetodologia.reset()
  }

  function fechar() {
    setItemEmEdicao(null)
    limparErro()
  }

  /** Abre o formulário de alteração, sempre com o erro anterior limpo. */
  function abrirAlteracao(alvo: NonNullable<typeof itemEmEdicao>) {
    limparErro()
    setItemEmEdicao(alvo)
  }

  /** Reativar age direto; desativar guarda a ação e abre a confirmação. */
  function alternar(nome: string, ativoAgora: boolean, aplicar: () => void) {
    if (!ativoAgora) {
      aplicar()
      return
    }
    setADesativar({ nome, desativar: aplicar })
  }

  /** Abre o formulário de cadastro para a aba corrente. Uma função por aba
   * mantém o `switch` exaustivo sem recorrer a `as` — o tipo de
   * `itemEmEdicao` é uma união discriminada por `tipo`. */
  function abrirCadastro() {
    limparErro()
    if (aba === 'componentes') setItemEmEdicao({ tipo: 'componentes', item: null })
    else if (aba === 'series') setItemEmEdicao({ tipo: 'series', item: null })
    else setItemEmEdicao({ tipo: 'metodologias', item: null })
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px]">Vocabulário</h1>
        <p className="text-muted-foreground">
          Componente curricular, série e metodologia que classificam um plano.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Tipo de vocabulário">
        {ABAS.map((item) => (
          <Chip key={item.aba} ativo={aba === item.aba} onClick={() => setAba(item.aba)}>
            {item.rotulo}
          </Chip>
        ))}
      </div>

      <div>
        <Button
          type="button"
          onClick={abrirCadastro}
          className="min-h-11 rounded-none border-2 border-traco bg-acao px-5 font-bold text-acao-texto hover:bg-acao-hover"
        >
          Cadastrar {aba === 'componentes' ? 'componente' : aba === 'series' ? 'série' : 'metodologia'}
        </Button>
      </div>

      {erro ? (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
          {mensagemDe(erro)}
        </p>
      ) : carregando ? (
        <p className="px-2 py-6 text-muted-foreground">Carregando o vocabulário…</p>
      ) : aba === 'componentes' ? (
        vocabulario.componentes.length === 0 ? (
          <div className="flex items-center gap-3 border-2 border-traco bg-card px-6 py-8">
            <Tag size={20} weight="bold" aria-hidden className="flex-none text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum componente cadastrado.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {vocabulario.componentes.map((c) => (
              <LinhaItem
                key={c.id}
                nome={c.nome}
                detalhe={`${c.sigla} · ${rotuloCor(c.cor)}`}
                ativo={c.ativo}
                aoAlterar={() => abrirAlteracao({ tipo: 'componentes', item: c })}
                aoAlternarAtivo={() =>
                  alternar(c.nome, c.ativo, () =>
                    // O `PUT` substitui o item inteiro, então todo campo do
                    // contrato vai junto. `ordem` ficou de FORA do contrato: a
                    // API a calcula no cadastro e a preserva na alteração,
                    // justamente para nenhuma tela precisar reenviá-la.
                    salvarComponente.mutate({
                      id: c.id,
                      nome: c.nome,
                      area: c.area,
                      sigla: c.sigla,
                      cor: c.cor,
                      ativo: !c.ativo,
                    }),
                  )
                }
                ocupado={salvando}
              />
            ))}
          </div>
        )
      ) : aba === 'series' ? (
        vocabulario.series.length === 0 ? (
          <div className="flex items-center gap-3 border-2 border-traco bg-card px-6 py-8">
            <Tag size={20} weight="bold" aria-hidden className="flex-none text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma série cadastrada.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {vocabulario.series.map((s) => (
              <LinhaItem
                key={s.id}
                nome={s.nome}
                detalhe={`${s.sigla} · ${rotuloEtapa(s.etapa)}`}
                ativo={s.ativa}
                aoAlterar={() => abrirAlteracao({ tipo: 'series', item: s })}
                aoAlternarAtivo={() =>
                  alternar(s.nome, s.ativa, () =>
                    salvarSerie.mutate({
                      id: s.id,
                      nome: s.nome,
                      etapa: s.etapa,
                      rotuloCompleto: s.rotuloCompleto,
                      sigla: s.sigla,
                      ativa: !s.ativa,
                    }),
                  )
                }
                ocupado={salvando}
              />
            ))}
          </div>
        )
      ) : vocabulario.metodologias.length === 0 ? (
        <div className="flex items-center gap-3 border-2 border-traco bg-card px-6 py-8">
          <Tag size={20} weight="bold" aria-hidden className="flex-none text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma metodologia cadastrada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {vocabulario.metodologias.map((m) => (
            <LinhaItem
              key={m.id}
              nome={m.nome}
              detalhe={rotuloTipo(m.tipo)}
              ativo={m.ativa}
              aoAlterar={() => abrirAlteracao({ tipo: 'metodologias', item: m })}
              aoAlternarAtivo={() =>
                alternar(m.nome, m.ativa, () =>
                  salvarMetodologia.mutate({
                    id: m.id,
                    nome: m.nome,
                    tipo: m.tipo,
                    ativa: !m.ativa,
                  }),
                )
              }
              ocupado={salvando}
            />
          ))}
        </div>
      )}

      <Dialog open={itemEmEdicao !== null} onOpenChange={(aberto) => !aberto && fechar()}>
        <DialogContent>
          {itemEmEdicao && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {itemEmEdicao.item ? 'Alterar' : 'Cadastrar'}{' '}
                  {itemEmEdicao.tipo === 'componentes'
                    ? 'componente'
                    : itemEmEdicao.tipo === 'series'
                      ? 'série'
                      : 'metodologia'}
                </DialogTitle>
                <DialogDescription>
                  {itemEmEdicao.tipo === 'componentes' &&
                    'A cor sai da paleta do tema — quatro tokens fechados.'}
                  {itemEmEdicao.tipo === 'series' && 'A etapa é fundamental ou médio.'}
                  {itemEmEdicao.tipo === 'metodologias' && 'O tipo é metodologia, técnica ou ferramenta.'}
                </DialogDescription>
              </DialogHeader>

              {itemEmEdicao.tipo === 'componentes' && (
                <FormularioComponente
                  componente={itemEmEdicao.item}
                  ocupado={salvando}
                  aoSalvar={(entrada) =>
                    // `id` só entra quando existe: com `exactOptionalPropertyTypes`,
                    // `id: undefined` não é o mesmo que "campo ausente", e a
                    // mutação decide criar ou alterar pela AUSÊNCIA da chave.
                    salvarComponente.mutate(
                      { ...entrada, ...(itemEmEdicao.item ? { id: itemEmEdicao.item.id } : {}) },
                      { onSuccess: fechar },
                    )
                  }
                />
              )}
              {itemEmEdicao.tipo === 'series' && (
                <FormularioSerie
                  serie={itemEmEdicao.item}
                  ocupado={salvando}
                  aoSalvar={(entrada) =>
                    salvarSerie.mutate(
                      { ...entrada, ...(itemEmEdicao.item ? { id: itemEmEdicao.item.id } : {}) },
                      { onSuccess: fechar },
                    )
                  }
                />
              )}
              {itemEmEdicao.tipo === 'metodologias' && (
                <FormularioMetodologia
                  metodologia={itemEmEdicao.item}
                  ocupado={salvando}
                  aoSalvar={(entrada) =>
                    salvarMetodologia.mutate(
                      { ...entrada, ...(itemEmEdicao.item ? { id: itemEmEdicao.item.id } : {}) },
                      { onSuccess: fechar },
                    )
                  }
                />
              )}

              {erroSalvar && (
                <p role="alert" className="text-sm text-err">
                  {mensagemDe(erroSalvar)}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={fechar} disabled={salvando}>
                  Cancelar
                </Button>
                <Button type="submit" form="form-vocabulario" disabled={salvando}>
                  Salvar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={aDesativar !== null} onOpenChange={(aberto) => !aberto && setADesativar(null)}>
        <DialogContent>
          {aDesativar && (
            <>
              <DialogHeader>
                <DialogTitle>Desativar {aDesativar.nome}?</DialogTitle>
                <DialogDescription>
                  O item sai dos filtros da Biblioteca e do formulário de catalogação. Os planos
                  que já o citam continuam no acervo. Dá para reativar depois, por esta mesma tela.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setADesativar(null)}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={salvando}
                  onClick={() => {
                    aDesativar.desativar()
                    setADesativar(null)
                  }}
                >
                  Desativar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
