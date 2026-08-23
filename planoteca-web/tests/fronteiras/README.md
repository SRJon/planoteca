# Fronteiras de camada — como reproduzir a validação

Este diretório não contém testes automatizados. Registra como validar manualmente que
`eslint.config.js` reprova violação de camada (Feature-Sliced Design) e de elemento HTML bruto.

A Task 2 plantou, confirmou e removeu os quatro arquivos de violação abaixo. Para reproduzir a
validação, recrie-os, rode `npm run lint`, confirme os três achados e remova-os de novo.

## Os quatro arquivos e o que cada um demonstra

| Arquivo (removido após a validação)         | Conteúdo                                                  | Regra que reprova           |
| ------------------------------------------- | ----------------------------------------------------------| ---------------------------- |
| `src/shared/lib/viola-camada.ts`            | `import x from '@/entities/projeto'; export default x`    | `boundaries/element-types` — `shared` não pode importar de `entities` |
| `src/entities/projeto/interno.ts`           | `export const a = 1`                                      | apoio (não é violação em si) |
| `src/entities/projeto/index.ts`             | `export * from './interno'`                                | apoio (ponto de entrada válido da fatia) |
| `src/features/viola/viola-entrada.ts`       | `import { a } from '@/entities/projeto/interno'; export default a` | `boundaries/entry-point` — import direto no arquivo interno da fatia, ignorando `index.ts` |
| `src/pages/teste/viola-botao.tsx`           | `export const T = () => <button>x</button>`                | `react/forbid-elements` — `<button>` bruto fora de `shared/ui` |

Nota de posicionamento: `viola-entrada.ts` fica em `src/features/viola/`, dentro de uma fatia,
não solto em `src/features/`. O padrão `boundaries/elements` para `features` é
`src/features/*`, com captura de `fatia`. Um arquivo solto em `src/features/viola-entrada.ts`
não resolve de forma inequívoca como elemento da camada.

## Dependência necessária para a resolução do alias `@/`

`eslint-plugin-boundaries` só classifica um import como pertencente a uma camada se conseguir
resolver o caminho do módulo até um arquivo real. O alias `@/` está mapeado em `tsconfig.json`
e em `vite.config.ts` para `src/*`. Sem um resolver configurado, o alias não resolve. As regras
`boundaries/element-types` e `boundaries/entry-point` não disparam, mesmo com a violação
plantada. Por isso `eslint.config.js` declara:

```js
settings: {
  'import/resolver': { typescript: true },
  ...
}
```

usando o pacote `eslint-import-resolver-typescript` (instalado como dependência de
desenvolvimento). Sem essa linha, as duas regras de `boundaries` ficam mudas — reprovam zero
arquivos mesmo com violação real presente.

## Como reproduzir

```bash
mkdir -p src/shared/lib src/entities/projeto src/features/viola src/pages/teste

echo "import x from '@/entities/projeto'; export default x" > src/shared/lib/viola-camada.ts
echo "export const a = 1" > src/entities/projeto/interno.ts
echo "export * from './interno'" > src/entities/projeto/index.ts
echo "import { a } from '@/entities/projeto/interno'; export default a" > src/features/viola/viola-entrada.ts
printf 'export const T = () => <button>x</button>\n' > src/pages/teste/viola-botao.tsx

npm run lint
# Esperado: código 1, com achados de boundaries/element-types,
# boundaries/entry-point e react/forbid-elements.

rm src/shared/lib/viola-camada.ts src/features/viola/viola-entrada.ts \
   src/pages/teste/viola-botao.tsx src/entities/projeto/interno.ts src/entities/projeto/index.ts
rmdir src/pages/teste src/features/viola src/entities/projeto

npm run lint
# Esperado: código 0.
```
