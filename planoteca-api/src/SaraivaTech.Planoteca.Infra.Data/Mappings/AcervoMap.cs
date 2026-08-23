using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Infra.Data.Mappings
{
    public class PlanoMap : IEntityTypeConfiguration<Plano>
    {
        public void Configure(EntityTypeBuilder<Plano> builder)
        {
            builder.ToTable("plano");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Titulo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Autoria).IsRequired().HasColumnType("text");
            builder.Property(x => x.ObjetosConhecimento).IsRequired().HasColumnType("text");
            builder.Property(x => x.Modalidade).HasColumnType("text");
            builder.Property(x => x.TurmaOrigem).HasColumnType("text");
            builder.Property(x => x.Objetivo).IsRequired().HasColumnType("text");
            builder.Property(x => x.ExpectativasAprendizagem).IsRequired().HasColumnType("text");
            builder.Property(x => x.Recursos).HasColumnType("text");
            builder.Property(x => x.DuracaoDescricao).HasColumnType("text");
            builder.Property(x => x.ArquivoUrl).IsRequired().HasColumnType("text");
            builder.Property(x => x.LinksExtras).HasColumnType("jsonb");
            builder.Property(x => x.Situacao).IsRequired().HasColumnType("text");

            builder.Property(x => x.PublicadoEm).HasColumnType("timestamp with time zone");
            builder.Property(x => x.CriadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");
            builder.Property(x => x.AtualizadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            builder.HasOne(x => x.CatalogadoPor)
                .WithMany()
                .HasForeignKey(x => x.CatalogadoPorId)
                .OnDelete(DeleteBehavior.SetNull);

            // A listagem pública filtra por situação em toda consulta.
            builder.HasIndex(x => x.Situacao);
        }
    }

    public class EtapaPlanoMap : IEntityTypeConfiguration<EtapaPlano>
    {
        public void Configure(EntityTypeBuilder<EtapaPlano> builder)
        {
            builder.ToTable("etapa_plano");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Ordem).IsRequired();
            builder.Property(x => x.Titulo).HasColumnType("text");
            builder.Property(x => x.Descricao).IsRequired().HasColumnType("text");

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Etapas)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.PlanoId, x.Ordem }).IsUnique();
        }
    }

    public class PlanoComponenteMap : IEntityTypeConfiguration<PlanoComponente>
    {
        public void Configure(EntityTypeBuilder<PlanoComponente> builder)
        {
            builder.ToTable("plano_componente");
            builder.HasKey(x => new { x.PlanoId, x.ComponenteId });

            builder.Property(x => x.EPrincipal).IsRequired().HasDefaultValue(false);

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Componentes)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Componente)
                .WithMany()
                .HasForeignKey(x => x.ComponenteId)
                .OnDelete(DeleteBehavior.Restrict);

            // O índice único PARCIAL que garante um principal por plano
            // (RF-04b) não nasce aqui: o EF não gera índice parcial. Ele é
            // escrito com migrationBuilder.Sql() dentro da migration.
        }
    }

    public class PlanoSerieMap : IEntityTypeConfiguration<PlanoSerie>
    {
        public void Configure(EntityTypeBuilder<PlanoSerie> builder)
        {
            builder.ToTable("plano_serie");
            builder.HasKey(x => new { x.PlanoId, x.SerieId });

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Series)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Serie)
                .WithMany()
                .HasForeignKey(x => x.SerieId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class PlanoMetodologiaMap : IEntityTypeConfiguration<PlanoMetodologia>
    {
        public void Configure(EntityTypeBuilder<PlanoMetodologia> builder)
        {
            builder.ToTable("plano_metodologia");
            builder.HasKey(x => new { x.PlanoId, x.MetodologiaId });

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Metodologias)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Metodologia)
                .WithMany()
                .HasForeignKey(x => x.MetodologiaId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class BnccMap : IEntityTypeConfiguration<Bncc>
    {
        public void Configure(EntityTypeBuilder<Bncc> builder)
        {
            builder.ToTable("bncc");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Codigo).IsRequired().HasColumnType("varchar(20)");

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.CodigosBncc)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.PlanoId, x.Codigo }).IsUnique();
        }
    }
}
