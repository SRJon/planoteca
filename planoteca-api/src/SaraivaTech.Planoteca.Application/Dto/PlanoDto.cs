using System;
using System.Collections.Generic;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>Um item da listagem da Biblioteca. Traz o que o CARD mostra,
    /// e nada além: etapas e BNCC só vêm no detalhe.</summary>
    public class PlanoResumoDto
    {
        public Guid Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Autoria { get; set; } = string.Empty;
        public string ObjetosConhecimento { get; set; } = string.Empty;

        /// <summary>O componente que pinta o bloco do card. Pode vir nulo se
        /// alguém gravar um plano sem principal por fora da validação — a
        /// interface tem fallback neutro para esse caso.</summary>
        public ComponenteDto? ComponentePrincipal { get; set; }

        /// <summary>Os demais componentes, quando a prática é interdisciplinar.</summary>
        public List<ComponenteDto> ComponentesSecundarios { get; set; } = [];

        public List<SerieDto> Series { get; set; } = [];
        public List<MetodologiaDto> Metodologias { get; set; } = [];

        public int? DuracaoAulas { get; set; }
        public string? DuracaoDescricao { get; set; }
        public string ArquivoUrl { get; set; } = string.Empty;
        public DateTime? PublicadoEm { get; set; }

        /// <summary>
        /// `publicado` ou `rascunho`.
        ///
        /// Redundante na Biblioteca pública, onde tudo é publicado — e por
        /// isso o campo não existia. Mas a tela de administração usa o MESMO
        /// resumo e mostra os dois juntos: sem este campo ela recebia
        /// `undefined`, e como `undefined !== 'publicado'` marcava todo plano
        /// como rascunho. Um plano publicado aparecia como rascunho, e a
        /// remoção era recusada com uma mensagem que contradizia a etiqueta.
        /// </summary>
        public string Situacao { get; set; } = string.Empty;
    }

    /// <summary>A ficha completa: tudo do resumo, mais o roteiro e a BNCC.</summary>
    public class PlanoDetalheDto : PlanoResumoDto
    {
        public string Objetivo { get; set; } = string.Empty;
        public string ExpectativasAprendizagem { get; set; } = string.Empty;
        public string? Recursos { get; set; }
        public string? Modalidade { get; set; }
        public List<EtapaPlanoDto> Etapas { get; set; } = [];
        public List<string> CodigosBncc { get; set; } = [];
        public string? LinksExtras { get; set; }
    }

    public class EtapaPlanoDto
    {
        public int Ordem { get; set; }
        public string? Titulo { get; set; }
        public string Descricao { get; set; } = string.Empty;
    }

    /// <summary>O que o administrador envia ao catalogar.</summary>
    public class PlanoEntradaDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string Autoria { get; set; } = string.Empty;
        public string ObjetosConhecimento { get; set; } = string.Empty;
        public string Objetivo { get; set; } = string.Empty;
        public string ExpectativasAprendizagem { get; set; } = string.Empty;
        public string? Recursos { get; set; }
        public string? Modalidade { get; set; }
        public string? TurmaOrigem { get; set; }
        public int? DuracaoAulas { get; set; }
        public string? DuracaoDescricao { get; set; }

        /// <summary>A URL que o upload assinado devolveu. O arquivo já subiu
        /// direto para o R2 quando esta requisição chega.</summary>
        public string ArquivoUrl { get; set; } = string.Empty;
        public string? LinksExtras { get; set; }

        public Guid ComponentePrincipalId { get; set; }
        public List<Guid> ComponentesSecundariosIds { get; set; } = [];
        public List<Guid> SeriesIds { get; set; } = [];
        public List<Guid> MetodologiasIds { get; set; } = [];
        public List<EtapaPlanoDto> Etapas { get; set; } = [];
        public List<string> CodigosBncc { get; set; } = [];

        /// <summary>Quando falso, o plano fica em rascunho. Permite catalogar
        /// uma leva e publicar depois de conferir.</summary>
        public bool Publicar { get; set; }
    }
}
