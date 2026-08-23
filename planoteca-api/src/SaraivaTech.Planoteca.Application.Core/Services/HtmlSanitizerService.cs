using System;
using System.Linq;
using System.Text.RegularExpressions;
using AngleSharp.Dom;
using Ganss.Xss;
using SaraivaTech.Planoteca.Application.Services;

namespace SaraivaTech.Planoteca.Application.Core.Services
{
    /// <summary>
    /// A lista de permissão do corpo do blog, e só ela.
    ///
    /// Tudo fora daqui é REMOVIDO, não escapado: `AllowedTags`/
    /// `AllowedAttributes`/`AllowedSchemes` do `Ganss.Xss.HtmlSanitizer`
    /// funcionam como allowlist — a biblioteca já remove `&lt;script&gt;`,
    /// `on*` (`onerror`, `onclick`...) e `javascript:` por padrão, mas a
    /// configuração abaixo é explícita mesmo assim: um `AllowedTags` vazio
    /// bloquearia tudo, e um confiado só no padrão da lib envelheceria mal
    /// se uma versão futura mudasse o allowlist dela.
    /// </summary>
    public class HtmlSanitizerService : IHtmlSanitizerService
    {
        private static readonly Regex QuebraDeLinha = new(@"\r\n|\r|\n", RegexOptions.Compiled);

        private readonly HtmlSanitizer _sanitizer;

        public HtmlSanitizerService()
        {
            _sanitizer = new HtmlSanitizer
            {
                // Uma tag fora da allowlist (`div`, `span`, um colar de
                // outro site) some, mas o TEXTO de dentro sobrevive — só a
                // marcação não reconhecida é descartada. Sem isto, colar um
                // parágrafo envolto em `<div>` apagaria o parágrafo inteiro,
                // que é destruir conteúdo legítimo, não sanitizar.
                //
                // A ARMADILHA: com `KeepChildNodes = true`, o
                // `HtmlSanitizer` também preserva o TEXTO de dentro de
                // `<script>`/`<style>` — ele só remove a TAG, não o
                // conteúdo, para qualquer elemento fora da allowlist,
                // indiscriminadamente. `<script>alert(1)</script>`
                // sanitizaria para o texto solto `alert(1)`, inofensivo como
                // string, mas ainda assim lixo que não devia sobreviver.
                // `RemovingTag`, abaixo, intercepta os dois e cancela a
                // preservação de filhos só para eles.
                KeepChildNodes = true,
            };
            _sanitizer.RemovingTag += (_, args) =>
            {
                if (args.Tag.TagName.Equals("script", StringComparison.OrdinalIgnoreCase) ||
                    args.Tag.TagName.Equals("style", StringComparison.OrdinalIgnoreCase))
                {
                    args.Tag.InnerHtml = string.Empty;
                }
            };
            _sanitizer.AllowedTags.Clear();
            _sanitizer.AllowedTags.UnionWith(new[]
            {
                "p", "br", "strong", "em", "h2", "h3", "ul", "ol", "li", "a",
            });

            _sanitizer.AllowedAttributes.Clear();
            _sanitizer.AllowedAttributes.Add("href");

            _sanitizer.AllowedSchemes.Clear();
            _sanitizer.AllowedSchemes.Add("http");
            _sanitizer.AllowedSchemes.Add("https");

            // Nenhum atributo de estilo ou classe sobrevive — a lista de
            // permissão é só tag mais `href`, então CSS inline não tem para
            // onde ir.
            _sanitizer.AllowedCssProperties.Clear();
            _sanitizer.AllowedAtRules.Clear();

            // `rel`/`target` não vêm do editor nem do cliente — são
            // IMPOSTOS aqui, depois que o link já passou pela allowlist de
            // esquema. `javascript:` e outros esquemas fora de http/https já
            // caem antes de chegar neste evento, porque o sanitizer remove
            // o atributo `href` cujo esquema não está em `AllowedSchemes`.
            _sanitizer.PostProcessNode += (_, args) =>
            {
                if (args.Node is not IElement elemento) return;
                if (!elemento.TagName.Equals("a", StringComparison.OrdinalIgnoreCase)) return;
                if (!elemento.HasAttribute("href")) return;

                elemento.SetAttribute("rel", "noopener noreferrer nofollow");
                elemento.SetAttribute("target", "_blank");
            };
        }

        public string Sanitizar(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;

            return _sanitizer.Sanitize(PrepararConteudoLegado(html));
        }

        /// <summary>
        /// Conteúdo antigo é texto puro com `\n`/`\n\n`, não HTML — um post
        /// escrito antes do editor rico existir. Sem esta conversão, o
        /// sanitizador devolveria o texto inteiro como um único nó de texto
        /// solto (nenhuma tag para reconhecer), que o CSS novo do post
        /// (`[&_p]:mt-4`) não sabe separar em parágrafo: o relato viraria
        /// uma parede de texto.
        ///
        /// A heurística é simples e de propósito: se já existe uma tag da
        /// allowlist, o texto já é HTML do editor — não mexe. Só texto SEM
        /// nenhuma tag reconhecida ganha `\n\n` convertido em parágrafo.
        /// </summary>
        private static bool PrecisaConverter(string texto) =>
            !Regex.IsMatch(texto, @"<(p|br|strong|em|h2|h3|ul|ol|li|a)\b", RegexOptions.IgnoreCase);

        private static string PrepararConteudoLegado(string html)
        {
            if (!PrecisaConverter(html)) return html;

            var normalizado = QuebraDeLinha.Replace(html, "\n");
            var paragrafos = normalizado
                .Split("\n\n", StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => p.Length > 0)
                // Quebra de linha SIMPLES dentro do parágrafo (sem linha em
                // branco ao redor) vira `<br>` — a mesma preservação que
                // `whitespace-pre-line` fazia via CSS, agora em marcação.
                .Select(p => $"<p>{p.Replace("\n", "<br>")}</p>");

            return string.Join(string.Empty, paragrafos);
        }
    }
}
