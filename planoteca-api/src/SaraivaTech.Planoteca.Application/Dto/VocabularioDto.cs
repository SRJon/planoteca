using System;
using System.Collections.Generic;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>
    /// Todo o vocabulário numa resposta.
    ///
    /// A Biblioteca precisa das três listas para desenhar os filtros, e o
    /// formulário de catalogação precisa das três para montar os seletores.
    /// Três chamadas separadas renderiam três idas ao servidor para pintar uma
    /// tela — e no Render gratuito, que hiberna, a primeira dessas idas já é
    /// lenta o bastante.
    /// </summary>
    public class VocabularioDto
    {
        public List<ComponenteDto> Componentes { get; set; } = [];
        public List<SerieDto> Series { get; set; } = [];
        public List<MetodologiaDto> Metodologias { get; set; } = [];
    }

    public class ComponenteDto
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;

        /// <summary>Duas letras. É o que o bloco do card mostra.</summary>
        public string Sigla { get; set; } = string.Empty;

        /// <summary>O token de cor do tema — `comp-natureza` e afins. Vem do
        /// BANCO, e não de uma lista fechada no front: é a troca que permitiu
        /// Química, Física e Biologia entrarem sem alterar código.</summary>
        public string Cor { get; set; } = string.Empty;
    }

    public class SerieDto
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;

        /// <summary>"2ª série do Ensino Médio". O nome sozinho é ambíguo:
        /// "1ª série" existe no Fundamental e no Médio.</summary>
        public string RotuloCompleto { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public string Etapa { get; set; } = string.Empty;

        /// <summary>Ordem global 1..7. O front ordena por ela, sem regra de
        /// desempate própria.</summary>
        public int Ordem { get; set; }
    }

    public class MetodologiaDto
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;

        /// <summary>`metodologia`, `tecnica` ou `ferramenta`. O filtro agrupa
        /// por isto.</summary>
        public string Tipo { get; set; } = string.Empty;
    }
}
