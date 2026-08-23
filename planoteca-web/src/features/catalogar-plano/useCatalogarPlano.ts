import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { assinarUpload, catalogarPlano, subirArquivo } from '@/entities/plano'
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
 * A catalogação de um plano, de ponta a ponta.
 *
 * ── Os três passos, e por que são três ───────────────────────────────────
 *
 * 1. **Assinar**: a API devolve uma URL temporária do Cloudflare R2.
 * 2. **Subir**: o navegador manda o PDF DIRETO para o R2, sem passar pela
 *    API. Ver `entities/plano/apiAdmin.ts` para o porquê.
 * 3. **Catalogar**: a API grava o plano com a URL pública do arquivo.
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
  const [catalogados, setCatalogados] = useState<string[]>([])

  const form = useForm<CamposCatalogar>({
    resolver: zodResolver(esquema),
    defaultValues: CAMPOS_VAZIOS,
  })

  function escolherArquivo(novo: File | null) {
    setErroArquivo(null)
    if (novo && novo.type !== 'application/pdf') {
      setErroArquivo('O acervo recebe PDF. Converta o arquivo antes de enviar.')
      setArquivo(null)
      return
    }
    setArquivo(novo)
  }

  const submeter = form.handleSubmit(async (campos) => {
    setErroGeral(null)

    // O arquivo não passa pelo Zod: ele não é um campo do formulário, é
    // estado à parte (`input type="file"` não é controlado pelo RHF sem
    // ginástica que não paga o preço).
    if (!arquivo) {
      setErroArquivo('Escolha o PDF do plano.')
      return
    }

    try {
      setEtapaEnvio('assinando')
      const assinado = await assinarUpload(cliente, arquivo.name, arquivo.type)

      setEtapaEnvio('subindo')
      await subirArquivo(assinado.urlUpload, arquivo, arquivo.type)

      setEtapaEnvio('catalogando')
      const duracao = Number(campos.duracaoAulas)
      const entrada: PlanoEntrada = {
        titulo: campos.titulo.trim(),
        autoria: campos.autoria.trim(),
        objetosConhecimento: campos.objetosConhecimento.trim(),
        objetivo: campos.objetivo.trim(),
        expectativasAprendizagem: campos.expectativasAprendizagem.trim(),
        arquivoUrl: assinado.urlPublica,
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
        ...(campos.recursos.trim() ? { recursos: campos.recursos.trim() } : {}),
        ...(campos.modalidade.trim() ? { modalidade: campos.modalidade.trim() } : {}),
        ...(campos.turmaOrigem.trim() ? { turmaOrigem: campos.turmaOrigem.trim() } : {}),
        ...(Number.isFinite(duracao) && duracao > 0 ? { duracaoAulas: duracao } : {}),
        ...(campos.duracaoDescricao.trim()
          ? { duracaoDescricao: campos.duracaoDescricao.trim() }
          : {}),
      }

      await catalogarPlano(cliente, entrada)
      setCatalogados((anteriores) => [campos.titulo.trim(), ...anteriores])

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
      })
      setArquivo(null)
    } catch (erro) {
      setErroGeral(mensagemDe(erro))
    } finally {
      setEtapaEnvio('parado')
    }
  })

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
