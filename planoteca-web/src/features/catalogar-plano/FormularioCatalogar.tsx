import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Trash } from '@phosphor-icons/react/dist/csr/Trash'
import { useFieldArray } from 'react-hook-form'
import type { Vocabulario } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { CampoArquivo } from '@/components/ui/campo-arquivo'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EtapaEnvio, useCatalogarPlano } from './useCatalogarPlano'

type Catalogacao = ReturnType<typeof useCatalogarPlano>

/** O rótulo em mono, caixa alta e espacejado que a direção usa nas seções. */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

/** Um bloco do formulário. `fieldset`/`legend` porque cada bloco é um grupo
 * de controles com rótulo comum — é assim que um leitor de tela anuncia
 * "Catalogação, Série, botão 9º ano, pressionado". */
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <legend className="p-0">
        <Etiqueta>{titulo}</Etiqueta>
      </legend>
      {children}
    </fieldset>
  )
}

/** `string | undefined` explícito, e não `mensagem?: string`: com
 * `exactOptionalPropertyTypes`, o projeto distingue "prop ausente" de "prop
 * com undefined", e `erros.campo?.message` produz a segunda forma. */
function Erro({ mensagem }: { mensagem: string | undefined }) {
  if (!mensagem) return null
  return (
    <p role="alert" className="text-sm text-err">
      {mensagem}
    </p>
  )
}

const ROTULO_ETAPA: Record<EtapaEnvio, string> = {
  parado: 'Catalogar plano',
  assinando: 'Preparando o envio…',
  subindo: 'Enviando o arquivo…',
  catalogando: 'Gravando o plano…',
}

/**
 * O formulário de catalogação.
 *
 * ── Desenhado para a DÉCIMA vez, não para a primeira ─────────────────────
 *
 * O briefing é explícito: este formulário será preenchido "dezenas de vezes
 * seguidas na fase de povoamento". Três decisões saem daí:
 *
 * 1. **Um único fluxo vertical**, sem passos nem abas. Quem cataloga está
 *    com o PDF aberto ao lado e desce copiando campo a campo; um assistente
 *    de três etapas obrigaria a navegar para conferir o que já foi digitado.
 * 2. **Chips para o vocabulário**, o mesmo controle do filtro da Biblioteca.
 *    Quem administra também usa o acervo, e o gesto já é conhecido.
 * 3. **O que se repete permanece** ao concluir (ver `useCatalogarPlano`).
 *
 * Os rótulos são os do documento de origem — "Objetos de conhecimento
 * abordados", "Expectativas de aprendizagem" —, não nomes inventados. Quem
 * cataloga procura no PDF a mesma palavra que lê na tela.
 */
export function FormularioCatalogar({
  catalogacao,
  vocabulario,
}: {
  catalogacao: Catalogacao
  vocabulario: Vocabulario
}) {
  const { form, submeter, erroGeral, etapaEnvio, enviando, arquivo, escolherArquivo, erroArquivo } =
    catalogacao
  const { register, formState, watch, setValue } = form
  const erros = formState.errors

  const etapas = useFieldArray({ control: form.control, name: 'etapas' })

  const principalId = watch('componentePrincipalId')
  const secundariosIds = watch('componentesSecundariosIds')
  const seriesIds = watch('seriesIds')
  const metodologiasIds = watch('metodologiasIds')
  const publicar = watch('publicar')

  /** Liga ou desliga um id numa lista. É o gesto do chip: clicar no já ativo
   * desfaz. */
  function alternar(lista: string[], id: string): string[] {
    return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-8" noValidate>
      <Bloco titulo="Arquivo">
        <CampoArquivo
          rotulo="Escolher o PDF do plano"
          arquivo={arquivo}
          aoEscolher={escolherArquivo}
          erro={erroArquivo}
        />
      </Bloco>

      <Bloco titulo="Identificação">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" {...register('titulo')} aria-invalid={!!erros.titulo} />
          <Erro mensagem={erros.titulo?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="autoria">Autoria</Label>
          <Input
            id="autoria"
            {...register('autoria')}
            aria-invalid={!!erros.autoria}
            placeholder="Quem escreveu o plano"
          />
          <Erro mensagem={erros.autoria?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objetosConhecimento">Objetos de conhecimento abordados</Label>
          <Textarea
            id="objetosConhecimento"
            rows={2}
            {...register('objetosConhecimento')}
            aria-invalid={!!erros.objetosConhecimento}
          />
          {/* É o eixo de busca do acervo, no lugar do código BNCC que os
              relatos não trazem. Um plano sem isto entra e ninguém acha. */}
          <p className="text-xs text-muted-foreground">
            É por aqui que o professor encontra o plano na busca.
          </p>
          <Erro mensagem={erros.objetosConhecimento?.message} />
        </div>
      </Bloco>

      <Bloco titulo="Componente curricular">
        <div className="flex flex-col gap-2">
          <span className="text-sm">Principal</span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {vocabulario.componentes.map((componente) => (
              <Chip
                key={componente.id}
                ativo={principalId === componente.id}
                onClick={() =>
                  setValue(
                    'componentePrincipalId',
                    principalId === componente.id ? '' : componente.id,
                    { shouldValidate: true },
                  )
                }
              >
                {componente.nome}
              </Chip>
            ))}
          </div>
          {/* O principal decide a cor e a sigla do card. Sem ele o bloco
              nasceria neutro, e o card perderia a identidade visual. */}
          <p className="text-xs text-muted-foreground">
            Escolha um. É ele que pinta o bloco de cor do card.
          </p>
          <Erro mensagem={erros.componentePrincipalId?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm">Também aborda (prática interdisciplinar)</span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {vocabulario.componentes
              .filter((c) => c.id !== principalId)
              .map((componente) => (
                <Chip
                  key={componente.id}
                  ativo={secundariosIds.includes(componente.id)}
                  onClick={() =>
                    setValue(
                      'componentesSecundariosIds',
                      alternar(secundariosIds, componente.id),
                    )
                  }
                  // O mesmo componente aparece nos dois grupos, e um leitor
                  // de tela anunciaria "Química, botão" duas vezes sem dizer
                  // qual é qual. O rótulo desambigua.
                  aria-label={`${componente.nome} como componente secundário`}
                >
                  {componente.nome}
                </Chip>
              ))}
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Série">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1.5">
          {vocabulario.series.map((serie) => (
            <Chip
              key={serie.id}
              ativo={seriesIds.includes(serie.id)}
              onClick={() => setValue('seriesIds', alternar(seriesIds, serie.id), {
                shouldValidate: true,
              })}
              aria-label={serie.rotuloCompleto}
            >
              {serie.sigla}
            </Chip>
          ))}
        </div>
        {/* Um relato real declara "2ª série I01 e 2ª série I02" — mais de uma
            série por plano é a norma, não a exceção. */}
        <p className="text-xs text-muted-foreground">Pode marcar mais de uma.</p>
        <Erro mensagem={erros.seriesIds?.message} />

        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <Label htmlFor="modalidade">Modalidade</Label>
            <Input id="modalidade" {...register('modalidade')} placeholder="Integral, Regular…" />
          </div>
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <Label htmlFor="turmaOrigem">Turma de origem</Label>
            <Input id="turmaOrigem" {...register('turmaOrigem')} placeholder="2ºIM02-EM-COM" />
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Metodologia">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {vocabulario.metodologias
            .filter((m) => m.tipo === 'metodologia')
            .map((metodologia) => (
              <Chip
                key={metodologia.id}
                ativo={metodologiasIds.includes(metodologia.id)}
                onClick={() =>
                  setValue('metodologiasIds', alternar(metodologiasIds, metodologia.id))
                }
              >
                {metodologia.nome}
              </Chip>
            ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Um plano pode combinar duas — "Storytelling e Escape Room".
        </p>
      </Bloco>

      <Bloco titulo="A prática">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objetivo">Objetivo da prática</Label>
          <Textarea id="objetivo" rows={3} {...register('objetivo')} aria-invalid={!!erros.objetivo} />
          <Erro mensagem={erros.objetivo?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expectativas">Expectativas de aprendizagem</Label>
          <Textarea
            id="expectativas"
            rows={3}
            {...register('expectativasAprendizagem')}
            aria-invalid={!!erros.expectativasAprendizagem}
          />
          <Erro mensagem={erros.expectativasAprendizagem?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recursos">Recursos utilizados</Label>
          <Textarea id="recursos" rows={2} {...register('recursos')} />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex w-[140px] flex-col gap-1.5">
            <Label htmlFor="duracaoAulas">Aulas</Label>
            <Input id="duracaoAulas" inputMode="numeric" {...register('duracaoAulas')} />
          </div>
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <Label htmlFor="duracaoDescricao">Formato</Label>
            <Input
              id="duracaoDescricao"
              {...register('duracaoDescricao')}
              placeholder="Sequência didática, 1 bimestre…"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="codigosBncc">Códigos BNCC</Label>
          <Input id="codigosBncc" {...register('codigosBncc')} placeholder="EF09MA05, EF09MA06" />
          {/* Nenhum dos relatos analisados traz código. O campo existe para
              quem souber preencher, e a ausência é o normal. */}
          <p className="text-xs text-muted-foreground">
            Opcional. Separe por vírgula se houver mais de um.
          </p>
        </div>
      </Bloco>

      <Bloco titulo="Como conduzir">
        <ol className="flex list-none flex-col gap-3 p-0">
          {etapas.fields.map((campo, indice) => (
            <li key={campo.id} className="flex gap-3">
              {/* Número em círculo porque a ORDEM é real: as etapas
                  acontecem em sequência. Não é enfeite de lista. */}
              <span
                aria-hidden
                className="mt-2 grid size-7 flex-none place-items-center border-2 border-traco font-mono text-[12px] font-bold"
              >
                {indice + 1}
              </span>
              <div className="flex min-w-0 grow flex-col gap-1.5">
                <Label htmlFor={`etapa-titulo-${indice}`} className="sr-only">
                  Título da etapa {indice + 1}
                </Label>
                <Input
                  id={`etapa-titulo-${indice}`}
                  {...register(`etapas.${indice}.titulo`)}
                  placeholder={`Título da etapa ${indice + 1}`}
                />
                <Label htmlFor={`etapa-descricao-${indice}`} className="sr-only">
                  Descrição da etapa {indice + 1}
                </Label>
                <Textarea
                  id={`etapa-descricao-${indice}`}
                  rows={2}
                  {...register(`etapas.${indice}.descricao`)}
                  placeholder="O que acontece nesta etapa"
                />
              </div>
              {etapas.fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-1 min-h-11 rounded-none px-2"
                  onClick={() => etapas.remove(indice)}
                >
                  <Trash size={15} weight="bold" aria-hidden />
                  <span className="sr-only">Remover a etapa {indice + 1}</span>
                </Button>
              )}
            </li>
          ))}
        </ol>

        <Button
          type="button"
          variant="outline"
          className="w-fit gap-1.5 rounded-none border-2"
          onClick={() => etapas.append({ titulo: '', descricao: '' })}
        >
          <Plus size={15} weight="bold" aria-hidden />
          Acrescentar etapa
        </Button>
        {/* A ordem sai da posição na lista, não de um campo digitado: remover
            a etapa do meio renumera o resto sozinho. */}
        <p className="text-xs text-muted-foreground">
          Etapa sem descrição é descartada no envio.
        </p>
      </Bloco>

      {erroGeral && (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-3 text-err">
          {erroGeral}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t-2 border-traco pt-5">
        <Button
          type="submit"
          disabled={enviando}
          className="min-h-12 rounded-none border-2 border-traco bg-acao px-6 text-[15px] font-bold text-acao-texto hover:bg-acao-hover"
        >
          {ROTULO_ETAPA[etapaEnvio]}
        </Button>

        {/* Catalogar e publicar são coisas diferentes: dá para subir uma leva
            inteira em rascunho e publicar depois de conferir. */}
        <Chip
          ativo={publicar}
          onClick={() => setValue('publicar', !publicar)}
          aria-label="Publicar assim que catalogar"
        >
          {publicar ? 'Publicar ao salvar' : 'Salvar como rascunho'}
        </Chip>
      </div>
    </form>
  )
}
