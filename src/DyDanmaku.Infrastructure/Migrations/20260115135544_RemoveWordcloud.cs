using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DyDanmaku.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveWordcloud : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "word_cloud",
                schema: "dydanmaku",
                table: "danmaku_analyses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "word_cloud",
                schema: "dydanmaku",
                table: "danmaku_analyses",
                type: "bytea",
                nullable: true);
        }
    }
}
