using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Domain.Base.Interfaces
{
    public interface IService<TEntity> : IDisposable where TEntity : class
    {
        void Delete(TEntity obj);
        Task DeleteAsync(TEntity obj);

        IEnumerable<TEntity> GetAll();
        Task<IEnumerable<TEntity>> GetAllAsync();

        TEntity GetById(Guid id);
        Task<TEntity> GetByIdAsync(Guid id);

        TEntity Insert(TEntity obj);
        Task<TEntity> InsertAsync(TEntity obj);

        TEntity Update(TEntity obj);
        Task<TEntity> UpdateAsync(TEntity obj);
    }
}