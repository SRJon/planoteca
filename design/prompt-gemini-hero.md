# Prompt para gerar a imagem do hero — Gemini

Para a **Variação B, "Cartaz"**: a imagem sangra a largura inteira do hero e o
texto vive por cima dela, à esquerda.

Isso impõe duas exigências que uma ilustração comum não tem:

1. **Formato bem largo** — 1866 × 600, quase 3:1.
2. **A metade esquerda precisa ficar quase vazia.** É onde entram o título de
   76px, o parágrafo e os dois botões. Se o assunto estiver centrado, o texto
   cobre justamente o que interessa.

Um véu diagonal escuro é aplicado por cima da arte, mais forte à esquerda e
transparente à direita, para o texto passar em contraste AA. A arte precisa
sobreviver a esse véu — por isso ela deve ser **escura por natureza**, e não
clara.

---

## Prompt principal

```
Ilustração vetorial chapada (flat vector illustration), estilo livro didático
brasileiro dos anos 1960–70 cruzado com modernismo gráfico suíço.

FORMATO: banner horizontal muito largo, proporção 3:1 (1866 × 600 pixels).

COMPOSIÇÃO — regra mais importante: o terço esquerdo da imagem deve ficar
praticamente VAZIO, apenas fundo liso escuro, sem nenhum elemento. Todo o
assunto fica concentrado na metade direita da imagem. A transição entre o vazio
à esquerda e o assunto à direita deve ser suave.

ASSUNTO (só na metade direita): uma estante ou parede de fichários vista de
frente, em grade regular, cada pasta com uma lombada colorida diferente
identificando uma matéria escolar. Uma das pastas está puxada para fora da
grade, em papel claro, destacada das demais.

FUNDO: azul-marinho muito escuro e uniforme (#1B2739), ocupando toda a imagem.
A ilustração é escura, noturna, com os elementos coloridos surgindo do fundo.

PALETA EXATA E FECHADA — apenas estas cores, nenhuma outra:
#1B2739 (fundo, azul-marinho escuro)
#2B4059 (azul médio, elementos secundários)
#3A5578 (índigo)
#A6522E (terracota)
#C9A54A (dourado)
#2F6B5E (verde)
#7A3B4E (vinho)
#8A5A2B (ocre)
#4A6B33 (verde-oliva)
#5B4A7A (roxo acinzentado)
#F2F0EC (papel claro, só no elemento em destaque)

TRAÇO: contorno uniforme de 2px onde houver contorno. Espessura constante.

GEOMETRIA: apenas retângulos, quadrados e círculos. Cantos retos, 90 graus.
Sem cantos arredondados.

PROIBIDO — nenhum destes pode aparecer: gradiente, degradê, sombra, sombra
projetada, brilho, reflexo, textura, ruído, granulado, perspectiva
tridimensional, isometria, aquarela, pintura, rosto humano, mão, pessoa, texto
legível, letra, número, logotipo, marca, ícone de interface, seta decorativa,
estrela, brilho cintilante, luz volumétrica.

Iluminação plana, sem fonte de luz. Proporção 3:1.
```

---

## Variantes de assunto

Troque só o bloco `ASSUNTO:`, mantendo todo o resto — sobretudo a regra de
composição e a paleta.

**Grade de planos**
```
ASSUNTO (só na metade direita): uma grade regular de retângulos verticais
sugerindo fichas ou páginas arquivadas, cada uma com uma faixa colorida no topo.
Uma delas, em papel claro, está deslocada para a frente da grade.
```

**Abstrato geométrico** — a mais segura
```
ASSUNTO (só na metade direita): composição abstrata de barras verticais e
quadrados em compasso rítmico, sugerindo prateleiras e páginas sem representar
objetos literais. Três formas primárias em destaque: uma barra vertical alta,
um quadrado e um círculo.
```

**Arquivo em corte**
```
ASSUNTO (só na metade direita): um arquivo de gavetas visto de frente, com uma
gaveta aberta revelando fileiras de pastas coloridas alinhadas. Vista frontal
plana, sem perspectiva.
```

Quanto menos figurativo o assunto, menor a chance de o modelo inventar textura,
gradiente ou perspectiva.

---

## Como avaliar o resultado

Recuse e gere de novo se:

- **o terço esquerdo não estiver vazio** — este é o erro que inviabiliza a imagem
- a imagem for clara em vez de escura (o texto branco some por cima)
- aparecer cor fora da lista
- houver gradiente, mesmo sutil
- houver sombra sob os objetos
- houver canto arredondado
- houver texto ou rabisco simulando texto

---

## Depois de gerar

Me passe o arquivo. Eu encaixo no hero, recalibro o véu diagonal para o contraste
do texto passar em AA sobre a arte real, e verifico o resultado em desktop e em
390px.

**Formato:** PNG ou WebP, largura mínima de 1900px.
**Destino:** `planoteca-web/public/`.

Se a arte tiver detalhe fino demais, ela vai sumir no celular, onde o hero é
recortado. Nesse caso eu gero um recorte alternativo ou uso uma versão mais
simples em telas pequenas — te aviso se for o caso.
