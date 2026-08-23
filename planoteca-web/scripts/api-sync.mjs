// Sincroniza o contrato da API. Só este script acessa a rede.
// Uso:
//   node scripts/api-sync.mjs                     busca da API local
//   node scripts/api-sync.mjs --url <endereco>    busca do endereço
//   node scripts/api-sync.mjs --arquivo <caminho> lê de um arquivo
//   node scripts/api-sync.mjs --check             regenera o tipo e compara (sem rede)
//   node scripts/api-sync.mjs --diff              compara o contrato com a API viva
import { readFile, writeFile } from 'node:fs/promises'
import { argv, exit } from 'node:process'
import openapiTS, { astToString } from 'openapi-typescript'

const PADRAO = 'https://localhost:7206/openapi/v1.json'
const CONTRATO = 'contracts/openapi-v1.json'
const TIPOS = 'src/shared/api/schema.d.ts'

const arg = (nome) => {
  const i = argv.indexOf(nome)
  return i === -1 ? undefined : argv[i + 1]
}
const tem = (nome) => argv.includes(nome)

if (tem('--check') && tem('--diff')) {
  console.error('--check e --diff são exclusivos entre si. Escolha um.')
  exit(1)
}

async function buscar(url) {
  // A API local usa certificado de desenvolvimento, que não tem cadeia confiável.
  const antes = process.env.NODE_TLS_REJECT_UNAUTHORIZED
  if (url.startsWith('https://localhost')) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  try {
    // O fetch nativo do Node manda "Accept-Language: *" por padrão, e o middleware
    // de localização da API derruba a requisição com 500 nesse valor coringa.
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.text()
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = antes ?? '1'
  }
}

async function gerarTipos(textoJson) {
  const ast = await openapiTS(JSON.parse(textoJson))
  return astToString(ast)
}

const normalizar = (texto) => JSON.stringify(JSON.parse(texto), null, 2) + '\n'

async function principal() {
  if (tem('--check')) {
    const contrato = await readFile(CONTRATO, 'utf8')
    const esperado = await gerarTipos(contrato)
    const atual = await readFile(TIPOS, 'utf8')
    if (esperado !== atual) {
      console.error(`${TIPOS} não corresponde a ${CONTRATO}. Rode: npm run api:sync`)
      exit(1)
    }
    console.log('tipos em dia com o contrato')
    return
  }

  if (tem('--diff')) {
    const url = arg('--url') ?? PADRAO
    let vivo
    try {
      vivo = normalizar(await buscar(url))
    } catch (erro) {
      console.log(`API inalcançável em ${url}. Verificação pulada. (${erro.message})`)
      return
    }
    const contrato = await readFile(CONTRATO, 'utf8')
    if (vivo !== contrato) {
      console.error(`${CONTRATO} divergiu da API viva. Rode: npm run api:sync`)
      exit(1)
    }
    console.log('contrato em dia com a API viva')
    return
  }

  const caminho = arg('--arquivo')
  const bruto = caminho ? await readFile(caminho, 'utf8') : await buscar(arg('--url') ?? PADRAO)
  const contrato = normalizar(bruto)

  // Gera os tipos antes de gravar qualquer coisa. Se openapiTS() rejeitar o schema,
  // nada no disco muda — os dois arquivos nunca ficam num par inconsistente.
  const tipos = await gerarTipos(contrato)

  await writeFile(CONTRATO, contrato, 'utf8')
  await writeFile(TIPOS, tipos, 'utf8')
  console.log(`gravado ${CONTRATO} e ${TIPOS}`)
}

principal().catch((erro) => {
  console.error(erro.stack ?? erro.message)
  exit(1)
})
