import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowsDownUp } from '@phosphor-icons/react/dist/csr/ArrowsDownUp'
import { DotsThree } from '@phosphor-icons/react/dist/csr/DotsThree'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CampoArquivo } from '@/components/ui/campo-arquivo'
import { CampoBusca } from '@/components/ui/campo-busca'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Marca } from '@/components/marca'
import {
  TOKENS_CAMADA,
  TOKENS_COR_MARCA,
  TOKENS_COR_PRIMITIVAS,
  TOKENS_COR_SHADCN,
  TOKENS_RAIO,
} from './tokensReferencia'

const OPCOES_FILIAL = [
  { valor: 'norte', rotulo: 'Filial Norte' },
  { valor: 'sul', rotulo: 'Filial Sul' },
]

const LINHAS_TABELA = [
  { codigo: 1001, descricao: 'Revisão de cadastro', situacao: 'pendente' as const },
  { codigo: 1002, descricao: 'Atualização de contato', situacao: 'concluido' as const },
]

/**
 * Uma amostra: o nome do arquivo à esquerda, o componente montado à direita.
 *
 * O `data-testid` é o contrato com `PaginaDesignSystem.test.tsx` — `arquivo`
 * precisa bater, letra por letra, com o nome do arquivo em
 * `src/components/ui/`. O teste varre o diretório por `node:fs` e cobra uma
 * amostra para cada um: um componente novo instalado pela CLI do shadcn sem
 * amostra aqui reprova a suíte, sem ninguém precisar tocar no teste.
 */
function Amostra({
  arquivo,
  nota,
  children,
}: {
  arquivo: string
  nota: string
  children: ReactNode
}) {
  return (
    <div
      data-testid={`amostra-${arquivo}`}
      className="grid gap-4 border-t border-border py-7 md:grid-cols-[13rem_1fr] md:gap-8"
    >
      <div>
        <p className="font-mono text-xs tracking-tight text-foreground">{arquivo}.tsx</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{nota}</p>
      </div>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  )
}

function Secao({
  id,
  titulo,
  resumo,
  children,
}: {
  id: string
  titulo: string
  resumo: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="mt-16">
      <h2 id={id} className="text-base font-semibold tracking-tight text-foreground">
        {titulo}
      </h2>
      <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{resumo}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

/**
 * As cores nos dois temas, lado a lado. O bloco da direita carrega a classe
 * `.dark` — o mesmo interruptor que o `TemaProvider` escreve no elemento
 * raiz, então o que aparece ali é o tema escuro de verdade, não uma segunda
 * paleta escrita à mão.
 */
function Paleta({ tema, titulo }: { tema: 'light' | 'dark'; titulo: string }) {
  const grupos = [
    { titulo: 'shadcn', nomes: TOKENS_COR_SHADCN },
    { titulo: 'marca', nomes: TOKENS_COR_MARCA },
    { titulo: 'primitivas', nomes: TOKENS_COR_PRIMITIVAS },
  ]

  return (
    <div
      data-testid={`cores-${tema}`}
      className={cn('rounded-lg bg-background p-5 ring-1 ring-border', tema === 'dark' && 'dark')}
    >
      <p className="font-mono text-xs text-muted-foreground">{titulo}</p>
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="mt-5">
          <p className="text-xs font-medium text-foreground">{grupo.titulo}</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {grupo.nomes.map((nome) => (
              <li key={nome} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-3.5 rounded-[4px] ring-1 ring-foreground/15"
                  style={{ background: `var(--color-${nome})` }}
                />
                <span className="font-mono text-[11px] text-muted-foreground">{nome}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/**
 * O catálogo do que o shadcn instalou — `src/components/ui/`.
 *
 * A página monta os componentes REAIS, do mesmo import que qualquer tela do
 * produto usa. Nada aqui é marcação reescrita à parte: o botão desta página
 * é o botão de `pages/pessoas`.
 *
 * É dev-only (`app/rotas/Rotas.tsx` só a monta com `import.meta.env.DEV`).
 * Quem adota o boilerplate apaga a fatia inteira quando o catálogo próprio
 * do produto nascer — ou a mantém, e ganha a vitrine de graça.
 */
export function PaginaDesignSystem() {
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [dialogoCamadaAberto, setDialogoCamadaAberto] = useState(false)
  const [filial, setFilial] = useState('')
  const [filialNoDialogo, setFilialNoDialogo] = useState('')

  return (
    // O `Tooltip` do Radix lança sem um `TooltipProvider` acima dele. O
    // provedor mora aqui, e não no shell, porque `/design-system` fica FORA
    // do shell (`app/rotas/Rotas.tsx`): a rota não é protegida e não monta a
    // barra lateral. Uma tela do produto que use `Tooltip` põe o provedor no
    // shell dela — é uma linha, e o erro aparece na primeira renderização.
    <TooltipProvider>
      <main className="mx-auto max-w-[70rem] px-6 pt-10 pb-24">
        <header className="max-w-[62ch]">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <Marca tamanho={22} tom="cor" />
            <span>Planoteca</span>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            Os componentes que vêm na caixa
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Catálogo vivo de <code className="font-mono text-xs">src/components/ui/</code> — o que a
            CLI do shadcn instalou, com a paleta da marca por cima. Os tokens moram em{' '}
            <code className="font-mono text-xs">src/app/estilos/tema.css</code>, num arquivo só. A
            rota existe apenas em desenvolvimento.
          </p>
        </header>

        <Secao
          id="titulo-cores"
          titulo="Cor"
          resumo="Três camadas de nome. As primitivas são a matéria-prima, e não se escrevem no JSX. Os nomes do shadcn e os nomes próprios da marca apontam para elas, e são esses que a tela usa — trocar a paleta é trocar um bloco de um arquivo."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Paleta tema="light" titulo="claro" />
            <Paleta tema="dark" titulo="escuro" />
          </div>
        </Secao>

        <Secao
          id="titulo-medidas"
          titulo="Medida"
          resumo="Raio e camada continuam sendo escala nomeada — o verificador de tokens reprova um raio fora dela e um z-index literal. Espaço e tipografia não têm mais escala própria: a do Tailwind é a mesma base de 4px, e manter duas seria manter duas."
        >
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-foreground">raio</p>
              <ul className="mt-3 flex flex-wrap items-end gap-4">
                {TOKENS_RAIO.map((nome) => (
                  <li key={nome} className="text-center">
                    <span
                      aria-hidden
                      className="block size-12 bg-secondary"
                      style={{ borderRadius: `var(--${nome})` }}
                    />
                    <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">
                      {nome.replace('raio-', '')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground">camada</p>
              {/* A ordem NÃO é sequencial: `camada-menu` fica acima de
                  `camada-dialogo` de propósito. A seção "Camadas", no fim desta
                  página, é a prova viva do porquê. */}
              <ul className="mt-3 space-y-1">
                {TOKENS_CAMADA.map((nome) => (
                  <li
                    key={nome}
                    className="flex items-baseline justify-between gap-3 font-mono text-[11px]"
                  >
                    <span className="text-muted-foreground">{nome.replace('camada-', '')}</span>
                    <span className="h-px flex-1 self-center bg-border" aria-hidden />
                    <span className="text-foreground">{`var(--${nome})`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Secao>

        <Secao
          id="titulo-componentes"
          titulo="Componentes"
          resumo="Um por arquivo instalado. O nome à esquerda é o arquivo literal dentro de src/components/ui — o teste desta página varre o diretório e cobra uma amostra para cada arquivo que encontra."
        >
          <div>
            <Amostra arquivo="button" nota="Seis variantes e quatro tamanhos, mais os tamanhos de ícone.">
              <Button>Salvar</Button>
              <Button variant="outline">Contornado</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="destructive">Excluir</Button>
              <Button variant="link">Ver detalhes</Button>
              <Button size="sm">
                <Plus />
                Novo
              </Button>
              <Button size="icon" aria-label="Buscar">
                <MagnifyingGlass />
              </Button>
              <Button disabled>Desabilitado</Button>
            </Amostra>

            <Amostra arquivo="badge" nota="Etiqueta de situação. O tom vem da variante, nunca de uma cor solta.">
              <Badge>Padrão</Badge>
              <Badge variant="secondary">Secundário</Badge>
              <Badge variant="outline">Contornado</Badge>
              <Badge variant="destructive">Bloqueado</Badge>
              <Badge variant="ghost">Rascunho</Badge>
            </Amostra>

            <Amostra arquivo="input" nota="Campo de texto. O estado inválido vem de aria-invalid, não de uma classe.">
              <Input className="w-56" placeholder="Nome" />
              <Input className="w-56" placeholder="Com erro" aria-invalid defaultValue="12/34/5678" />
              <Input className="w-56" placeholder="Desabilitado" disabled />
            </Amostra>

            <Amostra arquivo="textarea" nota="Texto longo. Cresce com o atributo rows.">
              <Textarea className="w-72" rows={3} placeholder="Observações" />
            </Amostra>

            <Amostra
              arquivo="chip"
              nota="Filtro de duas posições. O ativo é a caneta sólida — a cor de seleção, nunca a da ação. Alvo de 44px e canto vivo, a forma da direção."
            >
              <Chip>Desligado</Chip>
              <Chip ativo>Ligado</Chip>
              <Chip disabled>Indisponível</Chip>
            </Amostra>

            <Amostra
              arquivo="campo-busca"
              nota="Busca com a lupa dentro da moldura. O traço e o foco são do contêiner: um traço no input desenharia uma caixa dentro da outra."
            >
              <CampoBusca className="w-72" placeholder="Assunto ou código BNCC" />
            </Amostra>

            <Amostra
              arquivo="campo-arquivo"
              nota="O input de arquivo fica sr-only e o clique passa por um botão da direção. O rótulo nativo do sistema operacional não estiliza e vem no idioma da máquina."
            >
              {/* Amostra estática: o guia não guarda estado, e um seletor de
                  arquivo funcional aqui abriria a janela do sistema a cada
                  clique de quem só quer conferir o desenho. */}
              <CampoArquivo rotulo="Escolher o PDF do plano" arquivo={null} aoEscolher={() => {}} />
            </Amostra>

            <Amostra
              arquivo="label"
              nota="Rótulo ligado por htmlFor — o gatilho do select é um button, que rótulo aninhado não ativa."
            >
              <div className="flex w-56 flex-col gap-1.5">
                <Label htmlFor="amostra-label-campo">Nome completo</Label>
                <Input id="amostra-label-campo" placeholder="Ex.: Ana Souza" />
              </div>
            </Amostra>

            <Amostra
              arquivo="field"
              nota="Rótulo, dica e erro como um bloco só. É a composição que um formulário repete."
            >
              <Field className="w-72">
                <FieldLabel htmlFor="amostra-field-campo">Documento</FieldLabel>
                <Input id="amostra-field-campo" placeholder="000.000.000-00" aria-invalid />
                <FieldDescription>Como aparece nas telas de busca.</FieldDescription>
                <FieldError errors={[{ message: 'Documento inválido.' }]} />
              </Field>
            </Amostra>

            <Amostra
              arquivo="select"
              nota="Lista em portal. O gatilho é um button, e a lista pinta acima de qualquer diálogo aberto."
            >
              <Select value={filial} onValueChange={setFilial}>
                <SelectTrigger className="w-56" aria-label="Filial">
                  <SelectValue placeholder="Selecione uma filial" />
                </SelectTrigger>
                <SelectContent>
                  {OPCOES_FILIAL.map((opcao) => (
                    <SelectItem key={opcao.valor} value={opcao.valor}>
                      {opcao.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Amostra>

            <Amostra
              arquivo="card"
              nota="Superfície com cabeçalho e corpo. Só quando o conteúdo é unidade autônoma."
            >
              <Card className="w-80">
                <CardHeader>
                  <CardTitle>Registros</CardTitle>
                  <CardDescription>Lista de exemplo do catálogo.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  O corpo do cartão — onde o conteúdo principal entra.
                </CardContent>
              </Card>
            </Amostra>

            <Amostra arquivo="separator" nota="Linha de um pixel, horizontal ou vertical.">
              <div className="w-72">
                <p className="text-sm text-foreground">Acima</p>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">Abaixo</p>
              </div>
            </Amostra>

            <Amostra arquivo="tabs" nota="Troca de painel sem trocar de rota.">
              <Tabs defaultValue="capa" className="w-80">
                <TabsList>
                  <TabsTrigger value="capa">Capa</TabsTrigger>
                  <TabsTrigger value="itens">Itens</TabsTrigger>
                  <TabsTrigger value="embarque">Embarque</TabsTrigger>
                </TabsList>
                <TabsContent value="capa" className="pt-3 text-sm text-muted-foreground">
                  Os dados de abertura do processo.
                </TabsContent>
                <TabsContent value="itens" className="pt-3 text-sm text-muted-foreground">
                  As mercadorias declaradas.
                </TabsContent>
                <TabsContent value="embarque" className="pt-3 text-sm text-muted-foreground">
                  Navio, data e porto de destino.
                </TabsContent>
              </Tabs>
            </Amostra>

            <Amostra
              arquivo="table"
              nota="Só a marcação. O motor de ordenação é o @tanstack/react-table, montado na própria tela — ver pages/pessoas."
            >
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">
                      <span className="inline-flex items-center gap-1">
                        Código
                        <ArrowsDownUp className="size-3.5 text-muted-foreground" aria-hidden />
                      </span>
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-32">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LINHAS_TABELA.map((linha) => (
                    <TableRow key={linha.codigo}>
                      <TableCell className="tabular-nums">{linha.codigo}</TableCell>
                      <TableCell>{linha.descricao}</TableCell>
                      <TableCell>
                        <Badge variant={linha.situacao === 'concluido' ? 'secondary' : 'outline'}>
                          {linha.situacao === 'concluido' ? 'Concluído' : 'Pendente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Amostra>

            <Amostra
              arquivo="dropdown-menu"
              nota="Menu de contexto de linha. Também vive em portal, na mesma camada do select."
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Ações do registro">
                    <DotsThree weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Registro</DropdownMenuLabel>
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem>Duplicar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Amostra>

            <Amostra
              arquivo="tooltip"
              nota="Explica uma sigla sem gastar uma linha de tela. Exige um TooltipProvider acima — aqui ele embrulha a página."
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link">DI</Button>
                </TooltipTrigger>
                <TooltipContent>
                  Documento de Identificação de Cargas — número gerado pelo Siscomex.
                </TooltipContent>
              </Tooltip>
            </Amostra>

            <Amostra arquivo="dialog" nota="Confirmação destrutiva. O véu cobre o viewport inteiro.">
              <Button variant="outline" onClick={() => setDialogoAberto(true)}>
                Abrir diálogo de exemplo
              </Button>
              <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir registro</DialogTitle>
                    <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setDialogoAberto(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={() => setDialogoAberto(false)}>
                      Excluir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Amostra>
          </div>
        </Secao>

        <Secao
          id="titulo-marca"
          titulo="Marca"
          resumo="O único desenho que o boilerplate carrega, em src/components/marca. O New-Project.ps1 troca o nome na geração; o desenho fica até quem gerar o projeto substituí-lo."
        >
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-center gap-2 rounded-lg bg-secondary px-8 py-6">
              <Marca tamanho={36} tom="cor" />
              <span className="font-mono text-[11px] text-muted-foreground">cor</span>
            </div>
            {/* `solido` herda o `currentColor` — é a variante da barra lateral e
                do painel de entrada, os dois fundos onde `fill-brand` sumiria.
                Por isso a amostra dela mora sobre a superfície da barra lateral,
                não sobre a superfície do tema. */}
            <div className="flex flex-col items-center gap-2 rounded-lg bg-side-bg px-8 py-6 text-side-ink ring-1 ring-border">
              <Marca tamanho={36} />
              <span className="font-mono text-[11px] opacity-70">solido</span>
            </div>
          </div>
        </Secao>

        <Secao
          id="titulo-camadas"
          titulo="Camadas"
          resumo="A lista de um select aberto DENTRO de um diálogo aberto precisa pintar acima do véu. Os dois portais do Radix são irmãos no body, então só a ordem de pintura decide — e2e/camadas.spec.ts prova isso num navegador de verdade, por elementFromPoint. jsdom não faz layout nem pintura, e por isso nenhuma suíte de unidade alcança este defeito."
        >
          <Button variant="outline" onClick={() => setDialogoCamadaAberto(true)}>
            Abrir diálogo com seleção
          </Button>
          <Dialog open={dialogoCamadaAberto} onOpenChange={setDialogoCamadaAberto}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo registro</DialogTitle>
                <DialogDescription>
                  Abra a lista abaixo: ela precisa aparecer acima do véu deste diálogo.
                </DialogDescription>
              </DialogHeader>
              <Field>
                <FieldLabel htmlFor="amostra-camada-filial">Filial</FieldLabel>
                <Select value={filialNoDialogo} onValueChange={setFilialNoDialogo}>
                  <SelectTrigger id="amostra-camada-filial" className="w-full">
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_FILIAL.map((opcao) => (
                      <SelectItem key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </DialogContent>
          </Dialog>
        </Secao>
      </main>
    </TooltipProvider>
  )
}
