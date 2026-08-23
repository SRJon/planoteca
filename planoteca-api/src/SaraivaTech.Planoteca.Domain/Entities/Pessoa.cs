using System;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Quem tem conta na Planoteca: professor ou administrador.
    ///
    /// O papel é COLUNA, e não grupo de diretório como no boilerplate
    /// corporativo de origem: na Planoteca a pessoa se cadastra sozinha pelo
    /// Firebase, e não existe diretório que a classifique. Todo mundo nasce
    /// professor; só um administrador promove.
    ///
    /// FirebaseUid é o `sub` do token do Firebase — o identificador estável
    /// da conta, seja ela do Google ou de e-mail/senha. Não é o `sub` do
    /// Google: o Firebase é quem emite o token, e o provedor de origem fica
    /// nos claims (`firebase.sign_in_provider`).
    /// </summary>
    public class Pessoa : Entity
    {
        public string? FirebaseUid { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Papel { get; set; } = PapelPessoa.Professor;
        public bool Ativo { get; set; } = true;
        public DateTime CriadoEm { get; set; }
    }
}
