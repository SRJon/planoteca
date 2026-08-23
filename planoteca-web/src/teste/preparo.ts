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
