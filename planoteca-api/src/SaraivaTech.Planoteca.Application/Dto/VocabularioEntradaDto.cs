namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>O que o formulário de gestão envia para cadastrar ou alterar
    /// um componente. `Ativo` nasce `true`: o cadastro sempre entra visível
    /// na Biblioteca, e desativar é uma ação separada.
    ///
    /// `Ordem` NÃO entra aqui. Ela é a posição dentro da área, e a API a
    /// calcula: o componente novo entra no fim da sua área. Um campo a menos
    /// num formulário que será preenchido dezenas de vezes.</summary>
    public class ComponenteEntradaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public bool Ativo { get; set; } = true;
    }

    /// <summary>O que o formulário de gestão envia para cadastrar ou alterar
    /// uma série.
    ///
    /// `Ordem` NÃO entra aqui, e neste caso a razão é forte: `serie.ordem` é
    /// UNIQUE no banco. Pedir o número a quem cadastra é pedir que ele
    /// adivinhe qual está livre, e punir o palpite errado com a exceção crua
    /// do EF Core. A API calcula: a série entra no fim da própria etapa, e as
    /// posteriores abrem espaço.</summary>
    public class SerieEntradaDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Etapa { get; set; } = string.Empty;
        public string RotuloCompleto { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
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
