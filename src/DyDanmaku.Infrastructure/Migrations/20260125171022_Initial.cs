using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DyDanmaku.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "dydanmaku");

            migrationBuilder.CreateTable(
                name: "capture_jobs",
                schema: "dydanmaku",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    room_id = table.Column<int>(type: "integer", nullable: false),
                    duration = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    start_time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    last_modified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    last_modified_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("capture_jobs_pk", x => x.id);
                });

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
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    last_modified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    last_modified_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("danmaku_analyses_pk", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "danmakus",
                schema: "dydanmaku",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "text", nullable: true),
                    user_name = table.Column<string>(type: "text", nullable: true),
                    content = table.Column<string>(type: "text", nullable: true),
                    user_level = table.Column<int>(type: "integer", nullable: true),
                    fan_medal_name = table.Column<string>(type: "text", nullable: true),
                    fan_medal_level = table.Column<int>(type: "integer", nullable: true),
                    room_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    last_modified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    last_modified_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("danmakus_pk", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "rooms",
                schema: "dydanmaku",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    room_id = table.Column<int>(type: "integer", nullable: false),
                    room_name = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    last_modified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    last_modified_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("rooms_pk", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "capture_jobs_id_idx",
                schema: "dydanmaku",
                table: "capture_jobs",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "capture_jobs_room_id_idx",
                schema: "dydanmaku",
                table: "capture_jobs",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "capture_jobs_status_idx",
                schema: "dydanmaku",
                table: "capture_jobs",
                column: "status");

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

            migrationBuilder.CreateIndex(
                name: "danmakus_id_idx",
                schema: "dydanmaku",
                table: "danmakus",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "danmakus_room_id_idx",
                schema: "dydanmaku",
                table: "danmakus",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "danmakus_user_id_idx",
                schema: "dydanmaku",
                table: "danmakus",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "danmakus_user_name_idx",
                schema: "dydanmaku",
                table: "danmakus",
                column: "user_name");

            migrationBuilder.CreateIndex(
                name: "danmakus_created_at_idx",
                schema: "dydanmaku",
                table: "danmakus",
                column: "created_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "capture_jobs",
                schema: "dydanmaku");

            migrationBuilder.DropTable(
                name: "danmaku_analyses",
                schema: "dydanmaku");

            migrationBuilder.DropTable(
                name: "danmakus",
                schema: "dydanmaku");

            migrationBuilder.DropTable(
                name: "rooms",
                schema: "dydanmaku");
        }
    }
}
