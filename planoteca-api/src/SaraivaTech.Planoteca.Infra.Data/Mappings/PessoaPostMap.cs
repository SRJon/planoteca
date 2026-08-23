using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Infra.Data.Mappings
{
    public class PessoaMap : IEntityTypeConfiguration<Pessoa>
    {
        public void Configure(EntityTypeBuilder<Pessoa> builder)
        {
            builder.ToTable("pessoa");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.FirebaseUid).HasColumnType("text");
            builder.Property(x => x.Email).IsRequired().HasColumnType("text");
            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            builder.Property(x => x.Papel).IsRequired().HasColumnType("text");
            builder.Property(x => x.Ativo).IsRequired().HasDefaultValue(true);
            builder.Property(x => x.CriadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            builder.HasIndex(x => x.Email).IsUnique();
            builder.HasIndex(x => x.FirebaseUid).IsUnique();
        }
    }

    public class PostMap : IEntityTypeConfiguration<Post>
    {
        public void Configure(EntityTypeBuilder<Post> builder)
        {
            builder.ToTable("post");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Titulo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Resumo).HasColumnType("text");
            builder.Property(x => x.Corpo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Situacao).IsRequired().HasColumnType("text");
            builder.Property(x => x.ComentarioModeracao).HasColumnType("text");
            builder.Property(x => x.ModeradoEm).HasColumnType("timestamp with time zone");
            builder.Property(x => x.PublicadoEm).HasColumnType("timestamp with time zone");
            builder.Property(x => x.CriadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            builder.HasOne(x => x.Autor)
                .WithMany()
                .HasForeignKey(x => x.AutorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.ModeradoPor)
                .WithMany()
                .HasForeignKey(x => x.ModeradoPorId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(x => x.Situacao);
        }
    }
}
