using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Api.Policies
{
    public class AuthorizeAppRequirement : IAuthorizationRequirement
    {

        public AuthorizeAppRequirement(string token, string environment)
        {
            Token = token;

            Environment = environment;
        }

        public string Token { get; }
        public string Environment { get; }
    }
}

