using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using System;
using System.Data;
using System.Data.Common;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;

namespace SaraivaTech.Planoteca.Infra.Data.UoW
{
    public sealed class UnitOfWork : IUnitOfWork
    {
        public IDbConnection Connection { get; set; }
        public DbContext Context { get; set; }
        public Guid Id { get; set; }

        public IDbTransaction Transaction { get; set; }
        
        public bool ValidateEntity { get; set; }

        public UnitOfWork(IDbConnection connection, DbContext context)
        {
            this.Context = context;
            this.ValidateEntity = true;
        }
        public void BeginTransaction()
        {
            var transactionContext = this.Context.Database.BeginTransaction();
            Transaction = (transactionContext as IInfrastructure<DbTransaction>).Instance;
        }

        public async Task BeginTransactionAsync()
        {
            var transactionContext = await this.Context.Database.BeginTransactionAsync();
            Transaction = (transactionContext as IInfrastructure<DbTransaction>).Instance;
        }


        public void Commit(bool dispose = true)
        {
            this.Context.SaveChanges();

            if (Transaction != null)
            {
                Transaction.Commit();
            }

            if (dispose)
            {
                Dispose();
            }

        }

        public async Task CommitAsync(bool dispose = true)
        {
            await this.Context.SaveChangesAsync();

            if (Transaction != null)
            {
                await ((DbTransaction)Transaction).CommitAsync();
            }

            if (dispose)
            {
                Dispose();
            }
        }


        public void Dispose()
        {
            if (Connection != null)
            {
                if (Connection.State == ConnectionState.Open)
                    Connection.Close();

                Connection?.Dispose();
                Connection = null;
            }

            if (Transaction != null)
            {
                Transaction?.Dispose();

                Transaction = null;
            }

            if (Context != null)
            {
                Context?.Dispose();

                Context = null;
            }
        }

        public void Open()
        {
            if(this.Connection == null)
            {
                this.Context.Database.OpenConnection();
                this.Connection = this.Context.Database.GetDbConnection();
            }
        }

        public void Rollback(bool dispose = true)
        {
            Transaction.Rollback();


            if (dispose)
            {
                Dispose();
            }
        }

        public async Task RollbackAsync(bool dispose = true)
        {
            if (Transaction != null)
            {
                await ((DbTransaction)Transaction).RollbackAsync();
            }

            if (dispose)
            {
                Dispose();
            }
        }


    }
}