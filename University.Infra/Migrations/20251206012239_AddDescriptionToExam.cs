using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace University.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AddDescriptionToExam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Exams",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Exams");
        }
    }
}
