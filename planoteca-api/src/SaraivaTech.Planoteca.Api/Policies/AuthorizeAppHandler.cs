using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Api.Policies
{
    public class AuthorizeAppHandler : AuthorizationHandler<AuthorizeAppRequirement>
    {
        private const string AuthorizeHeader = "Authorization";

        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthorizeAppHandler(IHttpContextAccessor httpContextAccessor)
        {
            this._httpContextAccessor = httpContextAccessor;

        }

        protected override Task HandleRequirementAsync(
          AuthorizationHandlerContext context,
          AuthorizeAppRequirement requirement)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            string? token = httpContext?.Request.Headers[AuthorizeHeader].ToString();

            if (token != null && token.Equals(requirement.Token))
                context.Succeed(requirement);
            else
                context.Fail();
            return Task.CompletedTask;
        }
    }
}
