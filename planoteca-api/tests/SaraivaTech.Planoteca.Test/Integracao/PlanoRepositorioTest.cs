using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Integracao
{
    /// <summary>
    /// O filtro da Biblioteca contra o PostgreSQL real.
    ///
    /// Cada teste monta o seu cenário, roda e limpa. Não há dependência de
    /// ordem entre eles nem estado compartilhado — o `MarcaTeste` no título
    /// isola o que cada um criou.
    /// </summary>
    [Collection("banco-real")]
    public class PlanoRepositorioTest : BaseBancoReal
    {
        private async Task<(Componente quimica, Componente arte, Serie oitavo, Serie nono, Metodologia storytelling, Metodologia escape)> VocabularioAsync()
        {
            var quimica = await Contexto.Set<Componente>().FirstAsync(c => c.Nome == "Química");
            var arte = await Contexto.Set<Componente>().FirstAsync(c => c.Nome == "Arte");
            var oitavo = await Contexto.Set<Serie>().FirstAsync(s => s.Nome == "8º ano");
            var nono = await Contexto.Set<Serie>().FirstAsync(s => s.Nome == "9º ano");
            var storytelling = await Contexto.Set<Metodologia>().FirstAsync(m => m.Nome == "Storytelling");
            var escape = await Contexto.Set<Metodologia>().FirstAsync(m => m.Nome == "Escape Room");
            return (quimica, arte, oitavo, nono, storytelling, escape);
        }

        private Plano NovoPlano(string titulo, string situacao = SituacaoPlano.Publicado, int? duracao = null) => new()
        {
            Titulo = $"{MarcaTeste} {titulo}",
            Autoria = "Autoria de teste",
            ObjetosConhecimento = "Escalas Termométricas",
            Objetivo = "Objetivo de teste",
            ExpectativasAprendizagem = "Expectativa de teste",
            ArquivoUrl = "/teste.pdf",
            Situacao = situacao,
            DuracaoAulas = duracao,
            PublicadoEm = situacao == SituacaoPlano.Publicado ? DateTime.UtcNow : null,
        };

        private async Task LimparAsync()
        {
            var meus = await Contexto.Set<Plano>().Where(p => p.Titulo.StartsWith(MarcaTeste)).ToListAsync();
            Contexto.Set<Plano>().RemoveRange(meus);
            await Contexto.SaveChangesAsync();
        }

        [SkippableFact]
        public async Task Filtro_por_serie_acha_plano_catalogado_em_duas_series()
        {
            await LimparAsync();
            var (_, _, oitavo, nono, _, _) = await VocabularioAsync();

            var plano = NovoPlano("sequência de 8º e 9º");
            plano.Series.Add(new PlanoSerie { SerieId = oitavo.Id });
            plano.Series.Add(new PlanoSerie { SerieId = nono.Id });
            Contexto.Add(plano);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));

            var (porNono, totalNono) = await repo.BuscarAsync(new FiltroPlano { SerieId = nono.Id });
            var (porOitavo, totalOitavo) = await repo.BuscarAsync(new FiltroPlano { SerieId = oitavo.Id });

            totalNono.Should().Be(1, "RF-08: filtrar por 9º ano acha o plano catalogado em 8º E 9º");
            totalOitavo.Should().Be(1, "e o mesmo plano responde pelo 8º ano");
            porNono.Single().Id.Should().Be(plano.Id);
            porOitavo.Single().Id.Should().Be(plano.Id);

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Filtro_por_componente_secundario_acha_pratica_interdisciplinar()
        {
            await LimparAsync();
            var (quimica, arte, _, _, _, _) = await VocabularioAsync();

            var plano = NovoPlano("prática interdisciplinar");
            plano.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });
            plano.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = false });
            Contexto.Add(plano);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var (achados, total) = await repo.BuscarAsync(new FiltroPlano { ComponenteId = arte.Id });

            total.Should().Be(1, "RF-08: buscar por Arte acha a prática em que Arte é SECUNDÁRIA");
            achados.Single().Id.Should().Be(plano.Id);

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Listagem_publica_nao_devolve_rascunho()
        {
            await LimparAsync();

            Contexto.Add(NovoPlano("publicado", SituacaoPlano.Publicado));
            Contexto.Add(NovoPlano("rascunho", SituacaoPlano.Rascunho));
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var (itens, total) = await repo.BuscarAsync(new FiltroPlano { Busca = MarcaTeste });

            total.Should().Be(1, "RF-07: a listagem pública só devolve publicados");
            itens.Single().Titulo.Should().Contain("publicado");

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Busca_textual_ignora_maiuscula_e_acha_no_objeto_de_conhecimento()
        {
            await LimparAsync();

            Contexto.Add(NovoPlano("Termoscópio"));
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));

            // ILIKE: caixa diferente da gravada, e o termo está em
            // ObjetosConhecimento, não no título.
            var (porObjeto, total) = await repo.BuscarAsync(new FiltroPlano { Busca = "ESCALAS TERMOM" });

            total.Should().Be(1, "o ILIKE do Postgres ignora caixa, e a busca varre objetos de conhecimento");
            porObjeto.Single().Titulo.Should().Contain("Termoscópio");

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Filtro_por_duracao_exclui_plano_sem_duracao_declarada()
        {
            await LimparAsync();

            Contexto.Add(NovoPlano("duas aulas", duracao: 2));
            Contexto.Add(NovoPlano("dez aulas", duracao: 10));
            Contexto.Add(NovoPlano("duração desconhecida", duracao: null));
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var (itens, total) = await repo.BuscarAsync(new FiltroPlano { DuracaoMaxima = 3 });

            total.Should().Be(1, "nulo não é zero: plano sem duração declarada fica fora do recorte");
            itens.Single().Titulo.Should().Contain("duas aulas");

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Ficha_traz_etapas_ordenadas()
        {
            await LimparAsync();

            var plano = NovoPlano("com etapas fora de ordem");
            plano.Etapas.Add(new EtapaPlano { Ordem = 3, Descricao = "terceira" });
            plano.Etapas.Add(new EtapaPlano { Ordem = 1, Descricao = "primeira" });
            plano.Etapas.Add(new EtapaPlano { Ordem = 2, Descricao = "segunda" });
            Contexto.Add(plano);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var completo = await repo.ObterCompletoAsync(plano.Id);

            completo.Should().NotBeNull();
            // RF-06: as etapas voltam por `Ordem`, e não pela ordem de inserção.
            completo!.Etapas.Select(e => e.Descricao)
                .Should().ContainInOrder("primeira", "segunda", "terceira");

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Apagar_plano_leva_as_etapas_junto()
        {
            await LimparAsync();

            var plano = NovoPlano("some com as etapas");
            plano.Etapas.Add(new EtapaPlano { Ordem = 1, Descricao = "etapa órfã em potencial" });
            Contexto.Add(plano);
            await Contexto.SaveChangesAsync();
            var planoId = plano.Id;

            Contexto.Remove(plano);
            await Contexto.SaveChangesAsync();

            var etapasRestantes = await Contexto.Set<EtapaPlano>().CountAsync(e => e.PlanoId == planoId);
            etapasRestantes.Should().Be(0, "o on delete cascade do mapeamento");
        }

        [SkippableFact]
        public async Task Banco_recusa_dois_componentes_principais()
        {
            await LimparAsync();
            var (quimica, arte, _, _, _, _) = await VocabularioAsync();

            var plano = NovoPlano("dois principais");
            plano.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });
            plano.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = true });
            Contexto.Add(plano);

            // RF-04b: a garantia é do BANCO, por índice único parcial. Não há
            // validação de aplicação a contornar.
            var gravar = async () => await Contexto.SaveChangesAsync();
            await gravar.Should().ThrowAsync<DbUpdateException>();

            Contexto.ChangeTracker.Clear();
            await LimparAsync();
        }
    }
}
