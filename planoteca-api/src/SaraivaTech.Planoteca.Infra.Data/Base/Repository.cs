using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Dapper.Contrib.Extensions;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using System.Linq.Dynamic.Core;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Infra.Data.Context;

namespace SaraivaTech.Planoteca.Infra.Data.Base
{
    public abstract class Repository<TEntity> : IRepository<TEntity> where TEntity : Entity
    {

        public IDbConnection Connection { get; set; }
        protected IUnitOfWork Uow { get; set; }
        protected DatabaseContext Context => (DatabaseContext)Uow.Context;

        protected Repository(IUnitOfWork uow)
        {
            this.Uow = uow;
            Connection = uow.Connection;
        }


        public virtual void Delete(Guid id)
        {
            var obj = Activator.CreateInstance<TEntity>();
            obj.Id = id;
            this.Context.Set<TEntity>().Remove(obj);
        }
        public virtual void Delete(TEntity obj)
        {
            this.Context.Set<TEntity>().Remove(obj);
        }
        public virtual async Task DeleteAsync(Guid id)
        {
            var obj = Activator.CreateInstance<TEntity>();
            obj.Id = id;
            this.Context.Set<TEntity>().Remove(obj);
        }
        public virtual async Task DeleteAsync(TEntity obj)
        {
            this.Context.Set<TEntity>().Remove(obj);
        }
        public virtual void DeleteRange(ICollection<TEntity> t)
        {
            this.Context.Set<TEntity>().RemoveRange(t);
        }

        public virtual async Task DeleteRangeAsync(ICollection<TEntity> t)
        {
            this.Context.Set<TEntity>().RemoveRange(t);
        }

        public virtual TEntity GetById(Guid id)
        {
            return this.Context.Set<TEntity>().FirstOrDefault(o => o.Id == id);
        }
        public virtual async Task<TEntity> GetByIdAsync(Guid id)
        {
            return await this.Context.Set<TEntity>().FirstOrDefaultAsync(o => o.Id == id);
        }

        public virtual TEntity Insert(TEntity obj)
        {
            this.Context.Set<TEntity>().Add(obj);
            return obj;
        }
        public virtual async Task<TEntity> InsertAsync(TEntity obj)
        {
            this.Context.Set<TEntity>().Add(obj);
            return obj;
        }

        public virtual TEntity Update(TEntity obj)
        {
            this.Context.Set<TEntity>().Update(obj);
            return obj;
        }

        public virtual async Task<TEntity> UpdateAsync(TEntity obj)
        {
            this.Context.Set<TEntity>().Update(obj);
            return obj;
        }

        public virtual IEnumerable<TEntity> GetAll()
        {
            return Set.ToList();
        }

        public virtual IQueryable<TEntity> GetAll(Expression<Func<TEntity, bool>> match, params string[] includeProperties)
        {
            var result = this.Uow.Context.Set<TEntity>().AsQueryable();

            if (includeProperties != null)
            {
                result = includeProperties.Aggregate(result, (current, property) => current.Include(property));
            }

            return result.Where(match);
        }
        public virtual IQueryable<TEntity> GetAll(Expression<Func<TEntity, bool>> match, IFilterParameters parameters, string[] includeFilterFields, params string[] includeProperties)
        {
            var result = this.Uow.Context.Set<TEntity>().Where(match);
            if (includeProperties != null)
            {
                result = includeProperties.Aggregate(result, (current, property) => current.Include(property));
            }

            if (!string.IsNullOrWhiteSpace(parameters.filter))
            {
                result = result.ApplyFilter(parameters.filter, includeFilterFields);
            }

            if (!string.IsNullOrWhiteSpace(parameters.sort))
            {
                result = result.OrderBy(parameters.sort);
            }

            return result;
        }

        public virtual async Task<IEnumerable<TEntity>> GetAllAsync()
        {
            return await Set.ToListAsync();
        }

        public virtual async Task<TEntity> SingleOrDefaultAsync(Expression<Func<TEntity, bool>> match, params string[] includeProperties)
        {
            var result = this.Uow.Context.Set<TEntity>().AsQueryable();
            if (includeProperties != null)
            {
                result = includeProperties.Aggregate(result, (current, property) => current.Include(property));
            }

            return await result.SingleOrDefaultAsync(match);
        }

        public virtual IQueryable<TEntity> FilterAll(Expression<Func<TEntity, bool>> match, string filter, string[] includeFilterFields, params string[] includeProperties)
        {
            var result = this.Uow.Context.Set<TEntity>().AsQueryable();
            result = includeProperties.Aggregate(result, (current, property) => current.Include(property));

            if (!string.IsNullOrWhiteSpace(filter))
            {
                result = result.ApplyFilter(filter, includeFilterFields);
            }

            return result.Where(match);
        }

        public virtual IQueryable<TEntity> Set => this.Uow.Context.Set<TEntity>();

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
        }
    }
}