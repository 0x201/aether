using Workflow.API.Models;

namespace Workflow.API.Abstractions;

public interface IEtlRepository
{
    // Database operations
    Task<IEnumerable<EtlDatabase>> GetAllDatabasesAsync();
    Task<EtlDatabase?> GetDatabaseByIdAsync(int id);
    Task<EtlDatabase?> GetDatabaseByNameAsync(string name);
    Task<EtlDatabase> CreateDatabaseAsync(EtlDatabase database);
    Task<EtlDatabase> UpdateDatabaseAsync(EtlDatabase database);
    Task<bool> DeleteDatabaseAsync(int id);
    
    // Table operations
    Task<IEnumerable<EtlTable>> GetAllTablesAsync();
    Task<IEnumerable<EtlTable>> GetTablesByDatabaseIdAsync(int databaseId);
    Task<EtlTable?> GetTableByIdAsync(int id);
    Task<EtlTable?> GetTableByNameAsync(int databaseId, string name);
    Task<EtlTable> CreateTableAsync(EtlTable table);
    Task<EtlTable> UpdateTableAsync(EtlTable table);
    Task<bool> DeleteTableAsync(int id);
    
    // Column operations
    Task<IEnumerable<EtlColumn>> GetAllColumnsAsync();
    Task<IEnumerable<EtlColumn>> GetColumnsByTableIdAsync(int tableId);
    Task<EtlColumn?> GetColumnByIdAsync(int id);
    Task<EtlColumn?> GetColumnByNameAsync(int tableId, string name);
    Task<EtlColumn> CreateColumnAsync(EtlColumn column);
    Task<EtlColumn> UpdateColumnAsync(EtlColumn column);
    Task<bool> DeleteColumnAsync(int id);
    
    // Task instance operations
    Task<IEnumerable<TaskInstance>> GetAllTaskInstancesAsync();
    Task<IEnumerable<TaskInstance>> GetTaskInstancesByWorkflowIdAsync(string workflowId);
    Task<TaskInstance?> GetTaskInstanceByIdAsync(string id);
    Task<TaskInstance> CreateTaskInstanceAsync(TaskInstance taskInstance);
    Task<TaskInstance> UpdateTaskInstanceAsync(TaskInstance taskInstance);
    Task<bool> DeleteTaskInstanceAsync(string id);
}