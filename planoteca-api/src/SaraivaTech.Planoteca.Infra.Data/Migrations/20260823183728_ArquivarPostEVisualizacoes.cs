using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaraivaTech.Planoteca.Infra.Data.Migrations
{
    /// <inheritdoc />
    public partial class ArquivarPostEVisualizacoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "situacao_anterior",
                table: "post",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "visualizacoes",
                table: "post",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "situacao_anterior",
                table: "post");

            migrationBuilder.DropColumn(
                name: "visualizacoes",
                table: "post");
        }
    }
}
