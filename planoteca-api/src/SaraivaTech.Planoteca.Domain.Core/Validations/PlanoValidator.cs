using System.Linq;
using FluentValidation;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Core.Validations
{
    /// <summary>
    /// As regras que um plano precisa cumprir para entrar no acervo.
    ///
    /// O que NÃO está aqui, de propósito:
    ///
    /// - **Código BNCC.** Nenhum dos relatos analisados traz um (RF-05).
    ///   Exigi-lo inviabilizaria o povoamento, que é manual e feito dezenas
    ///   de vezes seguidas.
    /// - **Um componente principal por plano.** Quem garante isso é o índice
    ///   único parcial no banco (RF-04b). Duplicar a regra aqui daria a
    ///   impressão de que a aplicação é a dona dela, e uma escrita que não
    ///   passe por este validador continuaria barrada — como deve ser.
    /// - **O anexo.** Havia um `ArquivoUrl` obrigatório aqui, e ele saiu: o
    ///   anexo passou a ser opcional por decisão de produto. Um plano sem
    ///   arquivo entra no acervo e aparece na Biblioteca como qualquer outro;
    ///   o que some é o botão de download. Exigi-lo recusava plano que o
    ///   acervo quer ter.
    /// </summary>
    public class PlanoValidator : AbstractValidator<Plano>
    {
        public PlanoValidator()
        {
            RuleSet("Insert", () =>
            {
                RegrasComuns();
                RuleFor(x => x.Situacao)
                    .Must(s => SituacaoPlano.Todas.Contains(s))
                    .WithMessage("Situação de plano desconhecida.");
            });

            RuleSet("Update", () =>
            {
                RuleFor(x => x.Id).NotEmpty();
                RegrasComuns();
            });

            RuleSet("Delete", () => RuleFor(x => x.Id).NotEmpty());
        }

        private void RegrasComuns()
        {
            RuleFor(x => x.Titulo)
                .NotEmpty().WithMessage("O plano precisa de um título.")
                .MaximumLength(300);

            RuleFor(x => x.Autoria)
                .NotEmpty().WithMessage("Informe quem escreveu o plano.")
                .MaximumLength(300);

            // O eixo de busca do acervo, no lugar do código BNCC que os
            // relatos não trazem. Sem isto, o plano entra e ninguém o acha.
            RuleFor(x => x.ObjetosConhecimento)
                .NotEmpty().WithMessage("Informe os objetos de conhecimento abordados.");

            RuleFor(x => x.Objetivo)
                .NotEmpty().WithMessage("Informe o objetivo da prática.");

            RuleFor(x => x.ExpectativasAprendizagem)
                .NotEmpty().WithMessage("Informe as expectativas de aprendizagem.");

            // Zero aula não é duração; é erro de digitação. Nulo continua
            // valendo — significa "não declarada".
            RuleFor(x => x.DuracaoAulas)
                .GreaterThan(0).When(x => x.DuracaoAulas.HasValue)
                .WithMessage("A duração em aulas precisa ser maior que zero.");

            RuleFor(x => x.Componentes)
                .NotEmpty().WithMessage("O plano precisa de ao menos um componente curricular.");

            RuleFor(x => x.Series)
                .NotEmpty().WithMessage("O plano precisa de ao menos uma série.");

            // Um plano com componentes mas nenhum marcado como principal
            // deixaria o card da Biblioteca sem cor e sem sigla. O banco não
            // pega este caso: o índice parcial impede DOIS principais, não a
            // ausência de um.
            RuleFor(x => x.Componentes)
                .Must(c => c.Count(pc => pc.EPrincipal) == 1)
                .When(x => x.Componentes.Any())
                .WithMessage("Marque exatamente um componente como principal.");

            // A ordem das etapas é o que a ficha usa para montar o roteiro.
            // Repetir uma ordem faria dois passos disputarem a mesma posição.
            RuleFor(x => x.Etapas)
                .Must(e => e.Select(x => x.Ordem).Distinct().Count() == e.Count)
                .When(x => x.Etapas.Any())
                .WithMessage("Duas etapas não podem ter a mesma ordem.");

            RuleForEach(x => x.Etapas).ChildRules(etapa =>
            {
                etapa.RuleFor(e => e.Ordem).GreaterThan(0)
                    .WithMessage("A ordem da etapa começa em 1.");
                etapa.RuleFor(e => e.Descricao).NotEmpty()
                    .WithMessage("A etapa precisa de descrição.");
            });
        }
    }
}
