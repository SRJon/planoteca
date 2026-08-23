using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Api.Filters;
using SaraivaTech.Planoteca.Application.Dto;
using System.Text.Json;

namespace SaraivaTech.Planoteca.Api.Policies
{
    public class BasicAuthenticationOptions : AuthenticationSchemeOptions
    {
        public string UserinfoEndpoint { get; set; } = string.Empty;
    }
    public class CustomAuthenticationHandler : AuthenticationHandler<BasicAuthenticationOptions>
    {
        private readonly IMemoryCacheWithPolicy<UserInfoDto> _cache;

        public CustomAuthenticationHandler(
            IOptionsMonitor<BasicAuthenticationOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            IMemoryCacheWithPolicy<UserInfoDto> cache)
            : base(options, logger, encoder)
        {
            _cache = cache;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {


            if (!Request.Headers.TryGetValue("Authorization", out var authorizationHeaderValues))
                return AuthenticateResult.Fail("Unauthorized");

            string authorizationHeader = authorizationHeaderValues.ToString();
            if (string.IsNullOrEmpty(authorizationHeader))
            {
                return AuthenticateResult.NoResult();
            }


            if (!authorizationHeader.StartsWith("bearer", StringComparison.OrdinalIgnoreCase))
            {
                return AuthenticateResult.Fail("Unauthorized");
            }

            string token = authorizationHeader.Substring("bearer".Length).Trim();

            if (string.IsNullOrEmpty(token) || token.Length < 10)
            {
                return AuthenticateResult.Fail("Unauthorized");
            }

            try
            {
                return await validateTokenAsync(token);
            }
            catch (Exception ex)
            {
                return AuthenticateResult.Fail(ex.Message);
            }
        }

        private async Task<AuthenticateResult> validateTokenAsync(string token)
        {
            byte[] shaDigest = SHA256.HashData(Encoding.ASCII.GetBytes(token));
            var hash = BitConverter.ToString(shaDigest);

            var result = await _cache.GetOrCreateAsync(hash, () => requestValidation(token));

            if (result == null)
            {
                return AuthenticateResult.NoResult();
            }

            var claims = new List<Claim>()
                {
                    new Claim(ClaimTypes.Name, result.cn),
                    // new Claim("groupMembership", JsonConvert.SerializeObject(result.groupMembership)),
                    new Claim(ClaimTypes.NameIdentifier, result.cn ),
                    new Claim(ClaimTypes.GivenName, result.UserFullName ),
                    //new Claim(ClaimTypes.Email, result.mail),
                    //new Claim(ClaimTypes.Country, result.locationCountry),
                };

            var identity = new ClaimsIdentity(claims, ClaimTypes.Name);
            var principal = new System.Security.Principal.GenericPrincipal(identity, null);
            var ticket = new AuthenticationTicket(principal, ClaimTypes.Name);




            return AuthenticateResult.Success(ticket);
        }

        private async Task<UserInfoDto?> requestValidation(string token)
        {
            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var response = await client.GetAsync(this.Options.UserinfoEndpoint);

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var responseString = await response.Content.ReadAsStringAsync();

                return JsonSerializer.Deserialize<UserInfoDto>(responseString);
            }
        }
    }
}