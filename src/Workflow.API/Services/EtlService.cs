using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Text.Json;

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
    private readonly string _connectionString;
    private readonly ILogger<EtlService> _logger;
    private readonly IDbContextFactory<EtlDbContext> _contextFactory;

    public EtlService(ILogger<EtlService> logger, IDbContextFactory<EtlDbContext> contextFactory)
    {
        _logger = logger;
        _contextFactory = contextFactory;
        _connectionString = "Server=(localdb)\\mssqllocaldb;Trusted_Connection=true;MultipleActiveResultSets=true";
    }

    private SqlConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
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

            // 清理数据库名称，防止SQL注入
            var safeDatabaseName = SanitizeDatabaseName(databaseName);

            using var connection = CreateConnection();
            await connection.OpenAsync();

            // 检查数据库是否已存在
            var checkDbCommand = new SqlCommand(
                "SELECT database_id FROM sys.databases WHERE name = @dbName", connection);
            checkDbCommand.Parameters.AddWithValue("@dbName", safeDatabaseName);

            var dbExists = await checkDbCommand.ExecuteScalarAsync() != null;
            if (dbExists)
            {
                _logger.LogInformation("Database {DatabaseName} already exists", safeDatabaseName);
                return safeDatabaseName;
            }

            // 创建数据库
            var createDbCommand = new SqlCommand(
                $"CREATE DATABASE [{safeDatabaseName}]", connection);
            await createDbCommand.ExecuteNonQueryAsync();

            _logger.LogInformation("Database {DatabaseName} created successfully", safeDatabaseName);
            return safeDatabaseName;
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
            if (string.IsNullOrWhiteSpace(databaseName))
            {
                return false;
            }

            var safeDatabaseName = SanitizeDatabaseName(databaseName);

            using var connection = CreateConnection();
            await connection.OpenAsync();

            // 检查数据库是否存在
            var checkDbCommand = new SqlCommand(
                "SELECT database_id FROM sys.databases WHERE name = @dbName", connection);
            checkDbCommand.Parameters.AddWithValue("@dbName", safeDatabaseName);

            var dbExists = await checkDbCommand.ExecuteScalarAsync() != null;
            if (!dbExists)
            {
                _logger.LogInformation("Database {DatabaseName} does not exist", safeDatabaseName);
                return false;
            }

            // 设置数据库为单用户模式并删除
            var dropDbCommand = new SqlCommand($@"
                ALTER DATABASE [{safeDatabaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                DROP DATABASE [{safeDatabaseName}];", connection);
            await dropDbCommand.ExecuteNonQueryAsync();

            _logger.LogInformation("Database {DatabaseName} dropped successfully", safeDatabaseName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to drop database {DatabaseName}", databaseName);
            return false;
        }
    }

    public IEnumerable<string> ListDatabases()
    {
        try
        {
            var databases = new List<string>();

            using var connection = CreateConnection();
            connection.Open();

            var command = new SqlCommand(@"
                SELECT name FROM sys.databases 
                WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')", connection);

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                databases.Add(reader["name"].ToString() ?? string.Empty);
            }

            return databases.Where(d => !string.IsNullOrEmpty(d));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list databases");
            throw new EtlExecutionException($"Failed to list databases: {ex.Message}", ex);
        }
    }

    public async Task<bool> CreateTableAsync(string databaseName, string tableName, IEnumerable<ColumnDefinition> columns)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Creating table {TableName} in database {DatabaseName} at {StartTime}",
            tableName, databaseName, startTime);

        try
        {
            if (string.IsNullOrWhiteSpace(databaseName) || string.IsNullOrWhiteSpace(tableName))
            {
                throw new ArgumentException("Database name and table name cannot be null or empty");
            }

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var safeTableName = SanitizeTableName(tableName);
            var columnList = columns.ToList();

            if (!columnList.Any())
            {
                throw new ArgumentException("Table must have at least one column");
            }

            using var connection = CreateConnection();
            await connection.OpenAsync();

            // 切换到指定数据库
            var useDbCommand = new SqlCommand($"USE [{safeDatabaseName}]", connection);
            await useDbCommand.ExecuteNonQueryAsync();

            // 检查表是否已存在
            var checkTableCommand = new SqlCommand(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName", connection);
            checkTableCommand.Parameters.AddWithValue("@tableName", safeTableName);

            var tableExists = await checkTableCommand.ExecuteScalarAsync() != null;
            if (tableExists)
            {
                _logger.LogInformation("Table {TableName} already exists in database {DatabaseName}",
                    safeTableName, safeDatabaseName);
                return false;
            }

            // 构建CREATE TABLE语句
            var columnDefinitions = columnList.Select(c =>
                $"[{c.Name}] {MapToSqlType(c.DataType)}" +
                (c.IsPrimaryKey ? " PRIMARY KEY" : "") +
                (c.IsNullable ? "" : " NOT NULL") +
                (c.DefaultValue != null ? $" DEFAULT {FormatDefaultValue(c.DefaultValue, c.DataType)}" : "")
            );

            var createTableSql = $"CREATE TABLE [{safeTableName}] ({string.Join(", ", columnDefinitions)})";
            var createTableCommand = new SqlCommand(createTableSql, connection);
            await createTableCommand.ExecuteNonQueryAsync();

            _logger.LogInformation("Table {TableName} created successfully in database {DatabaseName}",
                safeTableName, safeDatabaseName);
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
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Dropping table {TableName} from database {DatabaseName} at {StartTime}",
            tableName, databaseName, startTime);

        try
        {
            if (string.IsNullOrWhiteSpace(databaseName) || string.IsNullOrWhiteSpace(tableName))
            {
                return false;
            }

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var safeTableName = SanitizeTableName(tableName);

            using var connection = CreateConnection();
            await connection.OpenAsync();

            // 切换到指定数据库
            var useDbCommand = new SqlCommand($"USE [{safeDatabaseName}]", connection);
            await useDbCommand.ExecuteNonQueryAsync();

            // 检查表是否存在
            var checkTableCommand = new SqlCommand(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName", connection);
            checkTableCommand.Parameters.AddWithValue("@tableName", safeTableName);

            var tableExists = await checkTableCommand.ExecuteScalarAsync() != null;
            if (!tableExists)
            {
                _logger.LogInformation("Table {TableName} does not exist in database {DatabaseName}",
                    safeTableName, safeDatabaseName);
                return false;
            }

            // 删除表
            var dropTableCommand = new SqlCommand($"DROP TABLE [{safeTableName}]", connection);
            await dropTableCommand.ExecuteNonQueryAsync();

            _logger.LogInformation("Table {TableName} dropped successfully from database {DatabaseName}",
                safeTableName, safeDatabaseName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to drop table {TableName} from database {DatabaseName}", tableName, databaseName);
            return false;
        }
    }

    public async Task<IEnumerable<string>> ListTablesAsync(string databaseName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(databaseName))
            {
                throw new ArgumentException("Database name cannot be null or empty", nameof(databaseName));
            }

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var tables = new List<string>();

            using var connection = CreateConnection();
            await connection.OpenAsync();

            // 切换到指定数据库
            var useDbCommand = new SqlCommand($"USE [{safeDatabaseName}]", connection);
            await useDbCommand.ExecuteNonQueryAsync();

            var command = new SqlCommand(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'", connection);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tables.Add(reader["TABLE_NAME"].ToString() ?? string.Empty);
            }

            return tables.Where(t => !string.IsNullOrEmpty(t));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list tables in database {DatabaseName}", databaseName);
            throw new EtlExecutionException($"Failed to list tables in database {databaseName}: {ex.Message}", ex);
        }
    }

    public async Task<long> InsertDataAsync(string databaseName, string tableName, IEnumerable<Dictionary<string, object?>> data)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Inserting data into table {TableName} in database {DatabaseName} at {StartTime}",
            tableName, databaseName, startTime);

        try
        {
            if (string.IsNullOrWhiteSpace(databaseName) || string.IsNullOrWhiteSpace(tableName))
            {
                throw new ArgumentException("Database name and table name cannot be null or empty");
            }

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var safeTableName = SanitizeTableName(tableName);
            var dataList = data.ToList();

            if (!dataList.Any())
            {
                return 0;
            }

            using var connection = CreateConnection();
            await connection.OpenAsync();

            // 切换到指定数据库
            var useDbCommand = new SqlCommand($"USE [{safeDatabaseName}]", connection);
            await useDbCommand.ExecuteNonQueryAsync();

            // 获取表的列信息
            var columnsCommand = new SqlCommand(
                @"SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
                  FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_NAME = @tableName", connection);
            columnsCommand.Parameters.AddWithValue("@tableName", safeTableName);

            var columnInfo = new Dictionary<string, (string DataType, bool IsNullable)>();
            using (var reader = await columnsCommand.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    columnInfo[reader["COLUMN_NAME"].ToString() ?? ""] = (
                        reader["DATA_TYPE"].ToString() ?? "",
                        reader["IS_NULLABLE"].ToString() == "YES"
                    );
                }
            }

            if (!columnInfo.Any())
            {
                throw new EtlExecutionException($"Table {safeTableName} not found or has no columns");
            }

            // 构建INSERT语句
            var firstRow = dataList.First();
            var columns = firstRow.Keys.Where(k => columnInfo.ContainsKey(k)).ToList();
            var insertSql = $"INSERT INTO [{safeTableName}] ([{string.Join("], [", columns)}]) VALUES ";

            var rowsAffected = 0L;

            // 批量插入数据
            foreach (var row in dataList)
            {
                var values = columns.Select(column =>
                {
                    var value = row.ContainsKey(column) ? row[column] : null;
                    return FormatValueForSql(value, columnInfo[column].DataType);
                });

                var insertRowSql = $"{insertSql}({string.Join(", ", values)})";
                var insertCommand = new SqlCommand(insertRowSql, connection);
                rowsAffected += await insertCommand.ExecuteNonQueryAsync();
            }

            _logger.LogInformation("Inserted {RowsAffected} rows into table {TableName} in database {DatabaseName}",
                rowsAffected, safeTableName, safeDatabaseName);
            return rowsAffected;
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
            if (string.IsNullOrWhiteSpace(databaseName) || string.IsNullOrWhiteSpace(tableName))
            {
                throw new ArgumentException("Database name and table name cannot be null or empty");
            }

            var safeDatabaseName = SanitizeDatabaseName(databaseName);
            var safeTableName = SanitizeTableName(tableName);

            using var connection = CreateConnection();
            await connection.OpenAsync();

            // 切换到指定数据库
            var useDbCommand = new SqlCommand($"USE [{safeDatabaseName}]", connection);
            await useDbCommand.ExecuteNonQueryAsync();

            // 查询数据
            var selectSql = $"SELECT TOP {limit} * FROM [{safeTableName}]";
            var command = new SqlCommand(selectSql, connection);

            var results = new List<Dictionary<string, object?>>();
            using var reader = await command.ExecuteReaderAsync();
            var columns = Enumerable.Range(0, reader.FieldCount)
                .Select(i => reader.GetName(i))
                .ToArray();

            while (await reader.ReadAsync())
            {
                var row = new Dictionary<string, object?>();
                for (int i = 0; i < columns.Length; i++)
                {
                    row[columns[i]] = await reader.IsDBNullAsync(i) ? null : reader[i];
                }
                results.Add(row);
            }

            return results;
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
            Success = true,
            StartTime = DateTime.UtcNow
        };

        string databaseName = "";
        try
        {
            _logger.LogInformation("Starting ETL workflow execution for workflow {WorkflowId}", workflow.Id);

            // 创建临时数据库用于ETL过程
            databaseName = $"etl_temp_{Guid.NewGuid():N}";
            await CreateDatabaseAsync(databaseName);

            // 遍历工作流节点并执行
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
                            stepResult = await ExecuteExtractStep(node, databaseName);
                            break;
                        case "transform":
                            // Handle transform node
                            stepResult.Success = true;
                            stepResult.Message = "Transform step completed";
                            break;
                        case "validate":
                            // Handle validate node
                            stepResult = await ExecuteValidateStep(node, databaseName);
                            break;
                        case "load":
                            // Handle load node
                            stepResult = await ExecuteLoadStep(node, databaseName);
                            break;
                        case "start":
                        case "end":
                            stepResult.Success = true;
                            stepResult.Message = $"{node.Type} step completed";
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

            executionResult.Message = executionResult.Success ?
                "Workflow executed successfully" :
                "Workflow execution completed with errors";
        }
        catch (Exception ex)
        {
            executionResult.Success = false;
            executionResult.Message = $"Workflow execution failed: {ex.Message}";
            _logger.LogError(ex, "ETL workflow {WorkflowId} failed", workflow.Id);
        }
        finally
        {
            // Clean up the temporary database
            try
            {
                if (!string.IsNullOrEmpty(databaseName))
                {
                    await DropDatabaseAsync(databaseName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clean up temporary database {DatabaseName}", databaseName);
            }

            executionResult.EndTime = DateTime.UtcNow;
        }

        return executionResult;
    }

    // Helper methods
    private string SanitizeDatabaseName(string databaseName)
    {
        // Remove or replace characters that are not safe for database names
        var invalidChars = new[] { '\\', '/', ':', '*', '?', '"', '<', '>', '|', '.' };
        var sanitizedName = string.Join("_", databaseName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        return string.IsNullOrWhiteSpace(sanitizedName) ? "default" : sanitizedName;
    }

    private string SanitizeTableName(string tableName)
    {
        // Remove or replace characters that are not safe for table names
        var invalidChars = new[] { '\\', '/', ':', '*', '?', '"', '<', '>', '|', '.' };
        var sanitizedName = string.Join("_", tableName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        return string.IsNullOrWhiteSpace(sanitizedName) ? "default_table" : sanitizedName;
    }

    private string MapToSqlType(string dataType)
    {
        return dataType.ToUpperInvariant() switch
        {
            "STRING" or "TEXT" => "NVARCHAR(MAX)",
            "INT" or "INTEGER" => "INT",
            "LONG" => "BIGINT",
            "DOUBLE" or "FLOAT" => "FLOAT",
            "DECIMAL" => "DECIMAL(18,2)",
            "BOOLEAN" or "BOOL" => "BIT",
            "DATETIME" or "DATE" => "DATETIME2",
            "BLOB" => "VARBINARY(MAX)",
            _ => "NVARCHAR(MAX)"
        };
    }

    private string FormatDefaultValue(object? defaultValue, string dataType)
    {
        if (defaultValue == null)
            return "NULL";

        return dataType.ToUpperInvariant() switch
        {
            "STRING" or "TEXT" => $"'{defaultValue.ToString()?.Replace("'", "''")}'",
            "BOOLEAN" or "BOOL" => (bool)defaultValue ? "1" : "0",
            "DATETIME" or "DATE" => $"'{((DateTime)defaultValue):yyyy-MM-dd HH:mm:ss}'",
            _ => defaultValue.ToString() ?? "NULL"
        };
    }

    private string FormatValueForSql(object? value, string dataType)
    {
        if (value == null)
            return "NULL";

        return dataType.ToUpperInvariant() switch
        {
            "NVARCHAR" or "VARCHAR" or "CHAR" or "NCHAR" or "TEXT" or "NTEXT" =>
                $"'{value.ToString()?.Replace("'", "''")}'",
            "BIT" => (bool)value ? "1" : "0",
            "DATETIME" or "DATETIME2" => $"'{((DateTime)value):yyyy-MM-dd HH:mm:ss}'",
            _ => value.ToString() ?? "NULL"
        };
    }

    private async Task<EtlStepResult> ExecuteExtractStep(WorkflowNode node, string databaseName)
    {
        var stepResult = new EtlStepResult
        {
            StepName = node.Data.Label,
            StepType = node.Type,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // 获取源文件路径
            var sourcePath = node.Data.TaskParams?.ContainsKey("sourcePath") == true
                ? node.Data.TaskParams["sourcePath"]?.ToString()
                : "data/sample.json";

            // 确保路径是相对于应用程序根目录的
            if (!Path.IsPathRooted(sourcePath))
            {
                sourcePath = Path.Combine(AppContext.BaseDirectory, sourcePath);
            }

            // 检查文件是否存在
            if (!File.Exists(sourcePath))
            {
                throw new FileNotFoundException($"Source file not found: {sourcePath}");
            }

            // 读取JSON文件
            var jsonContent = await File.ReadAllTextAsync(sourcePath);
            var data = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(jsonContent);

            if (data == null || !data.Any())
            {
                throw new InvalidOperationException("No data found in source file");
            }

            // 创建表结构 (基于第一行数据的键)
            var columns = data.First().Keys.Select(key => new ColumnDefinition
            {
                Name = key,
                DataType = "STRING", // 简化处理，所有字段都设为字符串类型
                IsNullable = true
            }).ToList();

            // 创建表
            var tableName = "extracted_data";
            await CreateTableAsync(databaseName, tableName, columns);

            // 插入数据
            var rowsAffected = await InsertDataAsync(databaseName, tableName, data);

            stepResult.Success = true;
            stepResult.Message = $"Extracted {data.Count} records, inserted {rowsAffected} rows";
            stepResult.RowsAffected = (int)rowsAffected;
            stepResult.Details = new Dictionary<string, object?>
            {
                ["source_file"] = sourcePath,
                ["table_name"] = tableName,
                ["records_count"] = data.Count
            };
        }
        catch (Exception ex)
        {
            stepResult.Success = false;
            stepResult.Message = $"Extract step failed: {ex.Message}";
            _logger.LogError(ex, "Extract step failed");
        }
        finally
        {
            stepResult.EndTime = DateTime.UtcNow;
        }

        return stepResult;
    }

    private async Task<EtlStepResult> ExecuteValidateStep(WorkflowNode node, string databaseName)
    {
        var stepResult = new EtlStepResult
        {
            StepName = node.Data.Label,
            StepType = node.Type,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // 获取数据进行验证
            var tableName = "extracted_data";
            var data = await SelectDataAsync(databaseName, tableName);
            var dataList = data.ToList();

            var validationErrors = new List<string>();
            var validRecords = 0;

            // 执行验证规则
            foreach (var record in dataList)
            {
                var isValid = true;

                // 检查必需字段
                if (record.ContainsKey("id") && (record["id"] == null || string.IsNullOrWhiteSpace(record["id"].ToString())))
                {
                    validationErrors.Add($"Record missing required 'id' field");
                    isValid = false;
                }

                if (record.ContainsKey("name") && (record["name"] == null || string.IsNullOrWhiteSpace(record["name"].ToString())))
                {
                    validationErrors.Add($"Record with id '{record["id"]}' missing required 'name' field");
                    isValid = false;
                }

                if (record.ContainsKey("email") && (record["email"] == null || string.IsNullOrWhiteSpace(record["email"].ToString())))
                {
                    validationErrors.Add($"Record with id '{record["id"]}' missing required 'email' field");
                    isValid = false;
                }

                // 验证邮箱格式 (简单验证)
                if (record.ContainsKey("email") && record["email"] != null)
                {
                    var email = record["email"].ToString();
                    if (!string.IsNullOrWhiteSpace(email) && !email.Contains("@"))
                    {
                        validationErrors.Add($"Record with id '{record["id"]}' has invalid email format: {email}");
                        isValid = false;
                    }
                }

                // 验证年龄字段 (如果存在)
                if (record.ContainsKey("age") && record["age"] != null)
                {
                    if (!int.TryParse(record["age"].ToString(), out var age) || age < 0 || age > 150)
                    {
                        validationErrors.Add($"Record with id '{record["id"]}' has invalid age: {record["age"]}");
                        isValid = false;
                    }
                }

                if (isValid)
                {
                    validRecords++;
                }
            }

            stepResult.Success = validationErrors.Count == 0;
            stepResult.Message = validationErrors.Count == 0
                ? $"Validation passed: {validRecords} valid records"
                : $"Validation failed with {validationErrors.Count} errors";
            stepResult.RowsAffected = validRecords;
            stepResult.Details = new Dictionary<string, object?>
            {
                ["total_records"] = dataList.Count,
                ["valid_records"] = validRecords,
                ["invalid_records"] = dataList.Count - validRecords,
                ["errors"] = validationErrors.Take(10).ToList() // 只显示前10个错误
            };
        }
        catch (Exception ex)
        {
            stepResult.Success = false;
            stepResult.Message = $"Validation step failed: {ex.Message}";
            _logger.LogError(ex, "Validate step failed");
        }
        finally
        {
            stepResult.EndTime = DateTime.UtcNow;
        }

        return stepResult;
    }

    private async Task<EtlStepResult> ExecuteLoadStep(WorkflowNode node, string databaseName)
    {
        var stepResult = new EtlStepResult
        {
            StepName = node.Data.Label,
            StepType = node.Type,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // 获取目标表名
            var targetTable = node.Data.TaskParams?.ContainsKey("targetTable") == true
                ? node.Data.TaskParams["targetTable"]?.ToString()
                : "users";

            // 从临时表中获取数据
            var sourceTable = "extracted_data";
            var data = await SelectDataAsync(databaseName, sourceTable);
            var dataList = data.ToList();

            if (!dataList.Any())
            {
                throw new InvalidOperationException("No data to load");
            }

            // 创建目标表结构
            var columns = dataList.First().Keys.Select(key => new ColumnDefinition
            {
                Name = key,
                DataType = "STRING", // 简化处理
                IsNullable = true
            }).ToList();

            // 创建目标表
            await CreateTableAsync(databaseName, targetTable, columns);

            // 加载数据
            var rowsAffected = await InsertDataAsync(databaseName, targetTable, dataList);

            stepResult.Success = true;
            stepResult.Message = $"Loaded {rowsAffected} rows into table '{targetTable}'";
            stepResult.RowsAffected = (int)rowsAffected;
            stepResult.Details = new Dictionary<string, object?>
            {
                ["target_table"] = targetTable,
                ["records_count"] = dataList.Count,
                ["rows_affected"] = rowsAffected
            };
        }
        catch (Exception ex)
        {
            stepResult.Success = false;
            stepResult.Message = $"Load step failed: {ex.Message}";
            _logger.LogError(ex, "Load step failed");
        }
        finally
        {
            stepResult.EndTime = DateTime.UtcNow;
        }

        return stepResult;
    }
}
// 用于直接操作数据库文件的上下文
public class EtlDatabaseContext : DbContext
{
    public EtlDatabaseContext(DbContextOptions<EtlDatabaseContext> options) : base(options)
    {
    }
}