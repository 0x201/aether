# Workflow.API

这是一个基于 ASP.NET Core 的工作流引擎 API，参考了 Apache Airflow 的设计理念，实现了节点、节点执行器和调度器的核心组件。

## 功能特性

1. **节点管理**：
   - 支持多种节点类型（起始节点、结束节点、任务节点、决策节点等）
   - 节点数据持久化（当前使用内存存储）
   - 节点连接管理

2. **节点执行器**：
   - 不同类型节点的执行逻辑
   - 节点间数据传递
   - 决策节点条件评估

3. **工作流调度器**：
   - 工作流实例管理
   - 异步工作流执行
   - 运行状态跟踪

## 支持的节点类型

- `start` - 起始节点
- `end` - 结束节点
- `dummy` - 任务节点（占位符）
- `branch` - 决策节点
- `bash` - Bash命令执行节点
- `python` - Python脚本执行节点
- `email` - 邮件发送节点
- `http` - HTTP请求节点
- `sql` - SQL执行节点
- `subdag` - 子工作流节点
- `sensor` - 传感器节点
- `custom` - 自定义节点
- `extract` - 数据提取节点（ETL）
- `validate` - 数据验证节点（ETL）
- `load` - 数据加载节点（ETL）

## API 端点

- `GET /api/workflows` - 获取所有工作流
- `GET /api/workflows/{id}` - 根据ID获取工作流
- `POST /api/workflows` - 创建新工作流
- `PUT /api/workflows/{id}` - 更新工作流
- `DELETE /api/workflows/{id}` - 删除工作流
- `POST /api/workflows/{id}/execute` - 执行工作流
- `GET /api/workflows/running` - 获取正在运行的工作流
- `GET /api/etl/data` - 获取ETL处理后的数据

## CORS 配置

为了支持前端应用的跨域请求，API已配置CORS策略。默认情况下，允许所有来源、方法和标头的请求。

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

在生产环境中，建议限制允许的来源以提高安全性：

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy", policy =>
    {
        policy.WithOrigins("https://yourdomain.com")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

## 架构设计

### 核心组件

1. **Models** - 数据模型
   - `WorkflowModel` - 工作流模型
   - `WorkflowNode` - 工作流节点
   - `WorkflowConnection` - 节点连接
   - `NodeData` - 节点数据配置
   - `Position` - 节点位置信息

2. **Services** - 核心服务
   - `IWorkflowRepository` - 工作流数据存储接口
   - `InMemoryWorkflowRepository` - 内存数据存储实现
   - `INodeExecutor` - 节点执行器接口
   - `NodeExecutor` - 节点执行器实现
   - `IWorkflowScheduler` - 工作流调度器接口
   - `WorkflowScheduler` - 工作流调度器实现

## 示例工作流

API内置了四个示例工作流，用于演示不同类型的场景：

### 1. 简单线性工作流 (ID: 1)
包含一个简单的线性执行流程：
Start → Process Data → Validate Results → End

### 2. 决策工作流 (ID: 2)
包含一个决策节点，根据条件选择不同的执行路径：
Start → Data Analysis → Check Value → (High Value Path / Low Value Path) → End

### 3. 复杂工作流 (ID: 3)
包含多个并行处理路径和决策节点的复杂流程：
Start → Data Ingestion → (ETL Process & Data Validation) → Quality Check → (High Quality Processing / Error Handling) → Data Storage → End

### 4. ETL工作流 (ID: 4)
专门用于ETL（提取、转换、加载）的数据处理流程：
Start → Extract Data → Validate Data → Load to Database → End

## ETL功能说明

ETL工作流包含三个专门的节点类型，用于处理数据提取、验证和加载：

### Extract Node（提取节点）
- 从文件系统中提取数据
- 支持JSON格式的文件
- 可配置文件路径等参数
- 实际读取并解析指定的JSON文件

### Validate Node（验证节点）
- 验证提取的数据是否符合预期格式
- 检查必需字段是否存在
- 验证数据类型和范围
- 验证邮箱格式等业务规则

### Load Node（加载节点）
- 将验证通过的数据加载到内存数据库中
- 支持配置目标表名
- 提供加载行数统计
- 数据存储在内存中，可通过API访问

数据存储在内存数据库中，可通过`GET /api/etl/data`端点访问查询。

## 前端集成

前端应用位于 `src/ClientApp/vite-react-app` 目录中，包含以下功能：

1. **可视化工作流编辑器** - 使用React构建的可视化工作流编辑器
2. **工作流列表** - 显示所有可用的工作流并支持执行
3. **API服务集成** - 通过 `workflowService.ts` 与后端API交互

### 前端组件

- `WorkflowEditor` - 可视化工作流编辑器
- `WorkflowList` - 工作流列表和详情查看
- `WorkflowService` - 与后端API通信的服务

## 使用示例

```bash
# 获取所有工作流
curl -X GET http://localhost:5207/api/workflows

# 获取特定工作流
curl -X GET http://localhost:5207/api/workflows/4

# 执行ETL工作流
curl -X POST http://localhost:5207/api/workflows/4/execute

# 获取ETL处理后的数据
curl -X GET http://localhost:5207/api/etl/data

# 获取正在运行的工作流
curl -X GET http://localhost:5207/api/workflows/running
```

## 扩展性

该工作流引擎设计具有良好的扩展性：

1. 可以轻松添加新的节点类型
2. 可以替换数据存储实现（如使用数据库）
3. 可以增强节点执行器的功能
4. 可以改进调度器的调度策略

## 参考

本项目参考了以下开源项目的理念：
- [Apache Airflow](https://airflow.apache.org/) - 工作流调度和监控平台