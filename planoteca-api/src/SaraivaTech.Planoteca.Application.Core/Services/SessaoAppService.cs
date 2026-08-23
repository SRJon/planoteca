using System;
using System.Security.Claims;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;

namespace SaraivaTech.Planoteca.Application.Core.Services
{
    /// <summary>
    /// Liga a conta do Firebase à pessoa da Planoteca.
    ///
    /// ── A divisão de trabalho ────────────────────────────────────────────
    ///
    /// O **Firebase autentica**: ele prova que quem chegou é dono daquele
    /// e-mail, e emite um token assinado. A **Planoteca autoriza**: o papel
    /// (professor ou administrador) mora no nosso banco, e nunca no token.
    ///
    /// Misturar os dois seria dar ao Firebase o poder de decidir quem
    /// administra o acervo — e o console dele é um lugar onde alguém pode
    /// alterar um custom claim sem passar por nenhuma revisão.
    /// </summary>
    public class SessaoAppService : ISessaoAppService
    {
        private readonly IPessoaRepository _repositorio;
        private readonly IUnitOfWork _uow;

        public SessaoAppService(IPessoaRepository repositorio, IUnitOfWork uow)
        {
            _repositorio = repositorio;
            _uow = uow;
        }

        public async Task<Result<SessaoDto>> ResolverAsync(ClaimsPrincipal principal)
        {
            var uid = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? principal.FindFirst("user_id")?.Value
                      ?? principal.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(uid))
                return Result<SessaoDto>.Failure("O token não traz o identificador da conta.");

            var email = principal.FindFirst(ClaimTypes.Email)?.Value
                        ?? principal.FindFirst("email")?.Value;

            if (string.IsNullOrWhiteSpace(email))
            {
                // Sem e-mail não há como identificar a pessoa nem como um
                // administrador promovê-la depois. Acontece quando o provedor
                // do Firebase é anônimo ou telefone — nenhum dos dois é aceito
                // aqui.
                return Result<SessaoDto>.Failure(
                    "Esta conta não tem e-mail. Entre com uma conta Google ou com e-mail e senha.");
            }

            email = email.Trim().ToLowerInvariant();

            // O e-mail VERIFICADO é o que permite casar por e-mail sem risco.
            // Sem essa checagem, alguém criaria uma conta de e-mail/senha com
            // o endereço de um administrador e assumiria o cadastro dele.
            var verificado = principal.FindFirst("email_verified")?.Value;
            var emailVerificado = string.Equals(verificado, "true", StringComparison.OrdinalIgnoreCase);

            var nome = principal.FindFirst(ClaimTypes.Name)?.Value
                       ?? principal.FindFirst("name")?.Value
                       // Sem nome (comum no login por e-mail/senha), a parte
                       // antes do @ é melhor que "Usuário": a pessoa se
                       // reconhece, e pode corrigir depois.
                       ?? email.Split('@')[0];

            var pessoa = await _repositorio.PorFirebaseUidAsync(uid);
            var novo = false;

            if (pessoa is null)
            {
                // Nunca entrou com esta conta do Firebase. Duas possibilidades:
                // é a primeira vez no sistema, ou já existe um cadastro com
                // este e-mail — feito por SQL (o administrador inicial) ou por
                // outro provedor.
                var porEmail = emailVerificado ? await _repositorio.PorEmailAsync(email) : null;

                if (porEmail is not null)
                {
                    // Mesma pessoa, conta nova do Firebase. Vincula em vez de
                    // duplicar: o papel e o histórico dela são preservados.
                    porEmail.FirebaseUid = uid;
                    pessoa = porEmail;
                    _repositorio.Update(pessoa);
                }
                else
                {
                    pessoa = new Pessoa
                    {
                        FirebaseUid = uid,
                        Email = email,
                        Nome = nome,
                        // Todo mundo nasce PROFESSOR. O primeiro administrador
                        // é promovido por SQL — ver o `COMO-TESTAR.md`.
                        Papel = PapelPessoa.Professor,
                        Ativo = true,
                        CriadoEm = DateTime.UtcNow,
                    };
                    _repositorio.Insert(pessoa);
                    novo = true;
                }

                try
                {
                    _uow.BeginTransaction();
                    _uow.Commit();
                }
                catch
                {
                    _uow.Rollback();
                    throw;
                }
            }

            if (!pessoa.Ativo)
            {
                // Desativar é como se tira o acesso de alguém sem apagar o que
                // essa pessoa escreveu.
                return Result<SessaoDto>.Failure("ACESSO_SUSPENSO", "Este acesso está suspenso.");
            }

            return Result<SessaoDto>.Success(new SessaoDto
            {
                Id = pessoa.Id,
                Email = pessoa.Email,
                Nome = pessoa.Nome,
                Papel = pessoa.Papel,
                Ativo = pessoa.Ativo,
                Novo = novo,
            });
        }
    }
}
