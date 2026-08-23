using System.Security.Claims;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Application.Services
{
    public interface ISessaoAppService
    {
        /// <summary>
        /// Resolve o token do Firebase na pessoa da Planoteca, criando o
        /// cadastro no primeiro acesso.
        /// </summary>
        Task<Result<SessaoDto>> ResolverAsync(ClaimsPrincipal principal);
    }
}
