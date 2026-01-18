using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DyDanmaku.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameWordFrequenciesToDanmakuAnalyses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "danmaku_analyses",
                schema: "dydanmaku",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    room_id = table.Column<int>(type: "integer", nullable: true),
                    start_time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    frequencies = table.Column<string>(type: "text", nullable: true),
                    word_cloud = table.Column<byte[]>(type: "bytea", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("danmaku_analyses_pk", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "danmaku_analyses_id_idx",
                schema: "dydanmaku",
                table: "danmaku_analyses",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "danmaku_analyses_room_id_idx",
                schema: "dydanmaku",
                table: "danmaku_analyses",
                column: "room_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "danmaku_analyses",
                schema: "dydanmaku");
        }
    }
}
