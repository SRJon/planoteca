import { useState } from 'react'
import type { BaseSyntheticEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { assinarUpload, catalogarPlano, subirArquivo } from '@/entities/plano'
import { limparRascunho } from './useRascunho'
import type { PlanoEntrada } from '@/entities/plano'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

const OBRIGATORIO = 'Campo obrigatório.'

/**
 * O que o formulário valida ANTES de tocar na rede.
 *
 * Os campos de texto espelham os rótulos literais dos relatos da SEDU
 * ("Objetos de conhecimento abordados", "Expectativas de aprendizagem"), e
 * não um modelo inventado — quem cataloga está com o PDF aberto ao lado, e
 * copiar campo a campo é o gesto real.
 */
const esquema = z.object({
  titulo: z.string().min(1, OBRIGATORIO).max(300),
  autoria: z.string().min(1, OBRIGATORIO).max(300),
  objetosConhecimento: z.string().min(1, OBRIGATORIO),
  objetivo: z.string().min(1, OBRIGATORIO),
  expectativasAprendizagem: z.string().min(1, OBRIGATORIO),
  recursos: z.string(),
  modalidade: z.string(),
  turmaOrigem: z.string(),
  // Texto, e não `number`: um campo numérico vazio vira `NaN` no RHF, e o
  // erro que aparece ("Expected number, received nan") não diz nada a quem
  // só deixou a duração em branco. A conversão acontece no envio.
  duracaoAulas: z.string(),
  duracaoDescricao: z.string(),
  componentePrincipalId: z.string().min(1, 'Escolha o componente principal.'),
  componentesSecundariosIds: z.array(z.string()),
  seriesIds: z.array(z.string()).min(1, 'Escolha ao menos uma série.'),
  metodologiasIds: z.array(z.string()),
  etapas: z.array(
    z.object({
      titulo: z.string(),
      descricao: z.string(),
    }),
  ),
  codigosBncc: z.string(),
  publicar: z.boolean(),
})

export type CamposCatalogar = z.infer<typeof esquema>

/** O formulário vazio. Exportado porque a tela precisa dele para "catalogar
 * outro" sem desmontar o componente. */
export const CAMPOS_VAZIOS: CamposCatalogar = {
  titulo: '',
  autoria: '',
  objetosConhecimento: '',
  objetivo: '',
  expectativasAprendizagem: '',
  recursos: '',
  modalidade: '',
  turmaOrigem: '',
  duracaoAulas: '',
  duracaoDescricao: '',
  componentePrincipalId: '',
  componentesSecundariosIds: [],
  seriesIds: [],
  metodologiasIds: [],
  etapas: [{ titulo: '', descricao: '' }],
  codigosBncc: '',
  publicar: true,
}

/** Em que ponto do envio estamos. A tela mostra isso porque o upload de um
 * PDF grande demora, e um botão parado sem explicação parece travado. */
export type EtapaEnvio = 'parado' | 'assinando' | 'subindo' | 'catalogando'

/**
 * Um plano catalogado nesta sessão, e para ONDE ele foi.
 *
 * O destino importa tanto quanto o título: um plano em rascunho não está na
 * Biblioteca, e a confirmação que oferecia "Ver na Biblioteca" para todos
 * mandava a pessoa procurar onde ele não estava.
 */
export type PlanoCatalogado = {
  titulo: string
  publicado: boolean
}

/** O formulário em 4 passos, cada um com o nome que a barra de progresso
 * mostra e os campos que "Continuar" valida antes de avançar. O arquivo
 * (`File`) não entra aqui: é estado à parte, e o passo 1 o valida sozinho. */
export const PASSOS = [
  { numero: 1, nome: 'Arquivo e identificação' },
  { numero: 2, nome: 'Onde se aplica' },
  { numero: 3, nome: 'A prática' },
  { numero: 4, nome: 'Como conduzir' },
] as const

export type NumeroPasso = (typeof PASSOS)[number]['numero']

/** O nome de cada passo, para indexação segura por `NumeroPasso` —
 * `PASSOS[n]` não seria: `noUncheckedIndexedAccess` trata todo acesso por
 * índice numérico como possivelmente ausente, mesmo quando `n` é um union
 * fechado. Um `Record` indexado pela CHAVE não sofre disso. */
export const NOME_PASSO: Record<NumeroPasso, string> = {
  1: 'Arquivo e identificação',
  2: 'Onde se aplica',
  3: 'A prática',
  4: 'Como conduzir',
}

/** Os campos que cada passo valida ao avançar. `etapas` e `publicar` não
 * entram: o passo 4 não avança, ele envia — e o schema já os aceita em
 * qualquer estado (a lista de etapas nunca é vazia, `publicar` tem
 * default). */
export const CAMPOS_POR_PASSO: Record<NumeroPasso, (keyof CamposCatalogar)[]> = {
  1: ['titulo', 'autoria', 'objetosConhecimento'],
  2: [
    'componentePrincipalId',
    'componentesSecundariosIds',
    'seriesIds',
    'modalidade',
    'turmaOrigem',
    'metodologiasIds',
  ],
  3: [
    'objetivo',
    'expectativasAprendizagem',
    'recursos',
    'duracaoAulas',
    'duracaoDescricao',
    'codigosBncc',
  ],
  4: ['etapas', 'publicar'],
}

/**
 * O que o acervo aceita como anexo — espelha a lista que a API assina em
 * `POST /admin/lesson-plans/upload-url`. Divergir daqui produz um upload que
 * o R2 recusa depois de a pessoa já ter esperado o envio inteiro.
 *
 * Imagem entra porque boa parte do acervo real é foto ou print do material, e
 * ela é entregue como o PDF: o mesmo botão baixa o arquivo.
 */
export const TIPOS_ACEITOS: readonly string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

/**
 * A catalogação de um plano, de ponta a ponta.
 *
 * ── Os três passos, e por que são três ───────────────────────────────────
 *
 * 1. **Assinar**: a API devolve uma URL temporária do Cloudflare R2.
 * 2. **Subir**: o navegador manda o arquivo DIRETO para o R2, sem passar pela
 *    API. Ver `entities/plano/apiAdmin.ts` para o porquê.
 * 3. **Catalogar**: a API grava o plano com a URL pública do arquivo.
 *
 * Os passos 1 e 2 são PULADOS quando não há anexo — ele é opcional desde
 * 2026-08-26, e um plano sem arquivo é catalogado direto no passo 3.
 *
 * Se o passo 3 falhar, o arquivo já está no R2 e vira órfão. É uma troca
 * consciente: a alternativa seria a API mediar o upload, o que não cabe no
 * plano gratuito do Render. Um administrador que tente de novo gera um
 * arquivo novo; a limpeza de órfãos fica para uma rotina posterior, e está
 * registrada no `Docs/todo.md`.
 *
 * ── Otimizado para REPETIÇÃO ─────────────────────────────────────────────
 *
 * O briefing diz que este formulário será preenchido "dezenas de vezes
 * seguidas na fase de povoamento". Por isso, ao concluir, ele NÃO limpa
 * tudo: série, componente e metodologia costumam se repetir entre planos da
 * mesma leva, e reescolher os três a cada plano seria o atrito que faz
 * alguém desistir na décima vez.
 */
export function useCatalogarPlano(cliente: Cliente) {
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [etapaEnvio, setEtapaEnvio] = useState<EtapaEnvio>('parado')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  /** Quantos planos foram catalogados nesta sessão. É o retorno que diz
   * "funcionou" sem tirar a pessoa da tela. */
  const [catalogados, setCatalogados] = useState<PlanoCatalogado[]>([])

  const form = useForm<CamposCatalogar>({
    resolver: zodResolver(esquema),
    defaultValues: CAMPOS_VAZIOS,
  })

  function escolherArquivo(novo: File | null) {
    setErroArquivo(null)
    if (novo && !TIPOS_ACEITOS.includes(novo.type)) {
      setErroArquivo('O acervo recebe PDF ou imagem. Converta o arquivo antes de enviar.')
      setArquivo(null)
      return
    }
    setArquivo(novo)
  }

  /** O desfecho de um envio — o que quem chama `submeter` precisa saber para
   * decidir, por exemplo, se reabre o passo 1. `form.handleSubmit` não
   * repassa o retorno do callback interno, então `submeter` (abaixo) captura
   * o desfecho numa variável local e o devolve depois do `await` — sem
   * `ref` nem efeito, só o fluxo normal de uma função assíncrona. */
  type DesfechoEnvio = 'sucesso' | 'invalido' | 'erro'

  async function submeter(evento?: BaseSyntheticEvent): Promise<DesfechoEnvio> {
    let desfecho: DesfechoEnvio = 'invalido'

    await form.handleSubmit(async (campos) => {
      setErroGeral(null)

      try {
        // O anexo é OPCIONAL: sem arquivo, os dois primeiros passos (assinar e
        // subir) simplesmente não acontecem, e o plano é catalogado sem
        // `arquivoUrl`. Ele aparece na Biblioteca normalmente — só a faixa de
        // download some do card.
        let urlPublica: string | null = null
        if (arquivo) {
          setEtapaEnvio('assinando')
          const assinado = await assinarUpload(cliente, arquivo.name, arquivo.type)

          setEtapaEnvio('subindo')
          await subirArquivo(assinado.urlUpload, arquivo, arquivo.type)
          urlPublica = assinado.urlPublica
        }

        setEtapaEnvio('catalogando')
        const duracao = Number(campos.duracaoAulas)
        const entrada: PlanoEntrada = {
          titulo: campos.titulo.trim(),
          autoria: campos.autoria.trim(),
          objetosConhecimento: campos.objetosConhecimento.trim(),
          objetivo: campos.objetivo.trim(),
          expectativasAprendizagem: campos.expectativasAprendizagem.trim(),
          componentePrincipalId: campos.componentePrincipalId,
          componentesSecundariosIds: campos.componentesSecundariosIds,
          seriesIds: campos.seriesIds,
          metodologiasIds: campos.metodologiasIds,
          // A ordem sai da POSIÇÃO na lista, não de um campo: o formulário
          // deixa remover uma etapa do meio, e uma ordem com buraco (1, 2, 4)
          // seria recusada pelo banco com um erro ilegível.
          etapas: campos.etapas
            .filter((e) => e.descricao.trim() !== '')
            .map((e, indice) => ({
              ordem: indice + 1,
              titulo: e.titulo.trim() || null,
              descricao: e.descricao.trim(),
            })),
          // Vírgula, ponto e vírgula ou espaço — quem cataloga cola de onde
          // achou, e brigar com o separador é atrito à toa.
          codigosBncc: campos.codigosBncc
            .split(/[,;\s]+/)
            .map((c) => c.trim().toUpperCase())
            .filter((c) => c !== ''),
          publicar: campos.publicar,
          ...(urlPublica ? { arquivoUrl: urlPublica } : {}),
          ...(campos.recursos.trim() ? { recursos: campos.recursos.trim() } : {}),
          ...(campos.modalidade.trim() ? { modalidade: campos.modalidade.trim() } : {}),
          ...(campos.turmaOrigem.trim() ? { turmaOrigem: campos.turmaOrigem.trim() } : {}),
          ...(Number.isFinite(duracao) && duracao > 0 ? { duracaoAulas: duracao } : {}),
          ...(campos.duracaoDescricao.trim()
            ? { duracaoDescricao: campos.duracaoDescricao.trim() }
            : {}),
        }

        await catalogarPlano(cliente, entrada)
        // O DESTINO viaja junto com o título: sem ele, a confirmação
        // oferecia "Ver na Biblioteca" para um plano em rascunho — que é
        // justamente onde ele não aparece.
        setCatalogados((anteriores) => [
          { titulo: campos.titulo.trim(), publicado: campos.publicar },
          ...anteriores,
        ])
        limparRascunho()

        // O que se PRESERVA entre um plano e o seguinte: as escolhas de
        // vocabulário e a modalidade. O que se limpa: o que é único de cada
        // plano. É o que torna a décima catalogação tão rápida quanto a
        // segunda.
        form.reset({
          ...CAMPOS_VAZIOS,
          componentePrincipalId: campos.componentePrincipalId,
          componentesSecundariosIds: campos.componentesSecundariosIds,
          seriesIds: campos.seriesIds,
          metodologiasIds: campos.metodologiasIds,
          modalidade: campos.modalidade,
          turmaOrigem: campos.turmaOrigem,
          publicar: campos.publicar,
          ...(urlPublica ? { arquivoUrl: urlPublica } : {}),
        })
        setArquivo(null)
        desfecho = 'sucesso'
      } catch (erro) {
        setErroGeral(mensagemDe(erro))
        desfecho = 'erro'
      } finally {
        setEtapaEnvio('parado')
      }
    })(evento)

    return desfecho
  }

  return {
    form,
    submeter,
    erroGeral,
    etapaEnvio,
    enviando: etapaEnvio !== 'parado',
    arquivo,
    escolherArquivo,
    erroArquivo,
    catalogados,
  }
}
