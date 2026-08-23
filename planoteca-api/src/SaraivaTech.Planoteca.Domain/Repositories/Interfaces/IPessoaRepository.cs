using System;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Domain.Repositories.Interfaces
{
    public interface IPessoaRepository : IRepository<Pessoa>
    {
        /// <summary>Acha pelo identificador do Firebase — o caminho normal de
        /// quem já entrou alguma vez.</summary>
        Task<Pessoa?> PorFirebaseUidAsync(string firebaseUid);

        /// <summary>
        /// Acha pelo e-mail.
        ///
        /// Serve a dois casos: o primeiro login de alguém que já foi
        /// cadastrado por SQL (o administrador inicial), e a troca de
        /// provedor — quem entrou com e-mail/senha e depois usa o Google
        /// recebe um `uid` novo do Firebase, mas continua sendo a mesma
        /// pessoa.
        /// </summary>
        Task<Pessoa?> PorEmailAsync(string email);
    }
}
