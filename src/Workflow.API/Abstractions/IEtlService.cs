using Workflow.API.Models;

namespace Workflow.API.Abstractions;

public interface IEtlService
{
    Task<string> CreateDatabaseAsync(string databaseName);
    Task<bool> DropDatabaseAsync(string databaseName);
    IEnumerable<string> ListDatabases();
    Task<bool> CreateTableAsync(string databaseName, string tableName, IEnumerable<ColumnDefinition> columns);
    Task<bool> DropTableAsync(string databaseName, string tableName);
    Task<IEnumerable<string>> ListTablesAsync(string databaseName);
    Task<long> InsertDataAsync(string databaseName, string tableName, IEnumerable<Dictionary<string, object?>> data);
    Task<IEnumerable<Dictionary<string, object?>>> SelectDataAsync(string databaseName, string tableName, int limit = 1000);
    Task<EtlExecutionResult> ExecuteEtlWorkflowAsync(WorkflowModel workflow);
    Task SyncDatabaseStructureAsync(string databaseName);
}