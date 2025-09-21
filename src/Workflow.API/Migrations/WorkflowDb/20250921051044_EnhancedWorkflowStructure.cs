using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Workflow.API.Migrations.WorkflowDb
{
    /// <inheritdoc />
    public partial class EnhancedWorkflowStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExecutionLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    WorkflowId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    WorkflowName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    NodeId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NodeName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NodeType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExecutionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Workflows",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Nodes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Connections = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workflows", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExecutionLogs_Timestamp",
                table: "ExecutionLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_ExecutionLogs_WorkflowId",
                table: "ExecutionLogs",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_Name",
                table: "Workflows",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExecutionLogs");

            migrationBuilder.DropTable(
                name: "Workflows");
        }
    }
}
