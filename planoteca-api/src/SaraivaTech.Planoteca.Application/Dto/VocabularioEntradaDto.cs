namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>O que o formulário de gestão envia para cadastrar ou alterar
    /// um componente. `Ativo` nasce `true`: o cadastro sempre entra visível
    /// na Biblioteca, e desativar é uma ação separada.</summary>
    public class ComponenteEntradaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public bool Ativo { get; set; } = true;
    }

    /// <summary>O que o formulário de gestão envia para cadastrar ou alterar
    /// uma série.</summary>
    public class SerieEntradaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Etapa { get; set; } = string.Empty;
        public string RotuloCompleto { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public bool Ativa { get; set; } = true;
    }

    /// <summary>O que o formulário de gestão envia para cadastrar ou alterar
    /// uma metodologia. `Fonte` fica de fora: só as 41 semeadas trazem
    /// `guia-ugb-2020`, e o cadastro manual não tem de onde herdar isso.</summary>
    public class MetodologiaEntradaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public bool Ativa { get; set; } = true;
    }
}
