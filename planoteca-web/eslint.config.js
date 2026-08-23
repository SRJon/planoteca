import js from '@eslint/js'
import ts from 'typescript-eslint'
import react from 'eslint-plugin-react'
import hooks from 'eslint-plugin-react-hooks'
import boundaries from 'eslint-plugin-boundaries'
import globals from 'globals'

export default ts.config(
  { ignores: ['dist', 'coverage', 'src/shared/api/schema.d.ts'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { react, 'react-hooks': hooks, boundaries },
    settings: {
      'import/resolver': { typescript: true },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app/**' },
        { type: 'pages',    pattern: 'src/pages/*',    capture: ['fatia'] },
        { type: 'features', pattern: 'src/features/*', capture: ['fatia'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['fatia'] },
        { type: 'shared',   pattern: 'src/shared/*',   capture: ['segmento'] },
        // `src/components/` é o que o shadcn instala: código sem domínio,
        // consumido por qualquer camada — a mesma natureza de `src/shared/`,
        // só que fora dela porque a CLI do shadcn escreve em caminho fixo.
        { type: 'shared',   pattern: 'src/components/*', capture: ['segmento'] },
      ],
    },
    rules: {
      ...hooks.configs.recommended.rules,
      // A fronteira do contrato gerado. `src/shared/api/schema.d.ts` tem 12 mil
      // linhas geradas de `contracts/openapi-v1.json` e muda a cada `api:sync`.
      // O padrão que as fatias seguem — e que esta regra passa a cobrar — é:
      // UM arquivo por fatia importa o schema, converte para o vocabulário do
      // domínio e re-exporta o DTO para o fetch da própria fatia. É o
      // `mapeador.ts` de `entities/projeto` e o `permissoes.ts` de `app/shell`.
      //
      // Sem a regra, a alternativa que aparece sozinha é redeclarar o DTO à
      // mão — e isso não é hipótese: `entities/sessao/permissao.ts` tinha um
      // `PerfilTelaBruto` copiado campo a campo do `PerfilTelaDto` gerado, que
      // uma regeneração do contrato não atualizaria.
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/shared/api/schema', '**/shared/api/schema'],
          message:
            'Só o mapeador da fatia importa schema.d.ts (mapeador.ts / permissoes.ts). ' +
            'Converta o DTO para o vocabulário do domínio ali e importe o tipo do domínio aqui.',
        }],
      }],
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'app',      allow: ['pages', 'features', 'entities', 'shared'] },
          { from: 'pages',    allow: ['features', 'entities', 'shared'] },
          { from: 'features', allow: ['entities', 'shared'] },
          { from: 'entities', allow: ['shared'] },
          { from: 'shared',   allow: ['shared'] },
        ],
      }],
      'boundaries/entry-point': ['error', {
        default: 'disallow',
        rules: [
          { target: ['pages', 'features', 'entities'], allow: 'index.ts' },
          { target: ['shared'], allow: '**' },
        ],
      }],
      // O controle cru fica reservado a quem o embrulha: `src/components/ui`,
      // o que a CLI do shadcn instala. `shared/ui` saiu na Task 8, e com ele
      // a segunda casa que esta regra abria — hoje existe UM lugar onde um
      // `<button>` é legítimo, e é a exceção logo abaixo.
      'react/forbid-elements': ['error', {
        forbid: [
          { element: 'button',   message: 'use Button de @/components/ui/button' },
          { element: 'input',    message: 'use Input de @/components/ui/input' },
          { element: 'select',   message: 'use Select de @/components/ui/select' },
          { element: 'textarea', message: 'use Textarea de @/components/ui/textarea' },
        ],
      }],
    },
  },
  {
    files: ['src/components/ui/**/*.tsx'],
    rules: { 'react/forbid-elements': 'off' },
  },
  {
    // Os mapeadores — o lado de dentro da fronteira do contrato gerado.
    files: ['src/**/mapeador.ts', 'src/**/permissoes.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
)
