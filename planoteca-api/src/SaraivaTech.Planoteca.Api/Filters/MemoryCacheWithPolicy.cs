using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Api.Filters
{
    public class MemoryCacheWithPolicy<UserInfoDto> : IMemoryCacheWithPolicy<UserInfoDto> where UserInfoDto : class
    {
        private IMemoryCache _cache { get; set; }

        public MemoryCacheWithPolicy(IMemoryCache cache)
        {
            _cache = cache;
        }

        public async Task<UserInfoDto?> GetOrCreateAsync(object key, Func<Task<UserInfoDto?>> createItem)
        {
            if (_cache.TryGetValue(key, out UserInfoDto? cacheEntry))
            {
                return cacheEntry;
            }

            var newEntry = await createItem();
            if (newEntry == null)
            {
                return default;
            }

            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetSize(1)
                .SetPriority(CacheItemPriority.High)
                .SetSlidingExpiration(TimeSpan.FromMinutes(5))
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(60));

            _cache.Set(key, newEntry, cacheEntryOptions);
            return newEntry;
        }
    }
}
