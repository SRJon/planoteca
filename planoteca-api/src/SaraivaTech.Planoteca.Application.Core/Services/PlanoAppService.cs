using System;
using System.Collections.Generic;
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
using SaraivaTech.Planoteca.Domain.Services;

namespace SaraivaTech.Planoteca.Application.Core.Services
{
    public class PlanoAppService : IPlanoAppService
    {
        private readonly IPlanoRepository _repositorio;
        private readonly PlanoMapper _mapper;
        private readonly IUnitOfWork _uow;
        private readonly IArmazenamentoArquivo _armazenamento;

        /// <summary>Os tipos que a catalogação aceita. Lista fechada: o
        /// `Content-Type` entra na assinatura da URL, então aceitar qualquer
        /// coisa aqui é aceitar qualquer coisa no bucket.</summary>
        private static readonly string[] TiposAceitos = ["application/pdf"];

        public PlanoAppService(
            IPlanoRepository repositorio,
            PlanoMapper mapper,
            IUnitOfWork uow,
            IArmazenamentoArquivo armazenamento)
        {
            _repositorio = repositorio;
            _mapper = mapper;
            _uow = uow;
            _armazenamento = armazenamento;
        }

        public async Task<(IEnumerable<PlanoResumoDto> Itens, int Total)> ListarAsync(FiltroPlano filtro)
        {
            var (itens, total) = await _repositorio.BuscarAsync(filtro);
            return (itens.Select(_mapper.ParaResumo).ToList(), total);
        }

        public async Task<PlanoDetalheDto?> ObterAsync(Guid id, bool incluirRascunho = false)
        {
            var plano = await _repositorio.ObterCompletoAsync(id, incluirRascunho);
            return plano is null ? null : _mapper.ParaDetalhe(plano);
        }

        public async Task<Result<UploadAssinado>> AssinarUploadAsync(string nomeArquivo, string tipoConteudo)
        {
            if (string.IsNullOrWhiteSpace(nomeArquivo))
                return Result<UploadAssinado>.Failure("O nome do arquivo é obrigatório.");

            if (!TiposAceitos.Contains(tipoConteudo))
                return Result<UploadAssinado>.Failure(
                    $"Tipo de arquivo não aceito: {tipoConteudo}. O acervo recebe PDF.");

            try
            {
                return Result<UploadAssinado>.Success(
                    await _armazenamento.AssinarUploadAsync(nomeArquivo, tipoConteudo));
            }
            catch (InvalidOperationException erro)
            {
                // O armazenamento não está configurado. A mensagem já diz o
                // que falta — devolver como falha de negócio evita um 500 que
                // não ajuda ninguém a resolver.
                return Result<UploadAssinado>.Failure("ARMAZENAMENTO_AUSENTE", erro.Message);
            }
        }

        public async Task<Result> AlterarSituacaoAsync(Guid id, bool publicar)
        {
            var plano = await _repositorio.ObterCompletoAsync(id, incluirRascunho: true);
            if (plano is null) return Result.Failure("Plano não encontrado.");

            var agora = DateTime.UtcNow;
            plano.Situacao = publicar ? SituacaoPlano.Publicado : SituacaoPlano.Rascunho;
            plano.AtualizadoEm = agora;

            // `PublicadoEm` é gravado na PRIMEIRA publicação e nunca limpo:
            // despublicar para corrigir e publicar de novo não deveria fazer
            // o plano saltar para o topo da Biblioteca como se fosse novo.
            if (publicar && plano.PublicadoEm is null) plano.PublicadoEm = agora;

            try
            {
                _uow.BeginTransaction();
                _repositorio.Update(plano);
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> RemoverAsync(Guid id)
        {
            var plano = await _repositorio.ObterCompletoAsync(id, incluirRascunho: true);
            if (plano is null) return Result.Failure("Plano não encontrado.");

            // Um plano publicado já circulou: professores mandaram o link uns
            // para os outros, e apagá-lo quebraria esses links em silêncio.
            // Para tirar do ar, despublique.
            if (plano.Situacao == SituacaoPlano.Publicado)
            {
                return Result.Failure(
                    "Este plano está publicado e pode ter sido compartilhado. Despublique antes de remover.");
            }

            var chave = _armazenamento.ChaveDaUrl(plano.ArquivoUrl);

            try
            {
                _uow.BeginTransaction();
                _repositorio.Delete(plano);
                _uow.Commit();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }

            // O PDF sai DEPOIS do commit, e fora da transação.
            //
            // A ordem não é acidental. Apagar o arquivo antes e falhar no
            // banco deixaria um plano no acervo apontando para um download
            // que não existe — quebrado para todo professor que o abrisse.
            // Nesta ordem, o pior caso é um arquivo órfão no R2: invisível,
            // e que custa centavos.
            //
            // A falha da remoção também não derruba a operação. O plano já
            // saiu do acervo, que é o que a pessoa pediu; devolver erro
            // depois disso faria parecer que nada aconteceu, e o clique
            // repetido não teria mais o que remover.
            if (chave is not null)
            {
                try
                {
                    await _armazenamento.RemoverAsync(chave);
                }
                catch
                {
                    // Órfão. A dívida está registrada em `Docs/todo.md`: não
                    // há coleta de arquivo sem plano.
                }
            }

            return Result.Success();
        }

        public async Task<Result<Guid>> CatalogarAsync(PlanoEntradaDto entrada, Guid? catalogadoPorId)
        {
            if (entrada.ComponentePrincipalId == Guid.Empty)
                return Result<Guid>.Failure("Escolha o componente curricular principal.");

            if (entrada.SeriesIds.Count == 0)
                return Result<Guid>.Failure("Escolha ao menos uma série.");

            // O principal não pode estar repetido entre os secundários: o
            // banco rejeitaria por chave composta, mas com uma mensagem de
            // violação de constraint que não diz nada a quem cataloga.
            var secundarios = entrada.ComponentesSecundariosIds
                .Where(id => id != entrada.ComponentePrincipalId)
                .Distinct()
                .ToList();

            var agora = DateTime.UtcNow;
            var publicar = entrada.Publicar;

            var plano = new Plano
            {
                Titulo = entrada.Titulo?.Trim() ?? string.Empty,
                Autoria = entrada.Autoria?.Trim() ?? string.Empty,
                ObjetosConhecimento = entrada.ObjetosConhecimento?.Trim() ?? string.Empty,
                Objetivo = entrada.Objetivo?.Trim() ?? string.Empty,
                ExpectativasAprendizagem = entrada.ExpectativasAprendizagem?.Trim() ?? string.Empty,
                Recursos = entrada.Recursos?.Trim(),
                Modalidade = entrada.Modalidade?.Trim(),
                TurmaOrigem = entrada.TurmaOrigem?.Trim(),
                DuracaoAulas = entrada.DuracaoAulas,
                DuracaoDescricao = entrada.DuracaoDescricao?.Trim(),
                ArquivoUrl = entrada.ArquivoUrl?.Trim() ?? string.Empty,
                LinksExtras = entrada.LinksExtras,
                Situacao = publicar ? SituacaoPlano.Publicado : SituacaoPlano.Rascunho,
                // `DateTime.UtcNow` sempre: o Npgsql recusa `Kind != Utc` numa
                // coluna `timestamptz`, em tempo de execução.
                PublicadoEm = publicar ? agora : null,
                CriadoEm = agora,
                AtualizadoEm = agora,
                CatalogadoPorId = catalogadoPorId,
            };

            plano.Componentes.Add(new PlanoComponente
            {
                ComponenteId = entrada.ComponentePrincipalId,
                EPrincipal = true,
            });
            foreach (var id in secundarios)
                plano.Componentes.Add(new PlanoComponente { ComponenteId = id, EPrincipal = false });

            foreach (var id in entrada.SeriesIds.Distinct())
                plano.Series.Add(new PlanoSerie { SerieId = id });

            foreach (var id in entrada.MetodologiasIds.Distinct())
                plano.Metodologias.Add(new PlanoMetodologia { MetodologiaId = id });

            // A ordem é REATRIBUÍDA a partir da posição na lista, e não copiada
            // do que veio. O formulário deixa arrastar e remover etapa, e uma
            // ordem com buraco (1, 2, 4) ou repetida chegaria aqui — o banco
            // recusaria por `unique (plano_id, ordem)`, com erro ilegível.
            var ordem = 1;
            foreach (var etapa in entrada.Etapas)
            {
                plano.Etapas.Add(new EtapaPlano
                {
                    Ordem = ordem++,
                    Titulo = etapa.Titulo?.Trim(),
                    Descricao = etapa.Descricao?.Trim() ?? string.Empty,
                });
            }

            foreach (var codigo in entrada.CodigosBncc
                         .Select(c => c?.Trim().ToUpperInvariant())
                         .Where(c => !string.IsNullOrWhiteSpace(c))
                         .Distinct())
            {
                plano.CodigosBncc.Add(new Bncc { Codigo = codigo! });
            }

            try
            {
                _uow.BeginTransaction();
                _repositorio.Insert(plano);
                _uow.Commit();
                return Result<Guid>.Success(plano.Id);
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }
    }

    public class VocabularioAppService : IVocabularioAppService
    {
        private readonly IVocabularioRepository _repositorio;
        private readonly VocabularioMapper _mapper;

        public VocabularioAppService(IVocabularioRepository repositorio, VocabularioMapper mapper)
        {
            _repositorio = repositorio;
            _mapper = mapper;
        }

        public async Task<VocabularioDto> ObterAsync() => new()
        {
            Componentes = _mapper.ParaDto(await _repositorio.ComponentesAtivosAsync()),
            Series = _mapper.ParaDto(await _repositorio.SeriesAtivasAsync()),
            Metodologias = _mapper.ParaDto(await _repositorio.MetodologiasAtivasAsync()),
        };
    }
}
