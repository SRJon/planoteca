using FluentAssertions;
using SaraivaTech.Planoteca.Application.Core.Services;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// A lista de permissão do corpo do blog: `HtmlSanitizerService`.
    ///
    /// Este serviço roda nos dois sentidos — ao gravar (`PostAppService.
    /// EscreverAsync`) e ao ler (`PostAppService.ObterAsync`) — mas o
    /// comportamento de sanitizar é o MESMO nos dois pontos de chamada, e
    /// por isso é testado aqui isoladamente, sem precisar do banco.
    /// </summary>
    public class HtmlSanitizerServiceTest
    {
        private readonly HtmlSanitizerService _sut = new();

        [Fact]
        public void Remove_a_tag_script_e_seu_conteudo()
        {
            var resultado = _sut.Sanitizar("<p>Antes</p><script>alert(1)</script><p>Depois</p>");

            resultado.Should().NotContain("script");
            resultado.Should().NotContain("alert(1)");
            resultado.Should().Contain("Antes");
            resultado.Should().Contain("Depois");
        }

        [Fact]
        public void Remove_href_com_esquema_javascript()
        {
            var resultado = _sut.Sanitizar("<a href=\"javascript:alert(1)\">clique</a>");

            resultado.Should().NotContain("javascript:");
        }

        [Fact]
        public void Remove_tag_img_com_onerror()
        {
            var resultado = _sut.Sanitizar("<p>Texto</p><img src=x onerror=\"alert(1)\">");

            resultado.Should().NotContain("<img");
            resultado.Should().NotContain("onerror");
        }

        [Fact]
        public void Remove_onclick_de_uma_tag_permitida()
        {
            var resultado = _sut.Sanitizar("<p onclick=\"alert(1)\">Texto</p>");

            resultado.Should().NotContain("onclick");
            resultado.Should().Contain("<p>Texto</p>");
        }

        [Fact]
        public void Mantem_negrito_titulo_e_lista()
        {
            var resultado = _sut.Sanitizar(
                "<p><strong>negrito</strong></p><h2>Título</h2><ul><li>item</li></ul>");

            resultado.Should().Contain("<strong>negrito</strong>");
            resultado.Should().Contain("<h2>Título</h2>");
            resultado.Should().Contain("<ul>");
            resultado.Should().Contain("<li>item</li>");
        }

        [Fact]
        public void Link_legitimo_ganha_rel_e_target_blank()
        {
            var resultado = _sut.Sanitizar("<a href=\"https://exemplo.org\">link</a>");

            resultado.Should().Contain("href=\"https://exemplo.org\"");
            resultado.Should().Contain("rel=\"noopener noreferrer nofollow\"");
            resultado.Should().Contain("target=\"_blank\"");
        }

        [Fact]
        public void Remove_atributo_style_e_class_fora_da_lista_de_permissao()
        {
            var resultado = _sut.Sanitizar("<p class=\"x\" style=\"color:red\">Texto</p>");

            resultado.Should().NotContain("style=");
            resultado.Should().NotContain("class=");
        }

        [Fact]
        public void Remove_tag_fora_da_lista_mas_preserva_o_texto_dela()
        {
            // `div`, `span`, `iframe` etc. não estão na allowlist — a tag
            // some, mas o texto de dentro sobrevive (comportamento padrão
            // do HtmlSanitizer para tag não reconhecida sem ser bloco de
            // script/style).
            var resultado = _sut.Sanitizar("<div><p>Dentro de uma div</p></div>");

            resultado.Should().NotContain("<div>");
            resultado.Should().Contain("<p>Dentro de uma div</p>");
        }

        [Fact]
        public void Converte_texto_puro_legado_em_paragrafos()
        {
            var resultado = _sut.Sanitizar("Primeiro parágrafo.\n\nSegundo parágrafo.");

            resultado.Should().Be("<p>Primeiro parágrafo.</p><p>Segundo parágrafo.</p>");
        }

        [Fact]
        public void Nao_reconverte_html_que_ja_tem_tag_da_allowlist()
        {
            var resultado = _sut.Sanitizar("<p>Já é HTML</p>\n\n<p>Segundo parágrafo</p>");

            // A heurística de conversão de texto puro não entra em ação — o
            // `\n\n` entre as duas tags sobrevive como espaço em branco
            // comum (o navegador o colapsa), e não vira um parágrafo extra.
            resultado.Should().Contain("<p>Já é HTML</p>").And.Contain("<p>Segundo parágrafo</p>");
            resultado.Should().NotContain("<p></p>");
        }

        [Fact]
        public void Corpo_vazio_ou_so_espaco_sanitiza_para_string_vazia()
        {
            _sut.Sanitizar("").Should().BeEmpty();
            _sut.Sanitizar("   ").Should().BeEmpty();
        }
    }
}
