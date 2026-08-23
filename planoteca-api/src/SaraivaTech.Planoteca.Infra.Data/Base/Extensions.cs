using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;

namespace SaraivaTech.Planoteca.Infra.Data.Base
{
    public static class Extensions
    {
        private static readonly char[] FilterClauseSeparator = { ':' };

        public static IQueryable<TType> ApplyFilter<TType>(
            this IQueryable<TType> source,
            string filter,
            string[] includeFilterFields)
        {
            ArgumentNullException.ThrowIfNull(source);

            if (string.IsNullOrWhiteSpace(filter))
            {
                return source;
            }

            var filterAfterSplit = filter.Split(',');
            foreach (var filterClause in filterAfterSplit.Reverse().Where(fc => !string.IsNullOrWhiteSpace(fc)))
            {
                var trimmedFilterClause = filterClause.Trim();
                var keyValue = trimmedFilterClause.Split(FilterClauseSeparator, StringSplitOptions.RemoveEmptyEntries);

                if (keyValue.Length != 3)
                {
                    throw new ValidationException($"Invalid filter expression '{keyValue[0]}'");
                }

                if (includeFilterFields.All(o => !string.Equals(o, keyValue[0], StringComparison.OrdinalIgnoreCase)))
                {
                    throw new ValidationException($"Key mapping for {keyValue[0]} is missing");
                }

                if (string.Equals(keyValue[1], "like", StringComparison.CurrentCultureIgnoreCase))
                {
                    source = source.Where($"it.{keyValue[0]}.Contains(@0)", keyValue[2]);
                    continue;
                }

                source = FilterByType(source, keyValue);
            }

            return source;
        }

        private static IQueryable<TType> FilterByType<TType>(IQueryable<TType> source, string[] keyValue)
        {
            if (int.TryParse(keyValue[2], out var intValue))
            {
                source = source.Where($"{keyValue[0]} {keyValue[1]} @0", intValue);
            }
            else if ((bool.TryParse(keyValue[2], out var boolValue)))
            {
                source = source.Where($"{keyValue[0]} {keyValue[1]} @0", boolValue);
            }
            else
            {
                source = source.Where($"{keyValue[0]} {keyValue[1]} @0", keyValue[2]);
            }

            return source;
        }

        public static IQueryable<TType> ApplyPagination<TType>(
            this IQueryable<TType> source, IFilterParameters parameters, out int total)
        {
            total = source.Count();

            if (total > parameters.per_page)
            {
                var skip = parameters.per_page * (parameters.page - 1);
                return source.Skip(skip).Take(parameters.per_page);
            }

            return source;
        }
    }
}
