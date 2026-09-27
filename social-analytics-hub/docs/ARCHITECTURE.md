# Aether Social Analytics Hub — 架构与开发准则

> 本文档是本项目的**强制开发准则**。所有新增功能、缺陷修复与重构都必须遵守本文档。
> 违反准则的代码不得合入。

- 适用范围：`social-analytics-hub`（FastAPI + SQLAlchemy + PostgreSQL 社交平台弹幕分析服务）
- Python：`>=3.14`
- 依赖注入：`dependency-injector`
- 配置：`pydantic-settings` + `src/core/*.yaml`

---

## 1. 总体架构

项目采用**领域驱动设计（DDD）四层架构**。依赖方向严格单向：

```
        ┌─────────────────────────────────────────────┐
        │                  api                        │
        │   FastAPI Router / Response Schema / DI     │
        └───────────────────────┬─────────────────────┘
                                │ 只依赖 application
        ┌───────────────────────▼─────────────────────┐
        │              application                    │
        │  Commands / Queries / DTO / Mapper / Service│
        └───────────────────────┬─────────────────────┘
                                │ 只依赖 domain
        ┌───────────────────────▼─────────────────────┐
        │                domain                       │
        │  Entity / ValueObject / DomainEvent /       │
        │  Repository / Domain Service                │
        └───────────────────────▲─────────────────────┘
                                │ 实现 domain 定义的接口
        ┌───────────────────────┴─────────────────────┐
        │            infrastructure                   │
        │  ORM Model / Repository / Cache /           │
        │  Messaging / Scheduling / Telemetry         │
        └─────────────────────────────────────────────┘
```

**核心规则：`domain` 不依赖任何其它层；`infrastructure` 依赖 `domain`（实现其接口），但绝不被 `domain` 依赖。**

### 1.1 各层职责

| 层 | 目录 | 职责 | 禁止 |
| --- | --- | --- | --- |
| domain | `src/domain/<bounded_context>/` | 业务不变量、实体、值对象、领域事件、仓储抽象、纯领域服务 | 导入 fastapi / sqlalchemy / redis / pika / pydantic；访问 I/O；感知 HTTP |
| application | `src/application/<bounded_context>/` | 用例编排（Command/Query）、事务边界、DTO、应用映射、集成事件发布 | 导入 fastapi；导入 sqlalchemy 模型；直接使用 ORM Session；返回 ORM 对象 |
| infrastructure | `src/infrastructure/` | 技术实现：ORM 模型、仓储实现、缓存、消息总线、调度器、日志、遥测 | 承载业务规则；被上层反向依赖 |
| api | `src/api/` | HTTP 契约：路由、请求/响应 Schema、依赖注入、中间件 | 写业务逻辑；直接访问数据库/仓储 |

### 1.2 允许的依赖矩阵

| 起点 \ 终点 | domain | application | infrastructure | api | core | shared |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| domain | ✔ | ✘ | ✘ | ✘ | ✘ | ✔(纯工具) |
| application | ✔ | ✔ | ✘ | ✘ | ✔ | ✔ |
| infrastructure | ✔ | ✘ | ✔ | ✘ | ✔ | ✔ |
| api | ✘ | ✔ | ✔(仅 DI 装配处) | ✔ | ✔ | ✔ |
| container | ✔ | ✔ | ✔ | ✔(wiring 模块名) | ✔ | ✔ |

> `api` 对 `infrastructure` 的依赖仅限 `src/container.py` 与 `src/app.py` 这类**组合根**，用于装配实现。

---

## 2. 目录结构准则

```
src/
├── app.py                        # FastAPI 应用工厂 + lifespan（组合根）
├── container.py                  # dependency-injector 容器（组合根）
├── core/                         # 配置与配置模型（跨层共享）
│   ├── config.py
│   ├── model.py
│   └── {local,development,uat}.yaml
├── shared/                       # 无业务语义的通用工具
│   ├── database_utils.py
│   └── object_pool.py
├── domain/
│   ├── shared/                   # 跨限界上下文共享的领域基元
│   └── <context>/                # 例：danmaku
│       ├── entities.py           # 实体 / 聚合根
│       ├── value_objects.py      # 不可变值对象
│       ├── events.py             # 领域事件（纯数据）
│       ├── repositories.py       # 仓储接口（ABC / Protocol）
│       └── services.py           # 领域服务（纯计算，无 I/O）
├── application/
│   └── <context>/
│       ├── dtos.py               # 应用层 DTO（输入/输出）
│       ├── mappers.py            # 实体 ↔ DTO 映射
│       ├── commands.py           # 写用例（Command + Handler）
│       ├── queries.py            # 读用例（Query + Handler）
│       └── services.py           # 跨用例编排 / 事件发布
├── infrastructure/
│   ├── cache/                    # Redis
│   ├── database/                 # 引擎、会话、UoW、DB 依赖
│   ├── logging/                  # loguru + OTel 日志
│   ├── messaging/                # RabbitMQ 事件总线
│   ├── persistence/
│   │   ├── models/               # SQLAlchemy ORM 模型
│   │   ├── mappers/              # ORM 模型 ↔ 领域实体
│   │   └── repositories/         # 仓储接口实现
│   ├── schedulers/               # APScheduler 定时任务
│   └── telemetry/                # OpenTelemetry
└── api/
    ├── __init__.py               # api_router 汇总
    ├── dependencies/             # FastAPI Depends 适配
    ├── middleware/
    ├── routers/
    └── schemas/                  # 请求/响应 Pydantic 模型
```

### 2.1 命名约定

- 目录与模块：`snake_case`；限界上下文用单数业务名（`danmaku`）。
- ORM 模型：`XxxModel`，表名复数 `snake_case`（`danmakus`）。
- 领域实体：`XxxEntity`；值对象：业务名（`FanMedal`）。
- 仓储接口：`XxxRepository`（抽象）；实现：`PostgresXxxRepository`。
- DTO：`XxxDto`；请求/响应模型：`XxxRequest` / `XxxResponse`。
- Command：`XxxCommand` + `XxxHandler`；Query：`XxxQuery` + `XxxHandler`。
- 领域事件：`XxxDomainEvent`；集成事件：`XxxIntegrationEvent`。

### 2.2 禁止的目录形态

- ❌ 不得存在 `src/models/`、`src/repositories/`、`src/mappers/`、`src/services/`、`src/schemas/` 这类**按技术角色平铺的顶层包**（历史遗留）。持久化相关一律收敛到 `src/infrastructure/persistence/`。
- ❌ 不得存在跨层的 `__init__.py` 副作用导入（导入 `src.api` 就顺带加载全部路由 → 会引发循环导入）。`__init__.py` 只做明确的再导出。
- ❌ 空文件占位（0 字节的 `commands.py` 等）不得长期保留；要么实现，要么删除。

---

## 3. 编码准则

### 3.1 领域层

- 实体与值对象使用 `@dataclass`；值对象必须 `frozen=True`。
- 业务不变量写在实体方法内（如 `DanmakuEntity.is_valid_content()`），不在应用层散落判断。
- 实体**不得**继承 ORM 模型；ORM 模型只在 `infrastructure/persistence/models/` 出现。
- 仓储接口定义在 `domain/<context>/repositories.py`，方法只接受/返回**领域实体与值对象**（或基础类型），**绝不返回 DTO 或 ORM 模型**。
- 领域服务只做纯计算，不注入仓储、不访问 I/O。

### 3.2 应用层

- **应用层不得导入 `src.api`。** 枚举、DTO、周期类型等一律定义在应用层或领域层，由 API 层引用，方向不可反转。
- 每个用例一个 Command/Query + Handler；Handler 只依赖仓储接口与应用服务。
- 事务边界由 Handler 负责，通过注入的 `DatabaseSessionManager`/UoW 控制，仓储本身不隐式提交跨聚合事务。
- 对外发布**集成事件**时使用事件总线（`infrastructure/messaging`），事件负载为 JSON 可序列化的 `dict`/DTO。

### 3.3 基础设施层

- 每个仓储实现一个文件，继承对应领域接口，构造函数接收 **可调用的会话管理器提供者**
  （`Callable[[], DatabaseSessionManager]`），而不是管理器实例本身。
- 所有 ORM↔实体转换集中在 `infrastructure/persistence/mappers/`，**禁止**在仓储方法里内联构造实体（消除重复，避免字段漏配）。
- 写操作统一使用 `sync_uow()`（自动 commit/rollback）或显式 `session.commit()`；`flush()` 仅用于获取自增主键。
- 连接/会话必须由上下文管理器管理，禁止裸 `Session()`。

#### 3.3.1 依赖注入的两条硬性约束

1. **禁止给容器注册"异步生成器 + `providers.Resource`"。**
   `dependency_injector` 不会在注入前 await 异步资源，而是把未 await 的 Future
   直接交给下游 provider，导致运行时
   `AttributeError: '_asyncio.Future' object has no attribute ...`。
   需要异步生命周期时，采用 **同步 provider + 显式生命周期** 模式
   （见 `src/infrastructure/database/providers.py::DatabaseManagerProvider`：
   容器同步返回提供者，`initialize()`/`dispose()` 由 lifespan 驱动）。

2. **容器中解析出的任何 provider 都不得是 awaitable。**
   新增 provider 后必须确认 `container.<name>()` 返回的是目标实例；
   `test/test_container_and_app.py::test_no_provider_is_an_awaitable` 用于守卫该约束。

#### 3.3.2 外部依赖必须可降级

- **缓存（Redis）是加速手段，不是强依赖。** 适配层需用 `asyncio.timeout` 强制
  操作级超时（`redis-py` 并不总是遵守 `socket_connect_timeout`），并把超时/连接
  错误转换为 `CacheUnavailableError`；应用层捕获后降级为"缓存未命中"，不得让请求失败。
- **日志/遥测不得阻断启动。** 例如 loguru 的 `enqueue=True` 需要 multiprocessing
  管道，在受限环境中会失败，必须降级而不是抛出。
- 时间与顺序校验放在领域层（`TimeRange`），HTTP 入参的时区归一化放在接口层。

### 3.4 接口层

- 路由函数**只做三件事**：解析/校验入参 → 调用应用层 → 转换响应。业务判断一律下沉。
- 时间入参统一通过工具函数规范化为 UTC；校验失败返回 `400`，未捕获异常返回 `500`。
- 依赖注入：优先使用 `src/api/dependencies/` 中的 `Annotated[..., Depends(...)]` 别名 + `src/container.py` 装配；不使用 `dependency_injector.wiring` 的 `@inject`（易与 FastAPI 依赖系统冲突）。
- 路由前缀与标签在 `src/api/__init__.py` 统一注册。

### 3.5 分层样例

```python
# domain/danmaku/repositories.py
class DanmakuRepository(ABC):
    @abstractmethod
    def add(self, danmaku: DanmakuEntity) -> DanmakuEntity: ...

# infrastructure/persistence/repositories/danmaku_repository.py
class PostgresDanmakuRepository(DanmakuRepository):
    def __init__(self, db_manager: PsycopgDbSessionManager) -> None:
        self._db = db_manager

    def add(self, danmaku: DanmakuEntity) -> DanmakuEntity:
        with self._db.sync_uow() as session:
            model = to_danmaku_model(danmaku)
            session.add(model)
            session.flush()
            return to_danmaku_entity(model)

# application/danmaku/queries.py
class GetDanmakuListQuery: ...

class GetDanmakuListHandler:
    def __init__(self, repository: DanmakuRepository) -> None:
        self._repository = repository

    def handle(self, query: GetDanmakuListQuery) -> PagedResult[DanmakuDto]: ...

# api/routers/danmaku.py
@router.get("/", response_model=DanmakuPageResponse)
async def list_danmaku(handler: DanmakuListHandlerDep, ...) -> DanmakuPageResponse:
    ...
```

---

## 4. 质量门禁

提交前必须全部通过：

1. **可导入**：`python -c "import src.app"` 无异常（循环导入是发布阻断缺陷）。
2. **静态检查**：`ruff check src test`，`ruff format --check src test`。
3. **测试**：`pytest test -q` 全绿；测试只放在 `test/`，且**必须**指向新分层路径。
4. **分层校验**：新增文件必须落在本文档第 2 节规定的目录内；不存在遗留平铺包。
5. **真实启动**：`uvicorn src.app:app` 能起来并响应 `GET /health`。
   *仅跑单元测试不足以发现 DI 与外部依赖的运行时问题（参见 §3.3.1 / §3.3.2）。*
6. 迁移脚本：`alembic/env.py` 的 `target_metadata` 必须指向 `src/infrastructure/persistence/models`。

### 4.1 常见违规自查

| 违规 | 后果 | 正确做法 |
| --- | --- | --- |
| `application` 导入 `src.api.schemas` | 循环导入、应用层被 Web 契约污染 | 枚举/DTO 下沉到 `application` 或 `domain` |
| 仓储返回 DTO | 领域层泄漏、无法复用 | 返回领域实体，由应用层 mapper 转 DTO |
| 仓储里内联构造实体 | 字段漏配、重复代码 | 统一走 `persistence/mappers` |
| `add_in_batch` 直接 `session.add_all(entities)` | 运行时 `UnmappedInstanceError` | 先映射为 ORM 模型再 `add_all` |
| `.values(**{Column: value})` | `TypeError: keywords must be strings` | `.values(**{"column_name": value})` |
| `providers.Resource` + 异步生成器 | 注入未 await 的 Future，启动崩溃 | 同步 provider + 显式 initialize/dispose |
| 依赖 `redis-py` socket 超时 | 缓存故障时请求挂起数十秒 | 适配层 `asyncio.timeout` + 应用层降级 |
| `__init__.py` 中导入子路由 | 循环导入 | 路由汇总只放在 `api/__init__.py`，且依赖层不反向引用 |
