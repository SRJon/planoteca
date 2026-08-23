using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;

namespace SaraivaTech.Planoteca.Test.Integracao
{
    /// <summary>
    /// Uma `IUnitOfWork` que grava de verdade, mas sem transação própria e
    /// sem descartar o contexto.
    ///
    /// `UoWFalso` (o outro substituto desta pasta) lança em `BeginTransaction`
    /// e `Commit` de propósito, porque os testes que o usam gravam com
    /// `Contexto.SaveChangesAsync()` direto, contornando o AppService.
    ///
    /// Aqui o alvo é diferente: os testes de `AdminPessoasController`
    /// exercitam o `PessoaAdminAppService` de ponta a ponta — inclusive as
    /// guardas que vivem SÓ nele (auto-rebaixamento, último administrador) —
    /// então `Commit` precisa persistir de verdade. E não pode chamar
    /// `Dispose()`: o `UnitOfWork` real descarta o `DbContext` no fim do
    /// commit por padrão, o que devastaria o `Contexto` compartilhado que
    /// `BaseBancoReal` usa (e dispõe de novo) no resto do teste.
    /// </summary>
    internal sealed class UoWDeTeste : IUnitOfWork
    {
        public UoWDeTeste(DbContext contexto)
        {
            Context = contexto;
            Id = Guid.NewGuid();
        }

        public DbContext Context { get; set; }
        public Guid Id { get; }
        public bool ValidateEntity { get; set; }
        public IDbConnection Connection => null!;
        public IDbTransaction Transaction => null!;

        public void BeginTransaction() { }
        public Task BeginTransactionAsync() => Task.CompletedTask;

        public void Commit(bool dispose = true) => Context.SaveChanges();
        public Task CommitAsync(bool dispose = true) => Context.SaveChangesAsync();

        public void Rollback(bool dispose = true) => Context.ChangeTracker.Clear();
        public Task RollbackAsync(bool dispose = true)
        {
            Context.ChangeTracker.Clear();
            return Task.CompletedTask;
        }

        public void Dispose() { }
    }
}
