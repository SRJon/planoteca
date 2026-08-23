using System.Linq;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Application.Mappers
{
    /// <summary>
    /// Entidade de plano para DTO.
    ///
    /// Escrito à mão, e não gerado pelo Mapperly como os demais: a conversão
    /// não é campo a campo. Três coleções de LIGAÇÃO precisam ser achatadas
    /// (`PlanoComponente` → `ComponenteDto`), e o componente principal precisa
    /// ser SEPARADO dos secundários por uma regra de negócio — o card mostra
    /// um bloco de cor só. Um mapeador gerado esconderia essa decisão atrás de
    /// configuração.
    /// </summary>
    public class PlanoMapper
    {
        private readonly VocabularioMapper _vocabulario;

        public PlanoMapper(VocabularioMapper vocabulario)
        {
            _vocabulario = vocabulario;
        }

        public PlanoResumoDto ParaResumo(Plano p)
        {
            var dto = new PlanoResumoDto
            {
                Id = p.Id,
                Titulo = p.Titulo,
                Autoria = p.Autoria,
                ObjetosConhecimento = p.ObjetosConhecimento,
                DuracaoAulas = p.DuracaoAulas,
                DuracaoDescricao = p.DuracaoDescricao,
                ArquivoUrl = p.ArquivoUrl,
                PublicadoEm = p.PublicadoEm,
                Situacao = p.Situacao,
            };

            PreencherVocabulario(p, dto);
            return dto;
        }

        public PlanoDetalheDto ParaDetalhe(Plano p)
        {
            var dto = new PlanoDetalheDto
            {
                Id = p.Id,
                Titulo = p.Titulo,
                Autoria = p.Autoria,
                ObjetosConhecimento = p.ObjetosConhecimento,
                DuracaoAulas = p.DuracaoAulas,
                DuracaoDescricao = p.DuracaoDescricao,
                ArquivoUrl = p.ArquivoUrl,
                PublicadoEm = p.PublicadoEm,
                Objetivo = p.Objetivo,
                ExpectativasAprendizagem = p.ExpectativasAprendizagem,
                Recursos = p.Recursos,
                Modalidade = p.Modalidade,
                LinksExtras = p.LinksExtras,
                Etapas = p.Etapas
                    .OrderBy(e => e.Ordem)
                    .Select(e => new EtapaPlanoDto { Ordem = e.Ordem, Titulo = e.Titulo, Descricao = e.Descricao })
                    .ToList(),
                CodigosBncc = p.CodigosBncc.Select(b => b.Codigo).OrderBy(c => c).ToList(),
            };

            PreencherVocabulario(p, dto);
            return dto;
        }

        /// <summary>
        /// Achata as três ligações N:N.
        ///
        /// O `Componente` de dentro de `PlanoComponente` pode vir nulo quando a
        /// consulta não pediu `ThenInclude`. Filtrar aqui evita transformar um
        /// carregamento incompleto numa exceção lá na serialização, longe da
        /// causa.
        /// </summary>
        private void PreencherVocabulario(Plano p, PlanoResumoDto dto)
        {
            var principal = p.Componentes.FirstOrDefault(c => c.EPrincipal);
            if (principal?.Componente is not null)
                dto.ComponentePrincipal = _vocabulario.ParaDto(principal.Componente);

            dto.ComponentesSecundarios = p.Componentes
                .Where(c => !c.EPrincipal && c.Componente is not null)
                .Select(c => _vocabulario.ParaDto(c.Componente!))
                .OrderBy(c => c.Nome)
                .ToList();

            dto.Series = p.Series
                .Where(s => s.Serie is not null)
                .Select(s => _vocabulario.ParaDto(s.Serie!))
                // Por `Ordem`, e não por nome: "10º" viria antes de "9º" em
                // ordem alfabética, e o Médio se misturaria ao Fundamental.
                .OrderBy(s => s.Ordem)
                .ToList();

            dto.Metodologias = p.Metodologias
                .Where(m => m.Metodologia is not null)
                .Select(m => _vocabulario.ParaDto(m.Metodologia!))
                .OrderBy(m => m.Nome)
                .ToList();
        }
    }
}
