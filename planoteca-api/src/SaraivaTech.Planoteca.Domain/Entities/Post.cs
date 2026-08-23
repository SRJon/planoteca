using System;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um texto do blog. Nasce pendente e só vai ao ar depois que um
    /// administrador aprova — não há publicação direta, nem para professor
    /// veterano.
    ///
    /// ComentarioModeracao é obrigatório quando a situação vira Devolvido ou
    /// Recusado (RF-11): devolver sem dizer o motivo transforma moderação em
    /// silêncio.
    /// </summary>
    public class Post : Entity
    {
        public Guid AutorId { get; set; }
        public Pessoa? Autor { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Resumo { get; set; }
        public string Corpo { get; set; } = string.Empty;
        public string Situacao { get; set; } = SituacaoPost.Pendente;
        public string? ComentarioModeracao { get; set; }
        public Guid? ModeradoPorId { get; set; }
        public Pessoa? ModeradoPor { get; set; }
        public DateTime? ModeradoEm { get; set; }
        public DateTime? PublicadoEm { get; set; }
        public DateTime CriadoEm { get; set; }
    }
}
