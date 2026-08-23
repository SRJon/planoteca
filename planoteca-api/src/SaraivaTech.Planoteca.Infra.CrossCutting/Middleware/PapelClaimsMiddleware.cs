using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SaraivaTech.Planoteca.Application.Services;

namespace SaraivaTech.Planoteca.Infra.CrossCutting.Middleware
{
    /// <summary>
    /// Acrescenta ao principal os claims que vêm do NOSSO banco: o papel e o
    /// id da pessoa.
    ///
    /// ── Por que isto existe ──────────────────────────────────────────────
    ///
    /// O token do Firebase prova quem é a pessoa, e nada além. Ele não sabe —
    /// nem deveria saber — quem administra o acervo da Planoteca. Mas o
    /// `[Authorize(Policy = "Administrador")]` do ASP.NET decide olhando o
    /// principal, não o banco.
    ///
    /// Este middleware faz a ponte: depois da autenticação, resolve a pessoa
    /// e injeta `papel` e `pessoaId` como claims. A partir daí a política
    /// funciona, e um controller pode ler o autor da requisição sem receber
    /// um id no corpo — que é como as rotas de blog funcionavam enquanto o
    /// login não existia, e era inseguro.
    ///
    /// ── Custo, e por que é aceitável ─────────────────────────────────────
    ///
    /// Uma consulta por requisição autenticada. Alternativas — custom claim
    /// no Firebase, cache em memória — trocariam essa consulta por um dado
    /// que pode ficar velho: promover alguém a administrador só teria efeito
    /// no próximo token, ou depois do cache expirar. Numa aplicação com
    /// dezenas de usuários, a consulta é mais barata que a confusão.
    ///
    /// Requisição anônima não paga nada: o middleware sai na primeira linha.
    /// </summary>
    public class PapelClaimsMiddleware : IMiddleware
    {
        private readonly ISessaoAppService _sessao;

        public PapelClaimsMiddleware(ISessaoAppService sessao)
        {
            _sessao = sessao;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var autenticado = context.User.Identity?.IsAuthenticated == true;

            // A Biblioteca inteira é anônima. Nenhuma consulta para ela.
            if (!autenticado)
            {
                await next(context);
                return;
            }

            // Já resolvido nesta requisição — defesa contra o middleware ser
            // registrado duas vezes no pipeline.
            if (context.User.HasClaim(c => c.Type == "papel"))
            {
                await next(context);
                return;
            }

            var resultado = await _sessao.ResolverAsync(context.User);

            if (!resultado.IsSuccess)
            {
                // Acesso suspenso, ou token sem e-mail. 403, e não 401: o
                // token é válido — o que falta é permissão, e mandar a pessoa
                // fazer login de novo não resolveria nada.
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    $"{{\"status\":403,\"messages\":[\"{resultado.Error!.Message}\"]}}");
                return;
            }

            var pessoa = resultado.Value!;
            var identidade = new ClaimsIdentity(
            [
                new Claim("papel", pessoa.Papel),
                new Claim("pessoaId", pessoa.Id.ToString()),
            ]);
            context.User.AddIdentity(identidade);

            await next(context);
        }
    }

    /// <summary>Lê os claims que este middleware injetou.</summary>
    public static class PrincipalExtensions
    {
        /// <summary>O id da pessoa na Planoteca. `null` em requisição anônima.</summary>
        public static System.Guid? PessoaId(this ClaimsPrincipal principal)
        {
            var valor = principal.FindFirst("pessoaId")?.Value;
            return System.Guid.TryParse(valor, out var id) ? id : null;
        }

        public static bool EhAdministrador(this ClaimsPrincipal principal) =>
            principal.HasClaim("papel", Domain.Enumerable.PapelPessoa.Administrador);
    }
}
