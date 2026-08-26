using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Application.Mappers;
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

            var (porNono, totalNono) = await repo.BuscarAsync(new FiltroPlano { SeriesIds = [nono.Id] });
            var (porOitavo, totalOitavo) = await repo.BuscarAsync(new FiltroPlano { SeriesIds = [oitavo.Id] });

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
            var (achados, total) = await repo.BuscarAsync(new FiltroPlano { ComponentesIds = [arte.Id] });

            total.Should().Be(1, "RF-08: buscar por Arte acha a prática em que Arte é SECUNDÁRIA");
            achados.Single().Id.Should().Be(plano.Id);

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Duas_series_no_filtro_casam_por_OU()
        {
            await LimparAsync();
            var (_, _, oitavo, nono, _, _) = await VocabularioAsync();

            var planoOitavo = NovoPlano("só 8º ano");
            planoOitavo.Series.Add(new PlanoSerie { SerieId = oitavo.Id });
            var planoNono = NovoPlano("só 9º ano");
            planoNono.Series.Add(new PlanoSerie { SerieId = nono.Id });
            Contexto.AddRange(planoOitavo, planoNono);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var (achados, total) = await repo.BuscarAsync(new FiltroPlano { SeriesIds = [oitavo.Id, nono.Id] });

            total.Should().Be(2, "dentro do grupo série a semântica é OU: 8º ou 9º traz os dois planos");
            achados.Select(p => p.Id).Should().BeEquivalentTo([planoOitavo.Id, planoNono.Id]);

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Serie_e_componente_juntos_restringem_por_E()
        {
            await LimparAsync();
            var (quimica, arte, oitavo, nono, _, _) = await VocabularioAsync();

            // Casa só série (nono): não deve entrar no recorte "nono E arte".
            var soSerie = NovoPlano("nono ano de química");
            soSerie.Series.Add(new PlanoSerie { SerieId = nono.Id });
            soSerie.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });

            // Casa os dois grupos: nono ano E arte.
            var casaAmbos = NovoPlano("nono ano de arte");
            casaAmbos.Series.Add(new PlanoSerie { SerieId = nono.Id });
            casaAmbos.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = true });

            // Casa só componente (arte), série errada: também fora.
            var soComponente = NovoPlano("oitavo ano de arte");
            soComponente.Series.Add(new PlanoSerie { SerieId = oitavo.Id });
            soComponente.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = true });

            Contexto.AddRange(soSerie, casaAmbos, soComponente);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var (achados, total) = await repo.BuscarAsync(
                new FiltroPlano { SeriesIds = [nono.Id], ComponentesIds = [arte.Id] });

            total.Should().Be(1, "entre grupos a semântica é E: precisa casar série E componente");
            achados.Single().Id.Should().Be(casaAmbos.Id);

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

        [SkippableFact]
        public async Task Resumo_leva_a_situacao_do_plano()
        {
            // O campo faltava no `PlanoResumoDto`, e a tela de gestão recebia
            // `undefined`. Como `undefined !== 'publicado'`, todo plano
            // aparecia como rascunho: etiqueta errada, botão "Publicar" onde
            // devia estar "Despublicar", e remoção recusada com uma mensagem
            // que contradizia a própria tela.
            //
            // O teste do front passava, porque a fixture do MSW sempre
            // trazia o campo. Testava um contrato que o servidor não cumpria
            // — daí este viver aqui, contra o mapeador real.
            var mapeador = new PlanoMapper(new VocabularioMapper());

            var publicado = NovoPlano("resumo publicado", SituacaoPlano.Publicado);
            var rascunho = NovoPlano("resumo rascunho", SituacaoPlano.Rascunho);

            mapeador.ParaResumo(publicado).Situacao.Should().Be(SituacaoPlano.Publicado);
            mapeador.ParaResumo(rascunho).Situacao.Should().Be(SituacaoPlano.Rascunho);
        }

        [SkippableFact]
        public async Task Faceta_de_um_grupo_ignora_a_selecao_do_proprio_grupo()
        {
            await LimparAsync();
            var (quimica, arte, oitavo, nono, _, _) = await VocabularioAsync();

            // Nono ano com Química: casa a série marcada e o componente marcado.
            var nonoQuimica = NovoPlano("nono de química");
            nonoQuimica.Series.Add(new PlanoSerie { SerieId = nono.Id });
            nonoQuimica.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });

            // Nono ano com Arte: casa a série marcada, componente diferente.
            var nonoArte = NovoPlano("nono de arte");
            nonoArte.Series.Add(new PlanoSerie { SerieId = nono.Id });
            nonoArte.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = true });

            // Oitavo ano com Química: série diferente, componente marcado.
            var oitavoQuimica = NovoPlano("oitavo de química");
            oitavoQuimica.Series.Add(new PlanoSerie { SerieId = oitavo.Id });
            oitavoQuimica.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });

            // Oitavo ano com Arte: fora dos dois recortes.
            var oitavoArte = NovoPlano("oitavo de arte");
            oitavoArte.Series.Add(new PlanoSerie { SerieId = oitavo.Id });
            oitavoArte.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = true });

            Contexto.AddRange(nonoQuimica, nonoArte, oitavoQuimica, oitavoArte);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var contagem = await repo.ContarFacetasAsync(new FiltroPlano
            {
                Busca = MarcaTeste,
                SeriesIds = [nono.Id],
                ComponentesIds = [quimica.Id],
            });

            // RF-02: a contagem de componente ignora o componente marcado e
            // aplica a série marcada. Arte responde pelo plano de 9º com Arte.
            contagem.Componentes.Should().ContainEquivalentOf(
                new FacetaContada(arte.Id, 1),
                "a contagem de componente aplica o 9º e ignora Química");
            contagem.Componentes.Should().ContainEquivalentOf(
                new FacetaContada(quimica.Id, 1),
                "o próprio item marcado conta dentro do recorte dos outros grupos");

            // No outro sentido: a contagem de série ignora a série marcada e
            // aplica Química. O 8º responde pelo plano de 8º com Química.
            contagem.Series.Should().ContainEquivalentOf(
                new FacetaContada(oitavo.Id, 1),
                "a contagem de série aplica Química e ignora o 9º");
            contagem.Series.Should().ContainEquivalentOf(
                new FacetaContada(nono.Id, 1),
                "o 9º conta o plano de 9º com Química");

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Rascunho_nao_entra_em_nenhuma_contagem()
        {
            await LimparAsync();
            var (quimica, _, _, nono, storytelling, _) = await VocabularioAsync();

            var rascunho = NovoPlano("rascunho que não conta", SituacaoPlano.Rascunho);
            rascunho.Series.Add(new PlanoSerie { SerieId = nono.Id });
            rascunho.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });
            rascunho.Metodologias.Add(new PlanoMetodologia { MetodologiaId = storytelling.Id });
            Contexto.Add(rascunho);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var contagem = await repo.ContarFacetasAsync(new FiltroPlano { Busca = MarcaTeste });

            contagem.Series.Should().NotContain(f => f.Id == nono.Id,
                "a contagem é do acervo público, e rascunho não é público");
            contagem.Componentes.Should().NotContain(f => f.Id == quimica.Id);
            contagem.Metodologias.Should().NotContain(f => f.Id == storytelling.Id);

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Item_sem_plano_fica_fora_da_resposta()
        {
            await LimparAsync();
            var (quimica, _, _, nono, storytelling, escape) = await VocabularioAsync();

            var plano = NovoPlano("só storytelling");
            plano.Series.Add(new PlanoSerie { SerieId = nono.Id });
            plano.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });
            plano.Metodologias.Add(new PlanoMetodologia { MetodologiaId = storytelling.Id });
            Contexto.Add(plano);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var contagem = await repo.ContarFacetasAsync(new FiltroPlano { Busca = MarcaTeste });

            // RF-01: só id com pelo menos um plano entra. Id ausente vale zero,
            // e o front desenha o item com zero do mesmo jeito.
            contagem.Metodologias.Should().ContainEquivalentOf(new FacetaContada(storytelling.Id, 1));
            contagem.Metodologias.Should().NotContain(f => f.Id == escape.Id);

            await LimparAsync();
        }

    }
}
