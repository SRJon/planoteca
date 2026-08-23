import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth'
import { ambiente } from '@/shared/config'

let instancia: { app: FirebaseApp; auth: Auth } | null = null

/**
 * O SDK do Firebase, inicializado sob demanda.
 *
 * `null` quando a configuração não está preenchida — o que NÃO é erro: a
 * Biblioteca é pública e roda sem Firebase nenhum. Quem chama precisa tratar
 * o nulo, e a interface mostra que o login está indisponível em vez de
 * quebrar.
 *
 * A inicialização é preguiçosa e memoizada porque `initializeApp` lança se
 * chamado duas vezes com o mesmo nome, e o Vite recarrega módulos em
 * desenvolvimento.
 */
export function obterAuth(): Auth | null {
  if (ambiente.firebase === null) return null

  if (instancia === null) {
    const app = initializeApp(ambiente.firebase)
    const auth = getAuth(app)

    // `browserLocalPersistence`: a sessão sobrevive ao fechamento da aba.
    // O padrão do SDK já é este, mas declarar torna a escolha visível — a
    // alternativa (`browserSessionPersistence`) obrigaria a entrar de novo a
    // cada aba nova, o que num painel de trabalho é hostil.
    //
    // A promessa é ignorada de propósito: ela falha em modo privado com
    // armazenamento bloqueado, e nesse caso o SDK cai para memória sozinho —
    // a sessão vale enquanto a aba viver, que é o melhor possível ali.
    void setPersistence(auth, browserLocalPersistence)

    instancia = { app, auth }
  }

  return instancia.auth
}

/** O provedor do Google, configurado para sempre perguntar qual conta usar. */
export function provedorGoogle(): GoogleAuthProvider {
  const provedor = new GoogleAuthProvider()
  // Sem isto, quem tem uma conta só entra direto — e quem tem a pessoal e a
  // institucional entra com a errada, sem perceber. Numa escola, a conta
  // institucional é a que importa.
  provedor.setCustomParameters({ prompt: 'select_account' })
  return provedor
}
