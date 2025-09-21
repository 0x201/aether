using Workflow.API.Abstractions;
using Workflow.API.Data;
using Workflow.API.Models;

namespace Workflow.API.Services;

public class EtlRepository : IEtlRepository
{
    private readonly IDbContextFactory<EtlDbContext> _contextFactory;
    private readonly ILogger<EtlRepository> _logger;

    public EtlRepository(IDbContextFactory<EtlDbContext> contextFactory, ILogger<EtlRepository> logger)
    {
        _contextFactory = contextFactory;
        _logger = logger;
    }

    // Database operations
    public async Task<IEnumerable<EtlDatabase>> GetAllDatabasesAsync()
    {
        _logger.LogInformation("Retrieving all databases");
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Databases.ToListAsync();
    }

    public async Task<EtlDatabase?> GetDatabaseByIdAsync(int id)
    {
        _logger.LogInformation("Retrieving database with ID: {DatabaseId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Databases.FindAsync(id);
    }

    public async Task<EtlDatabase?> GetDatabaseByNameAsync(string name)
    {
        _logger.LogInformation("Retrieving database with name: {DatabaseName}", name);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Databases.FirstOrDefaultAsync(d => d.Name == name);
    }

    public async Task<EtlDatabase> CreateDatabaseAsync(EtlDatabase database)
    {
        _logger.LogInformation("Creating database with name: {DatabaseName}", database.Name);
        
        using var context = _contextFactory.CreateDbContext();
        database.CreatedAt = DateTime.UtcNow;
        database.UpdatedAt = DateTime.UtcNow;
        
        context.Databases.Add(database);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully created database with ID: {DatabaseId}", database.Id);
        return database;
    }

    public async Task<EtlDatabase> UpdateDatabaseAsync(EtlDatabase database)
    {
        _logger.LogInformation("Updating database with ID: {DatabaseId}", database.Id);
        
        using var context = _contextFactory.CreateDbContext();
        database.UpdatedAt = DateTime.UtcNow;
        
        context.Databases.Update(database);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully updated database with ID: {DatabaseId}", database.Id);
        return database;
    }

    public async Task<bool> DeleteDatabaseAsync(int id)
    {
        _logger.LogInformation("Deleting database with ID: {DatabaseId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        var database = await context.Databases.FindAsync(id);
        if (database == null)
        {
            _logger.LogWarning("Database with ID: {DatabaseId} not found for deletion", id);
            return false;
        }

        context.Databases.Remove(database);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully deleted database with ID: {DatabaseId}", id);
        return true;
    }

    // Table operations
    public async Task<IEnumerable<EtlTable>> GetAllTablesAsync()
    {
        _logger.LogInformation("Retrieving all tables");
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Tables.ToListAsync();
    }

    public async Task<IEnumerable<EtlTable>> GetTablesByDatabaseIdAsync(int databaseId)
    {
        _logger.LogInformation("Retrieving tables for database ID: {DatabaseId}", databaseId);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Tables.Where(t => t.DatabaseId == databaseId).ToListAsync();
    }

    public async Task<EtlTable?> GetTableByIdAsync(int id)
    {
        _logger.LogInformation("Retrieving table with ID: {TableId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Tables.FindAsync(id);
    }

    public async Task<EtlTable?> GetTableByNameAsync(int databaseId, string name)
    {
        _logger.LogInformation("Retrieving table with name: {TableName} in database ID: {DatabaseId}", name, databaseId);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Tables.FirstOrDefaultAsync(t => t.DatabaseId == databaseId && t.Name == name);
    }

    public async Task<EtlTable> CreateTableAsync(EtlTable table)
    {
        _logger.LogInformation("Creating table with name: {TableName} in database ID: {DatabaseId}", table.Name, table.DatabaseId);
        
        using var context = _contextFactory.CreateDbContext();
        table.CreatedAt = DateTime.UtcNow;
        table.UpdatedAt = DateTime.UtcNow;
        
        context.Tables.Add(table);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully created table with ID: {TableId}", table.Id);
        return table;
    }

    public async Task<EtlTable> UpdateTableAsync(EtlTable table)
    {
        _logger.LogInformation("Updating table with ID: {TableId}", table.Id);
        
        using var context = _contextFactory.CreateDbContext();
        table.UpdatedAt = DateTime.UtcNow;
        
        context.Tables.Update(table);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully updated table with ID: {TableId}", table.Id);
        return table;
    }

    public async Task<bool> DeleteTableAsync(int id)
    {
        _logger.LogInformation("Deleting table with ID: {TableId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        var table = await context.Tables.FindAsync(id);
        if (table == null)
        {
            _logger.LogWarning("Table with ID: {TableId} not found for deletion", id);
            return false;
        }

        context.Tables.Remove(table);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully deleted table with ID: {TableId}", id);
        return true;
    }

    // Column operations
    public async Task<IEnumerable<EtlColumn>> GetAllColumnsAsync()
    {
        _logger.LogInformation("Retrieving all columns");
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Columns.ToListAsync();
    }

    public async Task<IEnumerable<EtlColumn>> GetColumnsByTableIdAsync(int tableId)
    {
        _logger.LogInformation("Retrieving columns for table ID: {TableId}", tableId);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Columns.Where(c => c.TableId == tableId).ToListAsync();
    }

    public async Task<EtlColumn?> GetColumnByIdAsync(int id)
    {
        _logger.LogInformation("Retrieving column with ID: {ColumnId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Columns.FindAsync(id);
    }

    public async Task<EtlColumn?> GetColumnByNameAsync(int tableId, string name)
    {
        _logger.LogInformation("Retrieving column with name: {ColumnName} in table ID: {TableId}", name, tableId);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.Columns.FirstOrDefaultAsync(c => c.TableId == tableId && c.Name == name);
    }

    public async Task<EtlColumn> CreateColumnAsync(EtlColumn column)
    {
        _logger.LogInformation("Creating column with name: {ColumnName} in table ID: {TableId}", column.Name, column.TableId);
        
        using var context = _contextFactory.CreateDbContext();
        column.CreatedAt = DateTime.UtcNow;
        
        context.Columns.Add(column);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully created column with ID: {ColumnId}", column.Id);
        return column;
    }

    public async Task<EtlColumn> UpdateColumnAsync(EtlColumn column)
    {
        _logger.LogInformation("Updating column with ID: {ColumnId}", column.Id);
        
        using var context = _contextFactory.CreateDbContext();
        context.Columns.Update(column);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully updated column with ID: {ColumnId}", column.Id);
        return column;
    }

    public async Task<bool> DeleteColumnAsync(int id)
    {
        _logger.LogInformation("Deleting column with ID: {ColumnId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        var column = await context.Columns.FindAsync(id);
        if (column == null)
        {
            _logger.LogWarning("Column with ID: {ColumnId} not found for deletion", id);
            return false;
        }

        context.Columns.Remove(column);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully deleted column with ID: {ColumnId}", id);
        return true;
    }

    // Task instance operations
    public async Task<IEnumerable<TaskInstance>> GetAllTaskInstancesAsync()
    {
        _logger.LogInformation("Retrieving all task instances");
        
        using var context = _contextFactory.CreateDbContext();
        return await context.TaskInstances.ToListAsync();
    }

    public async Task<IEnumerable<TaskInstance>> GetTaskInstancesByWorkflowIdAsync(string workflowId)
    {
        _logger.LogInformation("Retrieving task instances for workflow ID: {WorkflowId}", workflowId);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.TaskInstances.Where(ti => ti.WorkflowId == workflowId).ToListAsync();
    }

    public async Task<TaskInstance?> GetTaskInstanceByIdAsync(string id)
    {
        _logger.LogInformation("Retrieving task instance with ID: {TaskInstanceId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        return await context.TaskInstances.FindAsync(id);
    }

    public async Task<TaskInstance> CreateTaskInstanceAsync(TaskInstance taskInstance)
    {
        _logger.LogInformation("Creating task instance for task ID: {TaskId}", taskInstance.TaskId);
        
        using var context = _contextFactory.CreateDbContext();
        taskInstance.CreatedAt = DateTime.UtcNow;
        taskInstance.UpdatedAt = DateTime.UtcNow;
        
        context.TaskInstances.Add(taskInstance);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully created task instance with ID: {TaskInstanceId}", taskInstance.Id);
        return taskInstance;
    }

    public async Task<TaskInstance> UpdateTaskInstanceAsync(TaskInstance taskInstance)
    {
        _logger.LogInformation("Updating task instance with ID: {TaskInstanceId}", taskInstance.Id);
        
        using var context = _contextFactory.CreateDbContext();
        taskInstance.UpdatedAt = DateTime.UtcNow;
        
        context.TaskInstances.Update(taskInstance);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully updated task instance with ID: {TaskInstanceId}", taskInstance.Id);
        return taskInstance;
    }

    public async Task<bool> DeleteTaskInstanceAsync(string id)
    {
        _logger.LogInformation("Deleting task instance with ID: {TaskInstanceId}", id);
        
        using var context = _contextFactory.CreateDbContext();
        var taskInstance = await context.TaskInstances.FindAsync(id);
        if (taskInstance == null)
        {
            _logger.LogWarning("Task instance with ID: {TaskInstanceId} not found for deletion", id);
            return false;
        }

        context.TaskInstances.Remove(taskInstance);
        await context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully deleted task instance with ID: {TaskInstanceId}", id);
        return true;
    }
}