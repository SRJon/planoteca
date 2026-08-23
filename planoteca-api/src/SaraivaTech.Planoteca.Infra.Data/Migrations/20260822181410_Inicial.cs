using System;
using Microsoft.EntityFrameworkCore.Migrations;
using SaraivaTech.Planoteca.Infra.Data.Seed;

#nullable disable

namespace SaraivaTech.Planoteca.Infra.Data.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "componente",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    area = table.Column<string>(type: "text", nullable: false),
                    nome = table.Column<string>(type: "text", nullable: false),
                    sigla = table.Column<string>(type: "varchar(2)", nullable: false),
                    cor = table.Column<string>(type: "text", nullable: false),
                    ordem = table.Column<int>(type: "integer", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_componente", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "metodologia",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "text", nullable: false),
                    tipo = table.Column<string>(type: "text", nullable: false),
                    fonte = table.Column<string>(type: "text", nullable: true),
                    ativa = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_metodologia", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "pessoa",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    google_sub = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: false),
                    nome = table.Column<string>(type: "text", nullable: false),
                    papel = table.Column<string>(type: "text", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pessoa", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "serie",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    etapa = table.Column<string>(type: "text", nullable: false),
                    nome = table.Column<string>(type: "text", nullable: false),
                    rotulo_completo = table.Column<string>(type: "text", nullable: false),
                    sigla = table.Column<string>(type: "text", nullable: false),
                    ordem = table.Column<int>(type: "integer", nullable: false),
                    ativa = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_serie", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "plano",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    titulo = table.Column<string>(type: "text", nullable: false),
                    autoria = table.Column<string>(type: "text", nullable: false),
                    objetos_conhecimento = table.Column<string>(type: "text", nullable: false),
                    modalidade = table.Column<string>(type: "text", nullable: true),
                    turma_origem = table.Column<string>(type: "text", nullable: true),
                    objetivo = table.Column<string>(type: "text", nullable: false),
                    expectativas_aprendizagem = table.Column<string>(type: "text", nullable: false),
                    recursos = table.Column<string>(type: "text", nullable: true),
                    duracao_aulas = table.Column<int>(type: "integer", nullable: true),
                    duracao_descricao = table.Column<string>(type: "text", nullable: true),
                    arquivo_url = table.Column<string>(type: "text", nullable: false),
                    links_extras = table.Column<string>(type: "jsonb", nullable: true),
                    situacao = table.Column<string>(type: "text", nullable: false),
                    catalogado_por_id = table.Column<Guid>(type: "uuid", nullable: true),
                    publicado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    atualizado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_plano", x => x.id);
                    table.ForeignKey(
                        name: "fk_plano_pessoa_catalogado_por_id",
                        column: x => x.catalogado_por_id,
                        principalTable: "pessoa",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "post",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    autor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    titulo = table.Column<string>(type: "text", nullable: false),
                    resumo = table.Column<string>(type: "text", nullable: true),
                    corpo = table.Column<string>(type: "text", nullable: false),
                    situacao = table.Column<string>(type: "text", nullable: false),
                    comentario_moderacao = table.Column<string>(type: "text", nullable: true),
                    moderado_por_id = table.Column<Guid>(type: "uuid", nullable: true),
                    moderado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    publicado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_post", x => x.id);
                    table.ForeignKey(
                        name: "fk_post_pessoa_autor_id",
                        column: x => x.autor_id,
                        principalTable: "pessoa",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_post_pessoa_moderado_por_id",
                        column: x => x.moderado_por_id,
                        principalTable: "pessoa",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "bncc",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plano_id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo = table.Column<string>(type: "varchar(20)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bncc", x => x.id);
                    table.ForeignKey(
                        name: "fk_bncc_plano_plano_id",
                        column: x => x.plano_id,
                        principalTable: "plano",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "etapa_plano",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plano_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ordem = table.Column<int>(type: "integer", nullable: false),
                    titulo = table.Column<string>(type: "text", nullable: true),
                    descricao = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_etapa_plano", x => x.id);
                    table.ForeignKey(
                        name: "fk_etapa_plano_plano_plano_id",
                        column: x => x.plano_id,
                        principalTable: "plano",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "plano_componente",
                columns: table => new
                {
                    plano_id = table.Column<Guid>(type: "uuid", nullable: false),
                    componente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    e_principal = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_plano_componente", x => new { x.plano_id, x.componente_id });
                    table.ForeignKey(
                        name: "fk_plano_componente_componente_componente_id",
                        column: x => x.componente_id,
                        principalTable: "componente",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_plano_componente_plano_plano_id",
                        column: x => x.plano_id,
                        principalTable: "plano",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "plano_metodologia",
                columns: table => new
                {
                    plano_id = table.Column<Guid>(type: "uuid", nullable: false),
                    metodologia_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_plano_metodologia", x => new { x.plano_id, x.metodologia_id });
                    table.ForeignKey(
                        name: "fk_plano_metodologia_metodologia_metodologia_id",
                        column: x => x.metodologia_id,
                        principalTable: "metodologia",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_plano_metodologia_plano_plano_id",
                        column: x => x.plano_id,
                        principalTable: "plano",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "plano_serie",
                columns: table => new
                {
                    plano_id = table.Column<Guid>(type: "uuid", nullable: false),
                    serie_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_plano_serie", x => new { x.plano_id, x.serie_id });
                    table.ForeignKey(
                        name: "fk_plano_serie_plano_plano_id",
                        column: x => x.plano_id,
                        principalTable: "plano",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_plano_serie_serie_serie_id",
                        column: x => x.serie_id,
                        principalTable: "serie",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bncc_plano_id_codigo",
                table: "bncc",
                columns: new[] { "plano_id", "codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_etapa_plano_plano_id_ordem",
                table: "etapa_plano",
                columns: new[] { "plano_id", "ordem" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pessoa_email",
                table: "pessoa",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pessoa_google_sub",
                table: "pessoa",
                column: "google_sub",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_plano_catalogado_por_id",
                table: "plano",
                column: "catalogado_por_id");

            migrationBuilder.CreateIndex(
                name: "ix_plano_situacao",
                table: "plano",
                column: "situacao");

            migrationBuilder.CreateIndex(
                name: "ix_plano_componente_componente_id",
                table: "plano_componente",
                column: "componente_id");

            migrationBuilder.CreateIndex(
                name: "ix_plano_metodologia_metodologia_id",
                table: "plano_metodologia",
                column: "metodologia_id");

            migrationBuilder.CreateIndex(
                name: "ix_plano_serie_serie_id",
                table: "plano_serie",
                column: "serie_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_autor_id",
                table: "post",
                column: "autor_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_moderado_por_id",
                table: "post",
                column: "moderado_por_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_situacao",
                table: "post",
                column: "situacao");

            migrationBuilder.CreateIndex(
                name: "ix_serie_etapa_nome",
                table: "serie",
                columns: new[] { "etapa", "nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_serie_ordem",
                table: "serie",
                column: "ordem",
                unique: true);

            // ── RF-04b — o árbitro do componente principal ─────────────────
            // O EF não gera índice PARCIAL. Este índice é o que faz o BANCO
            // recusar um segundo componente principal no mesmo plano, sem
            // depender de nenhuma validação de aplicação.
            migrationBuilder.Sql(@"
CREATE UNIQUE INDEX ix_plano_componente_principal_unico
    ON plano_componente (plano_id)
 WHERE e_principal;");

            // ── RF-02 — as 41 do Guia de Metodologias Ativas ──────────────
            foreach (var (nome, tipo) in DadosIniciais.Metodologias())
            {
                migrationBuilder.InsertData(
                    table: "metodologia",
                    columns: new[] { "id", "nome", "tipo", "fonte", "ativa" },
                    values: new object[] { Guid.NewGuid(), nome, tipo, "guia-ugb-2020", true });
            }

            // ── RF-03 — as sete séries ────────────────────────────────────
            foreach (var (ordem, etapa, nome, rotulo, sigla) in DadosIniciais.Series())
            {
                migrationBuilder.InsertData(
                    table: "serie",
                    columns: new[] { "id", "etapa", "nome", "rotulo_completo", "sigla", "ordem", "ativa" },
                    values: new object[] { Guid.NewGuid(), etapa, nome, rotulo, sigla, ordem, true });
            }

            // ── RF-03 — os componentes, com cor por ÁREA ──────────────────
            foreach (var (ordem, area, nome, sigla, cor) in DadosIniciais.Componentes())
            {
                migrationBuilder.InsertData(
                    table: "componente",
                    columns: new[] { "id", "area", "nome", "sigla", "cor", "ordem", "ativo" },
                    values: new object[] { Guid.NewGuid(), area, nome, sigla, cor, ordem, true });
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_plano_componente_principal_unico;");

            migrationBuilder.DropTable(
                name: "bncc");

            migrationBuilder.DropTable(
                name: "etapa_plano");

            migrationBuilder.DropTable(
                name: "plano_componente");

            migrationBuilder.DropTable(
                name: "plano_metodologia");

            migrationBuilder.DropTable(
                name: "plano_serie");

            migrationBuilder.DropTable(
                name: "post");

            migrationBuilder.DropTable(
                name: "componente");

            migrationBuilder.DropTable(
                name: "metodologia");

            migrationBuilder.DropTable(
                name: "plano");

            migrationBuilder.DropTable(
                name: "serie");

            migrationBuilder.DropTable(
                name: "pessoa");
        }
    }
}
