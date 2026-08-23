using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Domain.Base.Interfaces
{
    public interface IRepository<TEntity> : IDisposable where TEntity : class
    {
        void Delete(Guid id);
        void Delete(TEntity obj);
        Task DeleteAsync(Guid id);
        Task DeleteAsync(TEntity obj);
        void DeleteRange(ICollection<TEntity> t);

        TEntity GetById(Guid id);
        Task<TEntity> GetByIdAsync(Guid id);

        TEntity Insert(TEntity obj);
        Task<TEntity> InsertAsync(TEntity obj);
        TEntity Update(TEntity obj);
        Task<TEntity> UpdateAsync(TEntity obj);

        IEnumerable<TEntity> GetAll();
        IQueryable<TEntity> GetAll(Expression<Func<TEntity, bool>> match, params string[] includeProperties);
        IQueryable<TEntity> GetAll(Expression<Func<TEntity, bool>> match, IFilterParameters parameters,
            string[] includeFilterFields, params string[] includeProperties);
        Task<IEnumerable<TEntity>> GetAllAsync();

        Task<TEntity> SingleOrDefaultAsync(Expression<Func<TEntity, bool>> match, params string[] includeProperties);
        IQueryable<TEntity> FilterAll(Expression<Func<TEntity, bool>> match, string filter,
            string[] includeFilterFields, params string[] includeProperties);
        IQueryable<TEntity> Set { get; }


    }
}