using System.Text.Json;

namespace Workflow.API.Services;

public class NodeExecutor : INodeExecutor
{
    // 内存数据库存储提取的数据
    private static readonly Dictionary<string, List<Dictionary<string, object>>> _inMemoryDb = new();
    
    public async Task<object?> ExecuteNodeAsync(string nodeType, object? inputData)
    {
        return (nodeType?.ToLower() ?? string.Empty) switch
        {
            "start" => await ExecuteStartNodeAsync(inputData),
            "end" => await ExecuteEndNodeAsync(inputData),
            "task" or "dummy" => await ExecuteTaskNodeAsync(inputData),
            "decision" or "branch" => await ExecuteDecisionNodeAsync(inputData),
            "bash" => await ExecuteBashNodeAsync(inputData),
            "python" => await ExecutePythonNodeAsync(inputData),
            "email" => await ExecuteEmailNodeAsync(inputData),
            "http" => await ExecuteHttpNodeAsync(inputData),
            "sql" => await ExecuteSqlNodeAsync(inputData),
            "subdag" => await ExecuteSubDagNodeAsync(inputData),
            "sensor" => await ExecuteSensorNodeAsync(inputData),
            "custom" => await ExecuteCustomNodeAsync(inputData),
            // ETL节点类型
            "extract" => await ExecuteExtractNodeAsync(inputData),
            "validate" => await ExecuteValidateNodeAsync(inputData),
            "load" => await ExecuteLoadNodeAsync(inputData),
            _ => await ExecuteTaskNodeAsync(inputData) // 默认执行任务节点
        };
    }

    private async Task<object> ExecuteStartNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var startData = new
        {
            workflowStarted = true,
            startTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "start",
            nodeType = "start",
            message = "Workflow started"
        };
        
        return startData;
    }

    private async Task<object> ExecuteTaskNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var taskData = new
        {
            taskId = Guid.NewGuid().ToString(),
            taskExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "task",
            nodeType = "task",
            message = "Task executed"
        };
        
        return taskData;
    }

    private async Task<object> ExecuteDecisionNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        // 简单的决策逻辑 - 检查输入数据中的某个值
        bool decisionResult = false;
        
        if (inputData != null)
        {
            try
            {
                string inputJson = JsonSerializer.Serialize(inputData);
                using var doc = JsonDocument.Parse(inputJson);
                
                // 尝试从输入数据中获取决策条件
                if (doc.RootElement.TryGetProperty("value", out JsonElement valueElement))
                {
                    if (valueElement.ValueKind == JsonValueKind.Number)
                    {
                        decisionResult = valueElement.GetDouble() > 5;
                    }
                }
            }
            catch
            {
                // 如果解析失败，默认为false
                decisionResult = false;
            }
        }
        
        var decisionData = new
        {
            decisionMade = true,
            decisionResult = decisionResult,
            decisionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "decision",
            nodeType = "decision",
            message = $"Decision evaluated as {decisionResult}"
        };
        
        return decisionData;
    }

    private async Task<object> ExecuteEndNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var endData = new
        {
            workflowEnded = true,
            endTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "end",
            nodeType = "end",
            message = "Workflow completed"
        };
        
        return endData;
    }

    private async Task<object> ExecuteBashNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var bashData = new
        {
            bashExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "bash",
            nodeType = "bash",
            message = "Bash command executed",
            output = "Bash command output"
        };
        
        return bashData;
    }

    private async Task<object> ExecutePythonNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var pythonData = new
        {
            scriptExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "python",
            nodeType = "python",
            message = "Python script executed",
            output = "Python script output"
        };
        
        return pythonData;
    }

    private async Task<object> ExecuteEmailNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var emailData = new
        {
            emailSent = true,
            sendTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "email",
            nodeType = "email",
            message = "Email sent successfully",
            recipient = "user@example.com"
        };
        
        return emailData;
    }

    private async Task<object> ExecuteHttpNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var httpData = new
        {
            requestExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "http",
            nodeType = "http",
            message = "HTTP request executed",
            statusCode = 200
        };
        
        return httpData;
    }

    private async Task<object> ExecuteSqlNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var sqlData = new
        {
            queryExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "sql",
            nodeType = "sql",
            message = "SQL query executed",
            rowsAffected = 10
        };
        
        return sqlData;
    }

    private async Task<object> ExecuteSubDagNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var subDagData = new
        {
            subDagExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "subdag",
            nodeType = "subdag",
            message = "SubDAG executed"
        };
        
        return subDagData;
    }

    private async Task<object> ExecuteSensorNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var sensorData = new
        {
            sensorTriggered = true,
            triggerTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "sensor",
            nodeType = "sensor",
            message = "Sensor condition met"
        };
        
        return sensorData;
    }

    private async Task<object> ExecuteCustomNodeAsync(object? inputData)
    {
        // 模拟异步操作
        await Task.Delay(100);
        
        var customData = new
        {
            customExecuted = true,
            executionTime = DateTime.UtcNow,
            inputData = inputData,
            nodeId = "custom",
            nodeType = "custom",
            message = "Custom node executed"
        };
        
        return customData;
    }

    private async Task<object> ExecuteExtractNodeAsync(object? inputData)
    {
        // 模拟文件提取操作
        await Task.Delay(500); // 模拟IO操作延迟
        
        // 从输入数据中获取文件路径
        string filePath = "sample_data.json";
        if (inputData is JsonElement jsonElement && jsonElement.TryGetProperty("filePath", out JsonElement filePathElement))
        {
            filePath = filePathElement.GetString() ?? filePath;
        }
        
        List<Dictionary<string, object>> extractedData;

        try
        {
            // 尝试读取并解析JSON文件
            string jsonData;
            if (File.Exists(filePath))
            {
                jsonData = await File.ReadAllTextAsync(filePath);
            }
            else
            {
                // 如果文件不存在，使用示例数据
                jsonData = @"[
                    { ""id"": 1, ""name"": ""John Doe"", ""email"": ""john@example.com"", ""age"": 30 },
                    { ""id"": 2, ""name"": ""Jane Smith"", ""email"": ""jane@example.com"", ""age"": 25 },
                    { ""id"": 3, ""name"": ""Bob Johnson"", ""email"": ""bob@example.com"", ""age"": 35 }
                ]";
            }

            // 解析JSON数据
            using var doc = JsonDocument.Parse(jsonData);
            extractedData = new List<Dictionary<string, object>>();

            foreach (var item in doc.RootElement.EnumerateArray())
            {
                var row = new Dictionary<string, object>();
                foreach (var property in item.EnumerateObject())
                {
                    switch (property.Value.ValueKind)
                    {
                        case JsonValueKind.String:
                            row[property.Name] = property.Value.GetString() ?? "";
                            break;
                        case JsonValueKind.Number:
                            if (property.Value.TryGetInt32(out int intValue))
                            {
                                row[property.Name] = intValue;
                            }
                            else if (property.Value.TryGetDouble(out double doubleValue))
                            {
                                row[property.Name] = doubleValue;
                            }
                            break;
                        case JsonValueKind.True:
                            row[property.Name] = true;
                            break;
                        case JsonValueKind.False:
                            row[property.Name] = false;
                            break;
                        case JsonValueKind.Null:
                            row[property.Name] = null;
                            break;
                        default:
                            row[property.Name] = property.Value.ToString();
                            break;
                    }
                }
                extractedData.Add(row);
            }
        }
        catch (Exception)
        {
            // 如果解析失败，使用默认数据
            extractedData = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { "id", 1 },
                    { "name", "John Doe" },
                    { "email", "john@example.com" },
                    { "age", 30 }
                },
                new Dictionary<string, object>
                {
                    { "id", 2 },
                    { "name", "Jane Smith" },
                    { "email", "jane@example.com" },
                    { "age", 25 }
                },
                new Dictionary<string, object>
                {
                    { "id", 3 },
                    { "name", "Bob Johnson" },
                    { "email", "bob@example.com" },
                    { "age", 35 }
                }
            };
        }
        
        var extractResult = new
        {
            nodeId = "extract",
            nodeType = "extract",
            filePath = filePath,
            rowCount = extractedData.Count,
            data = extractedData,
            timestamp = DateTime.UtcNow,
            message = $"Successfully extracted {extractedData.Count} rows from {filePath}"
        };
        
        return extractResult;
    }

    private async Task<object> ExecuteValidateNodeAsync(object? inputData)
    {
        // 模拟数据验证操作
        await Task.Delay(300); // 模拟验证延迟
        
        int validRows = 0;
        int invalidRows = 0;
        var validationErrors = new List<string>();
        List<Dictionary<string, object>> validatedData = new();
        
        // 如果输入数据包含提取的数据，则进行验证
        if (inputData is JsonElement jsonElement && jsonElement.TryGetProperty("data", out JsonElement dataArray))
        {
            foreach (var item in dataArray.EnumerateArray())
            {
                bool isValid = true;
                var rowData = new Dictionary<string, object>();
                
                // 将JsonElement转换为Dictionary
                foreach (var property in item.EnumerateObject())
                {
                    rowData[property.Name] = property.Value.ToString();
                    
                    switch (property.Name)
                    {
                        case "id":
                            // ID必须存在且为数字
                            if (property.Value.ValueKind != JsonValueKind.Number)
                            {
                                validationErrors.Add($"Row missing valid 'id' field");
                                isValid = false;
                            }
                            break;
                        case "name":
                            // 名称必须存在且非空
                            if (property.Value.ValueKind != JsonValueKind.String || 
                                string.IsNullOrEmpty(property.Value.GetString()))
                            {
                                validationErrors.Add($"Row missing valid 'name' field");
                                isValid = false;
                            }
                            break;
                        case "email":
                            // 邮箱必须存在且格式正确
                            if (property.Value.ValueKind != JsonValueKind.String || 
                                string.IsNullOrEmpty(property.Value.GetString()) ||
                                !IsValidEmail(property.Value.GetString() ?? ""))
                            {
                                validationErrors.Add($"Row missing valid 'email' field");
                                isValid = false;
                            }
                            break;
                        case "age":
                            // 年龄必须存在且为正数
                            if (property.Value.ValueKind != JsonValueKind.Number || 
                                property.Value.GetInt32() < 0)
                            {
                                validationErrors.Add($"Row has invalid 'age' field");
                                isValid = false;
                            }
                            break;
                    }
                }
                
                if (isValid)
                {
                    validRows++;
                    validatedData.Add(rowData);
                }
                else
                {
                    invalidRows++;
                }
            }
        }
        
        var validationResult = new
        {
            nodeId = "validate",
            nodeType = "validate",
            validRows = validRows,
            invalidRows = invalidRows,
            totalRows = validRows + invalidRows,
            validationErrors = validationErrors,
            isValid = invalidRows == 0,
            data = validatedData,
            timestamp = DateTime.UtcNow,
            message = $"Validation completed: {validRows} valid rows, {invalidRows} invalid rows"
        };
        
        return validationResult;
    }

    private async Task<object> ExecuteLoadNodeAsync(object? inputData)
    {
        // 模拟数据加载到内存数据库操作
        await Task.Delay(400); // 模拟数据库操作延迟
        
        string tableName = "etl_data";
        int loadedRows = 0;
        
        // 如果输入数据包含验证通过的数据，则加载到内存数据库
        if (inputData is JsonElement jsonElement && jsonElement.TryGetProperty("data", out JsonElement dataArray))
        {
            var dataList = new List<Dictionary<string, object>>();
            
            foreach (var item in dataArray.EnumerateArray())
            {
                var row = new Dictionary<string, object>();
                
                // 将JsonElement转换为Dictionary
                foreach (var property in item.EnumerateObject())
                {
                    switch (property.Value.ValueKind)
                    {
                        case JsonValueKind.String:
                            row[property.Name] = property.Value.GetString() ?? "";
                            break;
                        case JsonValueKind.Number:
                            if (property.Value.TryGetInt32(out int intValue))
                            {
                                row[property.Name] = intValue;
                            }
                            else if (property.Value.TryGetDouble(out double doubleValue))
                            {
                                row[property.Name] = doubleValue;
                            }
                            break;
                        case JsonValueKind.True:
                            row[property.Name] = true;
                            break;
                        case JsonValueKind.False:
                            row[property.Name] = false;
                            break;
                        default:
                            row[property.Name] = property.Value.ToString();
                            break;
                    }
                }
                
                dataList.Add(row);
                loadedRows++;
            }
            
            // 存储到内存数据库
            _inMemoryDb[tableName] = dataList;
        }
        
        var loadResult = new
        {
            nodeId = "load",
            nodeType = "load",
            tableName = tableName,
            loadedRows = loadedRows,
            data = _inMemoryDb.ContainsKey(tableName) ? _inMemoryDb[tableName] : new List<Dictionary<string, object>>(),
            timestamp = DateTime.UtcNow,
            message = $"Successfully loaded {loadedRows} rows into table '{tableName}'"
        };
        
        return loadResult;
    }
    
    // 简单的邮箱验证方法
    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}