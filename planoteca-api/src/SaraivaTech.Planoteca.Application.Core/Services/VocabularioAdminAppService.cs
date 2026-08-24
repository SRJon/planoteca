#nullable enable

using System;
using System.Linq;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;

namespace SaraivaTech.Planoteca.Application.Core.Services
{
    public class VocabularioAdminAppService : IVocabularioAdminAppService
    {
        private const int TamanhoMaximoNome = 80;

        private readonly IVocabularioRepository _repositorio;
        private readonly IUnitOfWork _uow;
        private readonly VocabularioMapper _mapper;

        public VocabularioAdminAppService(IVocabularioRepository repositorio, IUnitOfWork uow, VocabularioMapper mapper)
        {
            _repositorio = repositorio;
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<VocabularioDto> ObterTudoAsync() => new()
        {
            Componentes = _mapper.ParaDto(await _repositorio.ComponentesTodosAsync()),
            Series = _mapper.ParaDto(await _repositorio.SeriesTodasAsync()),
            Metodologias = _mapper.ParaDto(await _repositorio.MetodologiasTodasAsync()),
        };

        public async Task<Result<ComponenteDto>> CriarComponenteAsync(ComponenteEntradaDto entrada)
        {
            var erro = await ValidarComponenteAsync(entrada, exceto: null);
            if (erro is not null) return Result<ComponenteDto>.Failure(erro);

            var componente = new Componente
            {
                Nome = entrada.Nome.Trim(),
                Area = entrada.Area.Trim(),
                Sigla = entrada.Sigla.Trim(),
                Cor = entrada.Cor,
                Ordem = entrada.Ordem,
                Ativo = entrada.Ativo,
            };

            try
            {
                _uow.BeginTransaction();
                _repositorio.Insert(componente);
                _uow.Commit();
                return Result<ComponenteDto>.Success(_mapper.ParaDto(componente));
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> AlterarComponenteAsync(Guid id, ComponenteEntradaDto entrada)
        {
            var componente = await _repositorio.ComponentePorIdAsync(id);
            if (componente is null) return Result.Failure("Componente não encontrado.");

            var erro = await ValidarComponenteAsync(entrada, exceto: id);
            if (erro is not null) return Result.Failure(erro);

            componente.Nome = entrada.Nome.Trim();
            componente.Area = entrada.Area.Trim();
            componente.Sigla = entrada.Sigla.Trim();
            componente.Cor = entrada.Cor;
            componente.Ordem = entrada.Ordem;
            componente.Ativo = entrada.Ativo;

            try
            {
                _uow.BeginTransaction();
                // Sem `Update`: a entidade já está rastreada.
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result<SerieDto>> CriarSerieAsync(SerieEntradaDto entrada)
        {
            var erro = await ValidarSerieAsync(entrada, exceto: null);
            if (erro is not null) return Result<SerieDto>.Failure(erro);

            var serie = new Serie
            {
                Nome = entrada.Nome.Trim(),
                Etapa = entrada.Etapa,
                RotuloCompleto = entrada.RotuloCompleto.Trim(),
                Sigla = entrada.Sigla.Trim(),
                Ordem = entrada.Ordem,
                Ativa = entrada.Ativa,
            };

            try
            {
                _uow.BeginTransaction();
                _repositorio.Insert(serie);
                _uow.Commit();
                return Result<SerieDto>.Success(_mapper.ParaDto(serie));
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> AlterarSerieAsync(Guid id, SerieEntradaDto entrada)
        {
            var serie = await _repositorio.SeriePorIdAsync(id);
            if (serie is null) return Result.Failure("Série não encontrada.");

            var erro = await ValidarSerieAsync(entrada, exceto: id);
            if (erro is not null) return Result.Failure(erro);

            serie.Nome = entrada.Nome.Trim();
            serie.Etapa = entrada.Etapa;
            serie.RotuloCompleto = entrada.RotuloCompleto.Trim();
            serie.Sigla = entrada.Sigla.Trim();
            serie.Ordem = entrada.Ordem;
            serie.Ativa = entrada.Ativa;

            try
            {
                _uow.BeginTransaction();
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result<MetodologiaDto>> CriarMetodologiaAsync(MetodologiaEntradaDto entrada)
        {
            var erro = await ValidarMetodologiaAsync(entrada, exceto: null);
            if (erro is not null) return Result<MetodologiaDto>.Failure(erro);

            var metodologia = new Metodologia
            {
                Nome = entrada.Nome.Trim(),
                Tipo = entrada.Tipo,
                Ativa = entrada.Ativa,
            };

            try
            {
                _uow.BeginTransaction();
                _repositorio.Insert(metodologia);
                _uow.Commit();
                return Result<MetodologiaDto>.Success(_mapper.ParaDto(metodologia));
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> AlterarMetodologiaAsync(Guid id, MetodologiaEntradaDto entrada)
        {
            var metodologia = await _repositorio.MetodologiaPorIdAsync(id);
            if (metodologia is null) return Result.Failure("Metodologia não encontrada.");

            var erro = await ValidarMetodologiaAsync(entrada, exceto: id);
            if (erro is not null) return Result.Failure(erro);

            metodologia.Nome = entrada.Nome.Trim();
            metodologia.Tipo = entrada.Tipo;
            metodologia.Ativa = entrada.Ativa;

            try
            {
                _uow.BeginTransaction();
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        // As três validações seguem a mesma ordem de RF-10: nome antes de
        // qualquer regra específica do tipo, porque um nome vazio já
        // invalida a checagem de repetição que viria a seguir.

        private async Task<string?> ValidarComponenteAsync(ComponenteEntradaDto entrada, Guid? exceto)
        {
            var erroNome = ValidarNome(entrada.Nome);
            if (erroNome is not null) return erroNome;

            if (string.IsNullOrWhiteSpace(entrada.Area))
                return "A área é obrigatória.";

            if (entrada.Sigla?.Trim().Length != 2)
                return "A sigla tem duas letras.";

            if (!CorComponente.Todas.Contains(entrada.Cor))
                return "A cor precisa ser um token que o tema conhece.";

            if (entrada.Ordem < 1)
                return "A ordem começa em 1.";

            if (await _repositorio.ExisteComponenteComNomeAsync(entrada.Nome.Trim(), exceto))
                return "Já existe um item com este nome.";

            return null;
        }

        private async Task<string?> ValidarSerieAsync(SerieEntradaDto entrada, Guid? exceto)
        {
            var erroNome = ValidarNome(entrada.Nome);
            if (erroNome is not null) return erroNome;

            if (!EtapaEnsino.Todas.Contains(entrada.Etapa))
                return "A etapa é fundamental ou médio.";

            if (entrada.Ordem < 1)
                return "A ordem começa em 1.";

            if (await _repositorio.ExisteSerieComNomeAsync(entrada.Nome.Trim(), entrada.Etapa, exceto))
                return "Já existe um item com este nome.";

            return null;
        }

        private async Task<string?> ValidarMetodologiaAsync(MetodologiaEntradaDto entrada, Guid? exceto)
        {
            var erroNome = ValidarNome(entrada.Nome);
            if (erroNome is not null) return erroNome;

            if (!TipoMetodologia.Todos.Contains(entrada.Tipo))
                return "O tipo é metodologia, técnica ou ferramenta.";

            if (await _repositorio.ExisteMetodologiaComNomeAsync(entrada.Nome.Trim(), exceto))
                return "Já existe um item com este nome.";

            return null;
        }

        // Duas recusas, e nao uma: um nome de 90 caracteres nao esta
        // "faltando", e devolver a frase do vazio mandaria o administrador
        // procurar o campo que ele acabou de preencher.
        private static string? ValidarNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                return "O nome é obrigatório.";

            return nome.Trim().Length > TamanhoMaximoNome
                ? $"O nome passa de {TamanhoMaximoNome} caracteres."
                : null;
        }
    }
}
