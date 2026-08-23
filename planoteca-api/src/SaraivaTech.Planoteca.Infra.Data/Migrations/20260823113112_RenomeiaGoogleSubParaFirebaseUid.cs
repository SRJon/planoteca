using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaraivaTech.Planoteca.Infra.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenomeiaGoogleSubParaFirebaseUid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "google_sub",
                table: "pessoa",
                newName: "firebase_uid");

            migrationBuilder.RenameIndex(
                name: "ix_pessoa_google_sub",
                table: "pessoa",
                newName: "ix_pessoa_firebase_uid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "firebase_uid",
                table: "pessoa",
                newName: "google_sub");

            migrationBuilder.RenameIndex(
                name: "ix_pessoa_firebase_uid",
                table: "pessoa",
                newName: "ix_pessoa_google_sub");
        }
    }
}
