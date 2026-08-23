using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.Data.Base;

namespace SaraivaTech.Planoteca.Infra.Data.Repositories
{
    public class PessoaRepository : Repository<Pessoa>, IPessoaRepository
    {
        public PessoaRepository(IUnitOfWork uow) : base(uow) { }

        public async Task<Pessoa?> PorFirebaseUidAsync(string firebaseUid) =>
            await Context.Set<Pessoa>().FirstOrDefaultAsync(p => p.FirebaseUid == firebaseUid);

        /// <summary>
        /// O e-mail é comparado em minúsculas dos dois lados.
        ///
        /// `EmailUsuario@escola.br` e `emailusuario@escola.br` são a mesma
        /// caixa postal, e o Firebase devolve o que a pessoa digitou. Sem
        /// normalizar, o mesmo professor viraria dois cadastros.
        /// </summary>
        public async Task<Pessoa?> PorEmailAsync(string email) =>
            await Context.Set<Pessoa>()
                .FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());
    }
}
