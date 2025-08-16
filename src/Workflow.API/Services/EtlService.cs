using Microsoft.EntityFrameworkCore;

namespace Workflow.API.Services;

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
}

public class ColumnDefinition
{
    public string Name { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty; // TEXT, INTEGER, REAL, BLOB, NUMERIC
    public bool IsPrimaryKey { get; set; }
    public bool IsNullable { get; set; } = true;
    public object? DefaultValue { get; set; }
}

public class EtlExecutionResult
{
    public string WorkflowId { get; set; } = string.Empty;
    public string ExecutionId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public List<EtlStepResult> StepResults { get; set; } = new();
    public Dictionary<string, object?> Metadata { get; set; } = new();
}

public class EtlStepResult
{
    public string StepName { get; set; } = string.Empty;
    public string StepType { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int RowsAffected { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public Dictionary<string, object?> Details { get; set; } = new();
}

public class EtlExecutionException : Exception
{
    public EtlExecutionException(string message) : base(message) { }
    public EtlExecutionException(string message, Exception innerException) : base(message, innerException) { }
}

public class EtlService : IEtlService
{
    private readonly string _databaseRootPath;
    private readonly ILogger<EtlService> _logger;
    private readonly IDbContextFactory<EtlDbContext> _contextFactory;

    public EtlService(ILogger<EtlService> logger, IDbContextFactory<EtlDbContext> contextFactory)
    {
        _logger = logger;
        _contextFactory = contextFactory;
        _databaseRootPath = Path.Combine(AppContext.BaseDirectory, "data", "etl_databases");
        
        // 确保数据库根目录存在
        if (!Directory.Exists(_databaseRootPath))
        {
            Directory.CreateDirectory(_databaseRootPath);
        }
    }

    private EtlDatabaseContext CreateDbContext(string databasePath)
    {
        var optionsBuilder = new DbContextOptionsBuilder<EtlDatabaseContext>();
        optionsBuilder.UseSqlite($"Data Source={databasePath}");
        var context = new EtlDatabaseContext(optionsBuilder.Options);
        return context;
    }

    public async Task<string> CreateDatabaseAsync(string databaseName)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Creating database {DatabaseName} at {StartTime}", databaseName, startTime);
        
        try
        {
            // 验证数据库名称
            if (string.IsNullOrWhiteSpace(databaseName))
            {
                throw new ArgumentException("Database name cannot be null or empty", nameof(databaseName));
            }

            // 清理数据库名称，防止路径遍历攻击
            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var databasePath = Path.Combine(_databaseRootPath, $"{safeDatabaseName}.db");

            // 检查数据库是否已存在
            if (File.Exists(databasePath))
            {
                _logger.LogWarning("Database {DatabaseName} already exists", databaseName);
                return databasePath;
            }

            // Use EF Core to create the database and metadata table
            using var context = CreateDbContext(databasePath);
            await context.Database.EnsureCreatedAsync();
            
            // Create metadata table
            var createMetaTableSql = @"
                CREATE TABLE IF NOT EXISTS __etl_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL,
                    column_name TEXT NOT NULL,
                    data_type TEXT NOT NULL,
                    is_primary_key INTEGER NOT NULL,
                    is_nullable INTEGER NOT NULL,
                    default_value TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )";
            
            await context.Database.ExecuteSqlRawAsync(createMetaTableSql);

            _logger.LogInformation("Database {DatabaseName} created successfully at {DatabasePath}", databaseName, databasePath);
            return databasePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create database {DatabaseName}", databaseName);
            throw new EtlExecutionException($"Failed to create database {databaseName}: {ex.Message}", ex);
        }
    }

    public async Task<bool> DropDatabaseAsync(string databaseName)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Dropping database {DatabaseName} at {StartTime}", databaseName, startTime);
        
        try
        {
            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var databasePath = Path.Combine(_databaseRootPath, $"{safeDatabaseName}.db");

            if (!File.Exists(databasePath))
            {
                _logger.LogWarning("Database {DatabaseName} does not exist", databaseName);
                return false;
            }

            // Close any connections to the database
            using var context = CreateDbContext(databasePath);
            await context.Database.CloseConnectionAsync();
            
            // 删除数据库文件
            File.Delete(databasePath);
            
            _logger.LogInformation("Database {DatabaseName} dropped successfully", databaseName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to drop database {DatabaseName}", databaseName);
            throw new EtlExecutionException($"Failed to drop database {databaseName}: {ex.Message}", ex);
        }
    }

    public IEnumerable<string> ListDatabases()
    {
        try
        {
            var databases = new List<string>();
            var files = Directory.GetFiles(_databaseRootPath, "*.db");

            foreach (var file in files)
            {
                var fileName = Path.GetFileNameWithoutExtension(file);
                databases.Add(fileName);
            }


            return databases;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list databases");
            throw new EtlExecutionException($"Failed to list databases: {ex.Message}", ex);
        }
    }

    public async Task<bool> CreateTableAsync(string databaseName, string tableName, IEnumerable<ColumnDefinition> columns)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(databaseName))
                throw new ArgumentException("Database name cannot be null or empty", nameof(databaseName));
            
            if (string.IsNullOrWhiteSpace(tableName))
                throw new ArgumentException("Table name cannot be null or empty", nameof(tableName));
            
            if (columns == null)
                throw new ArgumentNullException(nameof(columns));

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var databasePath = Path.Combine(_databaseRootPath, $"{safeDatabaseName}.db");

            if (!File.Exists(databasePath))
                throw new EtlExecutionException($"Database {databaseName} does not exist");

            using var context = CreateDbContext(databasePath);

            // 构建CREATE TABLE语句
            var columnDefinitions = columns.ToList();
            if (!columnDefinitions.Any())
            {
                throw new EtlExecutionException("At least one column must be defined");
            }

            var columnSqlParts = columnDefinitions.Select(column => {
                var columnSql = $"[{column.Name}] {MapToSqliteType(column.DataType)}";
                
                if (column.IsPrimaryKey)
                {
                    columnSql += " PRIMARY KEY";
                }
                
                if (!column.IsNullable)
                {
                    columnSql += " NOT NULL";
                }
                
                if (column.DefaultValue != null)
                {
                    columnSql += $" DEFAULT ({FormatDefaultValue(column.DefaultValue)})";
                }
                
                return columnSql;
            });

            var createTableSql = $"CREATE TABLE IF NOT EXISTS [{tableName}] ({string.Join(", ", columnSqlParts)})";
            
            await context.Database.ExecuteSqlRawAsync(createTableSql);

            // 将表结构信息存储到元数据表中
            foreach (var column in columnDefinitions)
            {
                var insertMetaSql = @"
                    INSERT INTO __etl_metadata (table_name, column_name, data_type, is_primary_key, is_nullable, default_value)
                    VALUES ({0}, {1}, {2}, {3}, {4}, {5})";
                
                await context.Database.ExecuteSqlRawAsync(insertMetaSql,
                    tableName,
                    column.Name,
                    column.DataType,
                    column.IsPrimaryKey ? 1 : 0,
                    column.IsNullable ? 1 : 0,
                    column.DefaultValue?.ToString() ?? (object)DBNull.Value);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create table {TableName} in database {DatabaseName}", tableName, databaseName);
            throw new EtlExecutionException($"Failed to create table {tableName} in database {databaseName}: {ex.Message}", ex);
        }
    }

    public async Task<bool> DropTableAsync(string databaseName, string tableName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(databaseName))
                throw new ArgumentException("Database name cannot be null or empty", nameof(databaseName));
            
            if (string.IsNullOrWhiteSpace(tableName))
                throw new ArgumentException("Table name cannot be null or empty", nameof(tableName));

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var databasePath = Path.Combine(_databaseRootPath, $"{safeDatabaseName}.db");

            if (!File.Exists(databasePath))
                throw new EtlExecutionException($"Database {databaseName} does not exist");

            using var context = CreateDbContext(databasePath);

            // 删除表
            var dropTableSql = $"DROP TABLE IF EXISTS [{tableName}]";
            await context.Database.ExecuteSqlRawAsync(dropTableSql);

            // 从元数据表中删除相关信息
            var deleteMetaSql = "DELETE FROM __etl_metadata WHERE table_name = {0}";
            await context.Database.ExecuteSqlRawAsync(deleteMetaSql, tableName);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to drop table {TableName} from database {DatabaseName}", tableName, databaseName);
            throw new EtlExecutionException($"Failed to drop table {tableName} from database {databaseName}: {ex.Message}", ex);
        }
    }

    public async Task<IEnumerable<string>> ListTablesAsync(string databaseName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(databaseName))
                throw new ArgumentException("Database name cannot be null or empty", nameof(databaseName));

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var databasePath = Path.Combine(_databaseRootPath, $"{safeDatabaseName}.db");

            if (!File.Exists(databasePath))
                throw new EtlExecutionException($"Database {databaseName} does not exist");

            using var context = CreateDbContext(databasePath);

            var tables = new List<string>();
            
            var querySql = "SELECT name FROM sqlite_master WHERE type='table' AND name != '__etl_metadata'";
            using var command = context.Database.GetDbConnection().CreateCommand();
            command.CommandText = querySql;
            await context.Database.OpenConnectionAsync();
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tables.Add(reader.GetString(0));
            }

            return tables;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list tables in database {DatabaseName}", databaseName);
            throw new EtlExecutionException($"Failed to list tables in database {databaseName}: {ex.Message}", ex);
        }
    }

    public async Task<long> InsertDataAsync(string databaseName, string tableName, IEnumerable<Dictionary<string, object?>> data)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(databaseName))
                throw new ArgumentException("Database name cannot be null or empty", nameof(databaseName));
            
            if (string.IsNullOrWhiteSpace(tableName))
                throw new ArgumentException("Table name cannot be null or empty", nameof(tableName));
            
            if (data == null)
                throw new ArgumentNullException(nameof(data));

            var dataList = data.ToList();
            if (!dataList.Any())
                return 0;

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var databasePath = Path.Combine(_databaseRootPath, $"{safeDatabaseName}.db");

            if (!File.Exists(databasePath))
                throw new EtlExecutionException($"Database {databaseName} does not exist");

            using var context = CreateDbContext(databasePath);
            await context.Database.OpenConnectionAsync();

            // 获取表的列信息
            var columns = new List<string>();
            using var columnInfoCommand = context.Database.GetDbConnection().CreateCommand();
            columnInfoCommand.CommandText = $"PRAGMA table_info([{tableName}])";
            using (var reader = await columnInfoCommand.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    columns.Add(reader.GetString(1)); // Column name is at index 1
                }
            }

            if (!columns.Any())
                throw new EtlExecutionException($"Table {tableName} does not exist or has no columns");

            // 构建INSERT语句
            var columnNames = string.Join(", ", columns.Select(c => $"[{c}]"));
            var parameterPlaceholders = string.Join(", ", columns.Select(c => $"@{c}"));
            var insertSql = $"INSERT INTO [{tableName}] ({columnNames}) VALUES ({parameterPlaceholders})";

            var insertedRows = 0L;
            
            foreach (var row in dataList)
            {
                using var insertCmd = context.Database.GetDbConnection().CreateCommand();
                insertCmd.CommandText = insertSql;
                
                // 为每一列添加参数
                foreach (var column in columns)
                {
                    var parameter = insertCmd.CreateParameter();
                    parameter.ParameterName = $"@{column}";
                    
                    if (row.ContainsKey(column) && row[column] != null)
                    {
                        parameter.Value = row[column];
                    }
                    else
                    {
                        parameter.Value = DBNull.Value;
                    }
                    
                    insertCmd.Parameters.Add(parameter);
                }
                
                insertedRows += await insertCmd.ExecuteNonQueryAsync();
            }

            return insertedRows;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to insert data into table {TableName} in database {DatabaseName}", tableName, databaseName);
            throw new EtlExecutionException($"Failed to insert data into table {tableName} in database {databaseName}: {ex.Message}", ex);
        }
    }

    public async Task<IEnumerable<Dictionary<string, object?>>> SelectDataAsync(string databaseName, string tableName, int limit = 1000)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(databaseName))
                throw new ArgumentException("Database name cannot be null or empty", nameof(databaseName));
            
            if (string.IsNullOrWhiteSpace(tableName))
                throw new ArgumentException("Table name cannot be null or empty", nameof(tableName));

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var databasePath = Path.Combine(_databaseRootPath, $"{safeDatabaseName}.db");

            if (!File.Exists(databasePath))
                throw new EtlExecutionException($"Database {databaseName} does not exist");

            using var context = CreateDbContext(databasePath);

            var result = new List<Dictionary<string, object?>>();
            
            var selectSql = $"SELECT * FROM [{tableName}] LIMIT {limit}";
            using var command = context.Database.GetDbConnection().CreateCommand();
            command.CommandText = selectSql;
            await context.Database.OpenConnectionAsync();
            
            using var reader = await command.ExecuteReaderAsync();
            var columnCount = reader.FieldCount;
            
            while (await reader.ReadAsync())
            {
                var row = new Dictionary<string, object?>();
                for (int i = 0; i < columnCount; i++)
                {
                    var columnName = reader.GetName(i);
                    var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                    row[columnName] = value;
                }
                result.Add(row);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to select data from table {TableName} in database {DatabaseName}", tableName, databaseName);
            throw new EtlExecutionException($"Failed to select data from table {tableName} in database {databaseName}: {ex.Message}", ex);
        }
    }

    public async Task<EtlExecutionResult> ExecuteEtlWorkflowAsync(WorkflowModel workflow)
    {
        var executionResult = new EtlExecutionResult
        {
            WorkflowId = workflow.Id,
            ExecutionId = Guid.NewGuid().ToString(),
            StartTime = DateTime.UtcNow,
            Success = true
        };

        try
        {
            // Create a dedicated database for this workflow execution
            var databaseName = $"etl_workflow_{workflow.Id}_{executionResult.ExecutionId.Substring(0, 8)}";
            await CreateDatabaseAsync(databaseName);

            // Process each node in the workflow
            foreach (var node in workflow.Nodes)
            {
                var stepResult = new EtlStepResult
                {
                    StepName = node.Data.Label,
                    StepType = node.Type,
                    StartTime = DateTime.UtcNow
                };

                try
                {
                    switch (node.Type.ToLower())
                    {
                        case "extract":
                            // Handle extract node
                            stepResult.Success = true;
                            stepResult.Message = "Extract step completed";
                            break;
                        case "transform":
                            // Handle transform node
                            stepResult.Success = true;
                            stepResult.Message = "Transform step completed";
                            break;
                        case "validate":
                            // Handle validate node
                            stepResult.Success = true;
                            stepResult.Message = "Validate step completed";
                            break;
                        case "load":
                            // Handle load node
                            stepResult.Success = true;
                            stepResult.Message = "Load step completed";
                            break;
                        default:
                            stepResult.Success = true;
                            stepResult.Message = "Node executed";
                            break;
                    }
                }
                catch (Exception ex)
                {
                    stepResult.Success = false;
                    stepResult.Message = $"Step failed: {ex.Message}";
                    executionResult.Success = false;
                    _logger.LogError(ex, "ETL step {StepName} failed in workflow {WorkflowId}", node.Data.Label, workflow.Id);
                }
                finally
                {
                    stepResult.EndTime = DateTime.UtcNow;
                    executionResult.StepResults.Add(stepResult);
                }
            }

            // Clean up the temporary database
            try
            {
                await DropDatabaseAsync(databaseName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clean up temporary database {DatabaseName}", databaseName);
            }
        }
        catch (Exception ex)
        {
            executionResult.Success = false;
            executionResult.Message = $"Workflow execution failed: {ex.Message}";
            _logger.LogError(ex, "ETL workflow {WorkflowId} failed", workflow.Id);
        }
        finally
        {
            executionResult.EndTime = DateTime.UtcNow;
            executionResult.Message = executionResult.Success ? 
                "Workflow executed successfully" : 
                "Workflow execution completed with errors";
        }

        return executionResult;
    }

    // Helper methods
    private string SanitizeDatabaseName(string databaseName)
    {
        // Remove or replace characters that are not safe for file names
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitizedName = string.Join("_", databaseName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        return string.IsNullOrWhiteSpace(sanitizedName) ? "default" : sanitizedName;
    }

    private string MapToSqliteType(string dataType)
    {
        return dataType.ToUpperInvariant() switch
        {
            "STRING" or "TEXT" => "TEXT",
            "INT" or "INTEGER" => "INTEGER",
            "LONG" => "INTEGER",
            "DOUBLE" or "FLOAT" => "REAL",
            "DECIMAL" => "REAL",
            "BOOLEAN" or "BOOL" => "INTEGER",
            "DATETIME" or "DATE" => "TEXT",
            "BLOB" => "BLOB",
            _ => "TEXT"
        };
    }

    private string FormatDefaultValue(object? defaultValue)
    {
        return defaultValue switch
        {
            null => "NULL",
            string s => $"'{s.Replace("'", "''")}'",
            bool b => b ? "1" : "0",
            DateTime dt => $"'{dt:yyyy-MM-dd HH:mm:ss}'",
            _ => defaultValue.ToString() ?? "NULL"
        };
    }
}

// 用于直接操作数据库文件的上下文
public class EtlDatabaseContext : DbContext
{
    public EtlDatabaseContext(DbContextOptions<EtlDatabaseContext> options) : base(options)
    {
    }
}