import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor } from './servidor'

beforeAll(() => servidor.listen({ onUnhandledRequest: 'error' }))
afterEach(() => servidor.resetHandlers())
afterAll(() => servidor.close())

// jsdom não implementa a Pointer Events API nem `scrollIntoView` — o
// `@radix-ui/react-select` chama os três ao abrir a lista (posicionamento
// via popper, captura de ponteiro no item). Sem o polyfill, todo teste que
// realmente ABRE o `Selecao` (não só foca o gatilho fechado) lança
// `TypeError` fora do `render`, como efeito colateral do ambiente de teste,
// não um bug do componente. Ver https://github.com/jsdom/jsdom/issues/3294.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom não implementa `Range.getClientRects`/`getBoundingClientRect` — o
// ProseMirror (por trás do editor Tiptap de `EditorTexto`) chama os dois ao
// posicionar a seleção na tela (`EditorView.scrollToSelection`). Sem o
// polyfill, todo teste que digita ou seleciona texto no editor lança
// `TypeError: target.getClientRects is not a function` depois do teste já
// ter passado — mesma classe de lacuna do `hasPointerCapture` acima, outra
// biblioteca. Ver https://github.com/jsdom/jsdom/issues/3729.
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    toJSON: () => {},
  })
}
// Mesmo motivo: `posAtCoords` do ProseMirror usa `elementFromPoint` para
// traduzir um clique do mouse em posição no documento.
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null
}
