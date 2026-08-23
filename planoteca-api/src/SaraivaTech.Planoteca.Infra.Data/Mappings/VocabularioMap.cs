using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Infra.Data.Mappings
{
    /// <summary>
    /// Os três mapeamentos do vocabulário de classificação.
    ///
    /// Nome de tabela e de coluna saem da convenção snake_case
    /// (`UseSnakeCaseNamingConvention`): NÃO escrever `HasColumnName` só para
    /// converter caixa.
    /// </summary>
    public class SerieMap : IEntityTypeConfiguration<Serie>
    {
        public void Configure(EntityTypeBuilder<Serie> builder)
        {
            builder.ToTable("serie");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Etapa).IsRequired().HasColumnType("text");
            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            builder.Property(x => x.RotuloCompleto).IsRequired().HasColumnType("text");
            builder.Property(x => x.Sigla).IsRequired().HasColumnType("text");
            builder.Property(x => x.Ordem).IsRequired();
            builder.Property(x => x.Ativa).IsRequired().HasDefaultValue(true);

            builder.HasIndex(x => new { x.Etapa, x.Nome }).IsUnique();
            builder.HasIndex(x => x.Ordem).IsUnique();
        }
    }

    public class ComponenteMap : IEntityTypeConfiguration<Componente>
    {
        public void Configure(EntityTypeBuilder<Componente> builder)
        {
            builder.ToTable("componente");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Area).IsRequired().HasColumnType("text");
            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            // Cor e Sigla NOT NULL: a ficha desenha um bloco chapado, e um
            // componente sem cor nasceria transparente (RF-03).
            builder.Property(x => x.Sigla).IsRequired().HasColumnType("varchar(2)");
            builder.Property(x => x.Cor).IsRequired().HasColumnType("text");
            builder.Property(x => x.Ordem).IsRequired();
            builder.Property(x => x.Ativo).IsRequired().HasDefaultValue(true);
        }
    }

    public class MetodologiaMap : IEntityTypeConfiguration<Metodologia>
    {
        public void Configure(EntityTypeBuilder<Metodologia> builder)
        {
            builder.ToTable("metodologia");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            builder.Property(x => x.Tipo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Fonte).HasColumnType("text");
            builder.Property(x => x.Ativa).IsRequired().HasDefaultValue(true);
        }
    }
}
