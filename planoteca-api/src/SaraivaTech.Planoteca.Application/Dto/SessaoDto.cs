using System;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>
    /// Quem está usando o sistema, do ponto de vista da aplicação.
    ///
    /// É o que `GET /api/v1/auth/me` devolve: o front manda o token do
    /// Firebase e recebe de volta a pessoa como a Planoteca a conhece —
    /// com o PAPEL, que o Firebase não sabe.
    /// </summary>
    public class SessaoDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;

        /// <summary>`professor` ou `administrador`. Vem do NOSSO banco, nunca
        /// do token: o Firebase autentica, a Planoteca autoriza.</summary>
        public string Papel { get; set; } = string.Empty;

        public bool Ativo { get; set; }

        /// <summary>`true` quando este login criou o cadastro. O front usa para
        /// dar as boas-vindas em vez de um retorno silencioso.</summary>
        public bool Novo { get; set; }
    }
}
