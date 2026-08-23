using System;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>Um texto na listagem do blog.</summary>
    public class PostResumoDto
    {
        public Guid Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Resumo { get; set; }

        /// <summary>Quem escreveu. O controller usa para decidir se um
        /// professor pode ler o próprio texto não publicado — ver
        /// `AdminPostsController.Obter`.</summary>
        public Guid AutorId { get; set; }

        public string AutorNome { get; set; } = string.Empty;
        public string Situacao { get; set; } = string.Empty;
        public DateTime? PublicadoEm { get; set; }
        public DateTime CriadoEm { get; set; }

        /// <summary>Por que o texto foi devolvido ou recusado.
        ///
        /// Só chega ao próprio autor e ao administrador — a listagem pública
        /// só devolve publicados, onde este campo é nulo.</summary>
        public string? ComentarioModeracao { get; set; }
    }

    /// <summary>O texto completo.</summary>
    public class PostDetalheDto : PostResumoDto
    {
        public string Corpo { get; set; } = string.Empty;
    }

    /// <summary>O que o professor escreve.</summary>
    public class PostEntradaDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Resumo { get; set; }
        public string Corpo { get; set; } = string.Empty;
    }

    /// <summary>A decisão do administrador sobre um texto.</summary>
    public class ModeracaoDto
    {
        /// <summary>`publicado`, `devolvido` ou `recusado`. Nunca `pendente`:
        /// moderar é sair da pendência.</summary>
        public string Situacao { get; set; } = string.Empty;

        /// <summary>Obrigatório para devolver ou recusar (RF-11). Devolver sem
        /// dizer o motivo transforma moderação em silêncio: o professor
        /// reescreve o mesmo texto sem saber o que corrigir.</summary>
        public string? Comentario { get; set; }
    }
}
