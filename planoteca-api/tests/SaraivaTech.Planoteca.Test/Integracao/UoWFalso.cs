using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;

namespace SaraivaTech.Planoteca.Test.Integracao
{
    /// <summary>
    /// Uma `IUnitOfWork` que só carrega o contexto.
    ///
    /// O `Repository&lt;T&gt;` pede `IUnitOfWork` no construtor, mas destes
    /// testes só interessa o `Context` — a transação e a conexão Dapper não
    /// são usadas por nenhuma consulta do `PlanoRepository`, que é LINQ puro.
    /// Um substituto do NSubstitute funcionaria; esta classe diz mais
    /// claramente o que está e o que não está em jogo.
    ///
    /// `Commit` e `Rollback` são deliberadamente inertes: cada teste grava com
    /// `Contexto.SaveChangesAsync()` direto e limpa o que criou. Se algum dia
    /// um teste depender de transação de verdade, este substituto vai mentir
    /// em silêncio — daí os lançamentos abaixo.
    /// </summary>
    internal sealed class UoWFalso : IUnitOfWork
    {
        public UoWFalso(DbContext contexto)
        {
            Context = contexto;
            Id = Guid.NewGuid();
        }

        public DbContext Context { get; set; }
        public Guid Id { get; }
        public bool ValidateEntity { get; set; }

        /// <summary>
        /// `null`, e não uma exceção: o `Repository&lt;T&gt;` base LÊ esta
        /// propriedade dentro do próprio construtor, então lançar aqui
        /// impediria até de instanciar o repositório. Nenhuma consulta do
        /// `PlanoRepository` usa Dapper — se um dia usar, o `NullReference`
        /// aponta para cá.
        /// </summary>
        public IDbConnection Connection => null!;

        public IDbTransaction Transaction =>
            throw new NotSupportedException("Estes testes gravam sem transação própria.");

        public void BeginTransaction() => throw new NotSupportedException();
        public Task BeginTransactionAsync() => throw new NotSupportedException();
        public void Commit(bool dispose = true) => throw new NotSupportedException();
        public Task CommitAsync(bool dispose = true) => throw new NotSupportedException();
        public void Rollback(bool dispose = true) => throw new NotSupportedException();
        public Task RollbackAsync(bool dispose = true) => throw new NotSupportedException();

        public void Dispose() { }
    }
}
