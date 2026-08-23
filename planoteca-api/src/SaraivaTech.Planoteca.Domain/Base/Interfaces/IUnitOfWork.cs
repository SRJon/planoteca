using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System;
using System.Data;

namespace SaraivaTech.Planoteca.Domain.Base.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IDbConnection Connection { get; }
        Guid Id { get; }
        IDbTransaction Transaction { get; }
        
        DbContext Context { get; set; }

        bool ValidateEntity { get; set; }
        void BeginTransaction();
        Task BeginTransactionAsync();

        void Commit(bool dispose = true);
        Task CommitAsync(bool dispose = true);

        void Rollback(bool dispose = true);
        Task RollbackAsync(bool dispose = true);

    }
}
