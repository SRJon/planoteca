using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace SaraivaTech.Planoteca.Domain.Base
{
    [ExcludeFromCodeCoverage]
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; }
        public int Total { get; set; }

        public PagedResult(IEnumerable<T> items, int total)
        {
            Items = items;
            Total = total;
        }
    }
}
