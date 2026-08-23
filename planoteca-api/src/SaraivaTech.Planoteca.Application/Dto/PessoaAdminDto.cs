using System;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>Uma pessoa na listagem do painel administrativo.</summary>
    public class PessoaAdminDto
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Papel { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public DateTime CriadoEm { get; set; }

        /// <summary>Quantos textos do blog esta pessoa publicou.</summary>
        public int PostsPublicados { get; set; }

        /// <summary>Quantos textos aguardam moderação.</summary>
        public int PostsPendentes { get; set; }
    }

    /// <summary>O que o painel manda para promover ou rebaixar.</summary>
    public class AlterarPapelDto
    {
        /// <summary>`professor` ou `administrador`.</summary>
        public string Papel { get; set; } = string.Empty;
    }

    /// <summary>O que o painel manda para ativar ou desativar a conta.</summary>
    public class AlterarAtivoDto
    {
        public bool Ativo { get; set; }
    }
}
