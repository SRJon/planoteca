using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Api.Filters
{
    public interface IMemoryCacheWithPolicy<UserInfoDto> where UserInfoDto : class
    {
        Task<UserInfoDto?> GetOrCreateAsync(object key, Func<Task<UserInfoDto?>> createItem);
    }
}