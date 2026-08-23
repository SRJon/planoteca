using System.Linq;
using FluentValidation;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Core.Validations
{
    /// <summary>
    /// As regras do texto do blog, incluindo a que dá sentido à moderação.
    /// </summary>
    public class PostValidator : AbstractValidator<Post>
    {
        public PostValidator()
        {
            RuleSet("Insert", () =>
            {
                RegrasComuns();

                // Nenhum caminho de escrita cria um post já publicado. Quem
                // publica é o administrador, pela moderação — inclusive
                // quando o autor é administrador.
                RuleFor(x => x.Situacao)
                    .Equal(SituacaoPost.Pendente)
                    .WithMessage("Todo texto nasce pendente de aprovação.");
            });

            RuleSet("Update", () =>
            {
                RuleFor(x => x.Id).NotEmpty();
                RegrasComuns();

                RuleFor(x => x.Situacao)
                    .Must(s => SituacaoPost.Todas.Contains(s))
                    .WithMessage("Situação de texto desconhecida.");

                // RF-11: devolver ou recusar sem dizer o motivo transforma
                // moderação em silêncio. O professor fica sem saber o que
                // corrigir, e escreve de novo o mesmo texto.
                RuleFor(x => x.ComentarioModeracao)
                    .NotEmpty()
                    .When(x => SituacaoPost.ExigemComentario.Contains(x.Situacao))
                    .WithMessage("Diga ao autor por que o texto foi devolvido ou recusado.");

                RuleFor(x => x.ModeradoPorId)
                    .NotNull()
                    .When(x => x.Situacao != SituacaoPost.Pendente)
                    .WithMessage("Registre quem moderou o texto.");
            });

            RuleSet("Delete", () => RuleFor(x => x.Id).NotEmpty());
        }

        private void RegrasComuns()
        {
            RuleFor(x => x.AutorId).NotEmpty().WithMessage("O texto precisa de autor.");
            RuleFor(x => x.Titulo).NotEmpty().WithMessage("O texto precisa de título.").MaximumLength(300);
            RuleFor(x => x.Corpo).NotEmpty().WithMessage("O texto está vazio.");
            RuleFor(x => x.Resumo).MaximumLength(500);
        }
    }
}
