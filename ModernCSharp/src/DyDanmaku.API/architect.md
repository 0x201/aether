# Architecture Diagram

## Diagram

```mermaid
graph TB
    subgraph "API Layer"
        A[DanmakuApi] --> J[ICaptureJobManager]
    end
    
    subgraph "Job Management Layer"
        J --> CM[CaptureJobManager]
        CM --> CF[IDanmakuCaptureServiceFactory]
        CM --> SF[IServiceScopeFactory]
        CM --> JR[ICaptureJobRepository]
    end
    
    subgraph "Factory Layer"
        CF --> DSF[DanmakuCaptureServiceFactory]
        DSF --> SF
        DSF --> TS[IMemoryTaskScheduler]
        DSF --> HF[IHttpClientFactory]
        DSF --> JR
        DSF --> CFG[Configuration]
        DSF --> LG[Logger]
    end
    
    subgraph "Task Scheduling Layer"
        TS --> MTS[MemoryTaskScheduler]
    end
    
    subgraph "Capture Service Layer"
        DS[DanmakuCaptureService]
        DS -.-> SF
        DS -.-> TS
        DS -.-> HF
        DS -.-> JR
        DS -.-> CFG
        DS -.-> LG
    end
    
    subgraph "Client Layer"
        DC[DyDanmakuClient]
        DC --> LG
        DC --> JR
        DC --> CFG
        DC --> SF
    end
    
    subgraph "Background Services"
        CMS[CaptureJobMonitoringService]
        STS[ScheduleTaskService]
    end
    
    subgraph "Data Access Layer"
        JR --> DB[Database Context]
    end
    
    subgraph "External Resources"
        WS[WebSocket Connection]
        API[External APIs]
    end
    
    %% Connections
    J --"Start/Stop"--> CM
    CM --"Create Service"--> CF
    CF --"Creates"--> DS
    DS --"Schedule Tasks"--> TS
    DS --"Start Capture"--> DC
    DC --"Connect"--> WS
    DC --"Get Room Info"--> API
    CM --"Monitor"--> CMS
    CM --"Schedule"--> STS
    DC --"Save Data"--> JR
    JR --"Persist"--> DB

    classDef serviceLayer fill:#e1f5fe
    classDef dataLayer fill:#f3e5f5
    classDef externalLayer fill:#fff3e0
    
    class DSF,DS,DC,MTS serviceLayer
    class JR,DB dataLayer
    class WS,API externalLayer
```

## 架构说明

### 1. API层

DanmakuApi: REST API入口点，接收启动/停止捕获请求  

### 2. 任务管理层

ICaptureJobManager / CaptureJobManager: 负责管理所有捕获任务，跟踪活跃任务，与数据库交互  

### 3. 工厂层

IDanmakuCaptureServiceFactory / DanmakuCaptureServiceFactory: 负责创建和管理DanmakuCaptureService实例  

### 4. 任务调度层

IMemoryTaskScheduler / MemoryTaskScheduler: 内存任务调度器，管理长时间运行的捕获任务  

### 5. 捕获服务层

DanmakuCaptureService: 核心捕获服务，使用IServiceScopeFactory管理服务生命周期  

### 6. 客户端层

DyDanmakuClient: WebSocket客户端，实际执行弹幕捕获  

### 7. 数据访问层

ICaptureJobRepository: 数据访问接口，管理任务状态持久化  

### 8. 后台服务

CaptureJobMonitoringService: 监控过期任务  
ScheduleTaskService: 定时任务服务  

### 关键特性

服务生命周期管理: 使用IServiceScopeFactory确保每次数据库操作都有独立作用域  

内存任务调度: MemoryTaskScheduler管理长时间运行的任务  

线程安全: 使用ConcurrentDictionary管理任务状态  

优雅取消: 支持CancellationToken的取消机制  

资源清理: 任务完成或取消时自动清理资源  