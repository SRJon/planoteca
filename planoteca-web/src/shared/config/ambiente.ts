export type ConfigFirebase = {
  apiKey: string
  authDomain: string
  projectId: string
}

export type Ambiente = {
  urlApi: string
  modo: 'dev' | 'prod'
  /**
   * A configuração do Firebase Authentication.
   *
   * `null` quando não está preenchida — e isso NÃO é erro: a Biblioteca
   * inteira é pública, e quem mexe nela não deveria precisar de um projeto no
   * Firebase para rodar o front. O que fica indisponível é o login.
   *
   * Estes três valores são PÚBLICOS por natureza: viajam no bundle do
   * navegador, e o Firebase conta com isso. O que protege o projeto são as
   * regras de segurança e a lista de domínios autorizados no console, nunca o
   * segredo destes campos.
   */
  firebase: ConfigFirebase | null
}

type Bruto = Record<string, string | undefined>

export function lerAmbiente(bruto: Bruto): Ambiente {
  const urlApi = bruto['VITE_URL_API']
  if (!urlApi) throw new Error('VITE_URL_API não foi definida')
  if (urlApi.endsWith('/')) throw new Error('VITE_URL_API não pode terminar em barra')

  const apiKey = bruto['VITE_FIREBASE_API_KEY']
  const authDomain = bruto['VITE_FIREBASE_AUTH_DOMAIN']
  const projectId = bruto['VITE_FIREBASE_PROJECT_ID']

  // Os três juntos, ou nenhum. Uma configuração pela metade falharia na
  // primeira tentativa de login, com um erro do SDK que não diz qual campo
  // falta.
  const firebase =
    apiKey && authDomain && projectId ? { apiKey, authDomain, projectId } : null

  return {
    urlApi,
    modo: bruto['MODE'] === 'production' ? 'prod' : 'dev',
    firebase,
  }
}
