namespace SaraivaTech.Planoteca.Application.Services
{
    /// <summary>
    /// Sanitiza o HTML do corpo de um texto do blog.
    ///
    /// Chamado nos DOIS sentidos: ao GRAVAR (quem escreve pode chamar a API
    /// direto, sem passar pelo editor — confiar no cliente não é sanitizar)
    /// e ao LER (um texto gravado antes desta sanitização existir, ou
    /// inserido direto no banco, não pode chegar ao navegador sem passar
    /// pelo filtro só porque já está na tabela).
    /// </summary>
    public interface IHtmlSanitizerService
    {
        /// <summary>Aplica a lista de permissão estrita do blog e devolve o
        /// HTML seguro para gravar ou para servir.</summary>
        string Sanitizar(string html);
    }
}
