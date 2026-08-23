using System;
using System.Collections.Generic;
using FluentValidation;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;

namespace SaraivaTech.Planoteca.Domain.Base
{
    public abstract class Service<TEntity> : IService<TEntity>
         where TEntity : class
    {
        protected Service(IUnitOfWork context, IRepository<TEntity> repository)
        {
            Repository = repository;
            Context = context;
        }

        protected IRepository<TEntity> Repository { get; }

        protected AbstractValidator<TEntity> Validator { get; set; }

        protected IUnitOfWork Context { get; set; }

        public virtual void Delete(TEntity obj)
        {
            if (Context.ValidateEntity)
                Validator.Validate(obj, options => options.ThrowOnFailures().IncludeRuleSets("Delete"));

            Repository.Delete(obj);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                Repository.Dispose();
            }
        }

        public virtual IEnumerable<TEntity> GetAll()
        {
            return Repository.GetAll();
        }

        public virtual TEntity GetById(Guid id)
        {
            return Repository.GetById(id);
        }

        public virtual TEntity Insert(TEntity obj)
        {
            if (Context.ValidateEntity)
                Validator.Validate(obj, options => options.ThrowOnFailures().IncludeRuleSets("Insert"));


            return Repository.Insert(obj);
        }

        public virtual TEntity Update(TEntity obj)
        {
            if (Context.ValidateEntity)
                Validator.Validate(obj, options => options.ThrowOnFailures().IncludeRuleSets("Update"));
            return Repository.Update(obj);
        }

        public virtual async System.Threading.Tasks.Task DeleteAsync(TEntity obj)
        {
            if (Context.ValidateEntity)
                await Validator.ValidateAsync(obj, options => options.ThrowOnFailures().IncludeRuleSets("Delete"));

            await Repository.DeleteAsync(obj);
        }

        public virtual async System.Threading.Tasks.Task<IEnumerable<TEntity>> GetAllAsync()
        {
            return await Repository.GetAllAsync();
        }

        public virtual async System.Threading.Tasks.Task<TEntity> GetByIdAsync(Guid id)
        {
            return await Repository.GetByIdAsync(id);
        }

        public virtual async System.Threading.Tasks.Task<TEntity> InsertAsync(TEntity obj)
        {
            if (Context.ValidateEntity)
                await Validator.ValidateAsync(obj, options => options.ThrowOnFailures().IncludeRuleSets("Insert"));

            return await Repository.InsertAsync(obj);
        }

        public virtual async System.Threading.Tasks.Task<TEntity> UpdateAsync(TEntity obj)
        {
            if (Context.ValidateEntity)
                await Validator.ValidateAsync(obj, options => options.ThrowOnFailures().IncludeRuleSets("Update"));
            return await Repository.UpdateAsync(obj);
        }
    }
}