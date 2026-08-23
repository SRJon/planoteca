# contracts/

## O que e

`openapi-v1.json` e a especificacao OpenAPI do back-end par deste boilerplate, o
`saraivatech-api`. Este repositorio guarda um arquivo congelado dela.

O back-end e a pasta irma `../saraivatech-api`, no mesmo repositorio. Ele so publica a
especificacao em ambiente Development. Em producao a rota nao existe.
Sem um snapshot commitado, o contrato entre front e back nao teria revisao — nem em CI, nem
em PR.

## De onde vem este arquivo

O contrato do boilerplate nasceu **escrito a mao**, derivado da leitura do
`PersonSampleController.cs` e dos DTOs do `saraivatech-api`, campo a campo.

Ele nasceu assim por um motivo: das oito rotas, duas ainda nao existem no back-end. O
`POST /auth/login` e o `GET /auth/userinfo` sao o contrato que o back-end **precisa
implementar**. Escrever essa parte a mao era inevitavel.

Assim que a API estiver no ar com as oito rotas, execute `npm run api:sync` contra ela. A
partir dai o arquivo passa a ser gerado, e a regra abaixo volta a valer.

## Como regenerar

```bash
npm run api:sync
```

Busca a especificacao viva, grava `contracts/openapi-v1.json` e gera os tipos TypeScript em
`src/shared/api/schema.d.ts`, via `openapi-typescript`.

Para gerar os tipos a partir do arquivo commitado, sem tocar a rede:

```bash
npm run api:sync -- --arquivo contracts/openapi-v1.json
```

Outros modos, todos em `scripts/api-sync.mjs`:

- `npm run api:check` — sem rede. Regenera os tipos a partir do `openapi-v1.json` commitado e
  compara com `schema.d.ts`. Falha quando alguem alterou um dos dois sem sincronizar.
- `npm run api:diff` — com rede. Busca a API viva e compara com o arquivo commitado. Quando a
  API esta inalcancavel, sai com codigo 0 e um aviso. API fora do ar nunca derruba o build.

`npm install`, `npm run dev`, `npm test` e `npm run build` nunca tocam a rede. So `api:sync` e
`api:diff` tocam, e os dois sao manuais.

## Por que isso importa

O contrato commitado transforma alteracao de back-end em diff revisavel. O `git diff` de
`openapi-v1.json` e o changelog do contrato.

Sem esse arquivo, uma propriedade renomeada no back-end chega ao front como campo `undefined`
em producao. Com ele, chega como conflito de tipo no `npm run typecheck`.

## O que conferir contra a API viva

Dois pontos do contrato foram derivados do codigo C#, e nao observados numa resposta real:

- O casing de `UserInfoDto`. O record C# mistura `FirstName`, `EmployeeID` e `UserFullName`
  com campos minusculos. O contrato assume o camelCase padrao do `AddJsonOptions`, entao
  espera `firstName`, `employeeID` e `userFullName`. O `employeeID` e o candidato mais
  provavel a divergir.
- A forma do corpo do `POST /auth/login`. Nao existe DTO de entrada no back-end, e o
  `LoginRequest` do contrato e uma proposta.
