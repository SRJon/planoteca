using System;
using System.Collections.Generic;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um plano de aula do acervo.
    ///
    /// Os nomes dos campos vêm dos rótulos literais dos relatos da SEDU
    /// ("Objetos de conhecimento abordados", "Expectativas de aprendizagem"),
    /// não de um modelo inventado.
    ///
    /// Duas ausências deliberadas:
    ///
    /// 1. Não existe ComponenteId nem SerieId. Um relato real declara "2ª
    ///    série I01 e 2ª série I02", e prática interdisciplinar cruza
    ///    componentes — as duas ligações são N:N.
    /// 2. CodigosBncc é coleção OPCIONAL. Nenhum dos relatos analisados traz
    ///    código de habilidade; o eixo de busca é ObjetosConhecimento, que
    ///    todo plano tem.
    /// </summary>
    public class Plano : Entity
    {
        public string Titulo { get; set; } = string.Empty;

        /// <summary>Quem escreveu o plano. TEXTO, não FK para Pessoa: o autor
        /// do PDF quase nunca terá conta no sistema, e forçar cadastro criaria
        /// contas fantasma só para carregar um nome.</summary>
        public string Autoria { get; set; } = string.Empty;

        /// <summary>"Objetos de conhecimento abordados". É o eixo de busca da
        /// Biblioteca, no lugar do código BNCC que os relatos não trazem.</summary>
        public string ObjetosConhecimento { get; set; } = string.Empty;

        /// <summary>Regular, Integral, Integrado. Vinha grudado no ano nos
        /// relatos ("2ª série I01"); aqui é campo próprio.</summary>
        public string? Modalidade { get; set; }

        /// <summary>O código cru da turma, preservado como veio: `2ºIM02-EM-COM`.
        /// A amostra que gerou este modelo foi pequena — guardar o original
        /// permite reprocessar sem voltar aos PDFs.</summary>
        public string? TurmaOrigem { get; set; }

        public string Objetivo { get; set; } = string.Empty;
        public string ExpectativasAprendizagem { get; set; } = string.Empty;

        /// <summary>"Recurso(s) utilizado(s)". Prosa corrida, não lista: é
        /// assim que os relatos escrevem.</summary>
        public string? Recursos { get; set; }

        /// <summary>Número de aulas, para o filtro por duração funcionar.</summary>
        public int? DuracaoAulas { get; set; }

        /// <summary>O que o número não expressa: "Sequência didática",
        /// "1 bimestre".</summary>
        public string? DuracaoDescricao { get; set; }

        /// <summary>O anexo: PDF ou imagem. Público, servido sem token — ver
        /// a regra do acervo público no CLAUDE.md da raiz.
        ///
        /// OPCIONAL. Um plano sem anexo continua no acervo e aparece na
        /// Biblioteca como qualquer outro; só o botão de download some. Nem
        /// todo relato chega com arquivo, e recusar o plano por causa disso
        /// deixaria o acervo mais pobre do que precisa.</summary>
        public string? ArquivoUrl { get; set; }

        /// <summary>Links de material de apoio que os relatos trazem (Drive).</summary>
        public string? LinksExtras { get; set; }

        public string Situacao { get; set; } = SituacaoPlano.Rascunho;

        /// <summary>Quem CATALOGOU, que não é quem escreveu. Ver Autoria.</summary>
        public Guid? CatalogadoPorId { get; set; }
        public Pessoa? CatalogadoPor { get; set; }

        public DateTime? PublicadoEm { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime AtualizadoEm { get; set; }

        public ICollection<PlanoComponente> Componentes { get; set; } = [];
        public ICollection<PlanoSerie> Series { get; set; } = [];
        public ICollection<PlanoMetodologia> Metodologias { get; set; } = [];
        public ICollection<EtapaPlano> Etapas { get; set; } = [];
        public ICollection<Bncc> CodigosBncc { get; set; } = [];
    }
}
