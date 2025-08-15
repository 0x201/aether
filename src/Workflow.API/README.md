# Workflow.API

这是一个基于 ASP.NET Core 的工作流引擎 API，参考了 Apache Airflow 的设计理念，实现了节点、节点执行器和调度器的核心组件。

## 功能特性

1. **节点管理**：
   - 支持多种节点类型（起始节点、结束节点、任务节点、决策节点）
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

## API 端点

- `GET /api/workflows` - 获取所有工作流
- `GET /api/workflows/{id}` - 根据ID获取工作流
- `POST /api/workflows` - 创建新工作流
- `PUT /api/workflows/{id}` - 更新工作流
- `DELETE /api/workflows/{id}` - 删除工作流
- `POST /api/workflows/{id}/execute` - 执行工作流
- `GET /api/workflows/running` - 获取正在运行的工作流

## 架构设计

### 核心组件

1. **Models** - 数据模型
   - `WorkflowModel` - 工作流模型
   - `WorkflowNode` - 工作流节点
   - `WorkflowConnection` - 节点连接

2. **Services** - 核心服务
   - `IWorkflowRepository` - 工作流数据存储接口
   - `InMemoryWorkflowRepository` - 内存数据存储实现
   - `INodeExecutor` - 节点执行器接口
   - `NodeExecutor` - 节点执行器实现
   - `IWorkflowScheduler` - 工作流调度器接口
   - `WorkflowScheduler` - 工作流调度器实现

## 使用示例

```bash
# 获取所有工作流
curl -X GET http://localhost:5000/api/workflows

# 创建新工作流
curl -X POST http://localhost:5000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Workflow",
    "nodes": [
      {
        "id": "1",
        "name": "Start Node",
        "type": "start",
        "data": {
          "label": "Start"
        },
        "position": {
          "x": 100,
          "y": 100
        }
      }
    ],
    "connections": []
  }'

# 执行工作流
curl -X POST http://localhost:5000/api/workflows/{workflowId}/execute
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