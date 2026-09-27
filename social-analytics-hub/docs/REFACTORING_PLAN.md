# 重构计划：danmaku 限界上下文 DDD 补全

> 依据：[`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
> 状态：待执行 → 执行中 → 已完成（随进度更新）

---

## 1. 现状分析

### 1.1 已完成的 DDD 骨架

`feat: reconstruct application`（`a1ba41b`）已把原先**按技术角色平铺**的结构改造为四层骨架：

| 层 | 已落地内容 |
| --- | --- |
| domain | `danmaku/{entities,value_objects,repositories}.py` |
| application | `danmaku/services.py`（`DanmakuAnalyzer`、`AnalyticsNotificationService`） |
| infrastructure | `database/`（引擎/会话/UoW）、`persistence/{models,repositories}/`、`cache/`、`messaging/`、`schedulers/`、`logging/`、`telemetry/` |
| api | `routers/danmaku.py`、`schemas/`、`dependencies/`、`middleware/` |

### 1.2 阻断性问题（当前应用**无法启动**）

| # | 问题 | 证据 |
| --- | --- | --- |
| P1 | **循环导入**：`container` → `application.danmaku.services` → `src.api.schemas` → `src.api.__init__` → `routers.danmaku` → `api.dependencies` → 回到 `application.danmaku.services` | `python -c "import src.app"` → `ImportError: cannot import name 'AnalyticsNotificationService' from partially initialized module` |
| P2 | **引用已删除模块**：`services.py` 导入 `src.models`、`src.repositories`；`container.py` 导入 `src.repositories` | `src/models/` 与 `src/repositories/danmaku.py` 均已不存在（后者为 0 字节） |
| P3 | **DI 装配与构造函数不匹配**：`container.danmaku_analyzer` 传入 `db_manager`，但 `DanmakuAnalyzer.__init__` 期望 `danmaku_repo` | `container.py:46-51` vs `services.py:296-305` |
| P4 | **wiring 指向不存在模块**：`WiringConfiguration(modules=["src.api.routes.danmaku"])` | `container.py:20` |
| P5 | **多入口自相矛盾**：`app.py` 中 `from container import create_app_conatiner`（无 `src.` 前缀）与 `from src.container import AppContainer` 并存 | `app.py:12,15` |
| P6 | `infrastructure/database/deps.py` 导入不存在的 `src.database.interfaces`；该文件整体为死代码 | `deps.py:9` |
| P7 | `alembic/env.py` 导入不存在的 `src.database` | `env.py:8` |
| P8 | `src/core/config.py` 的 `get_yaml_file()` 指向 `app/core/{env}.yaml`，与实际 `src/core/` 不符 → 配置加载回退到默认值 | `config.py:52` |

### 1.3 结构性缺口

| # | 缺口 | 说明 |
| --- | --- | --- |
| G1 | `application/danmaku/{commands,queries,dtos,mappers}.py` 全为 **0 字节** | 无 CQRS 用例层 |
| G2 | `domain/danmaku/{events,services}.py` 全为 **0 字节** | 无领域事件、无领域服务 |
| G3 | `infrastructure/persistence/mappers/danmaku_mapper.py` 为 **0 字节** | ORM↔实体映射散落在各仓储内部（重复 8 次构造代码） |
| G4 | 遗留平铺包 `src/repositories/`、`src/mappers/` | 违反架构准则 §2.2 |
| G5 | `/analysis/generate` 之外**全部业务接口丢失** | 旧 `danmaku_v1` 路由提供弹幕分页查询、统计、词频、词云四类接口，重构中未迁移 |
| G6 | `add_in_batch` 把领域实体直接 `session.add_all()` | 运行时必然 `UnmappedInstanceError` |
| G7 | `DanmakuRepository.search_danmaku()` 返回 `DanmakuWithRoomDto` | 领域仓储接口泄漏 API DTO |
| G8 | 接口方法名拼写错误 `add_in_bacth` | 与实现 `add_in_batch` 不一致，抽象形同虚设 |
| G9 | `test/` 10 个文件全部基于旧路径（`src.services.*`、`src.database.*`、`src.cache.*`、`core.*`） | 无一可运行 |
| G10 | `src/core/model.py` 中 `@field_validator` 检查 `info.data.get("type")`，而模型无 `type` 字段 | 校验器永远短路，形同虚设 |
| G11 | `PostgresCaptureJobRepository.get_list()` 中 `stmt.where(...)` 未赋值 | 状态过滤静默失效 |

### 1.4 旧版（重构前）能力基线

从旧字节码 `src/api/routers/__pycache__/danmaku_v1.cpython-314.pyc` 与 `src/repositories/__pycache__/danmaku_repository.cpython-314.pyc` 恢复的功能清单：

**旧 `DanmakuRepository` 方法**：`insert_danmaku`、`insert_danmaku_batch`、`insert_capture_job`、`insert_danmaku_analysis`、`update_capture_job_status`、`update_danmaku`、`delete_danmaku`、`get_danmaku_count`、`get_recent_danmakus`、`get_recent_room_ids`、`get_danmaku_by_user`、`get_danmaku_by_room`、`get_running_capture_job`、`get_active_capture_jobs`、`get_capture_jobs`、`get_danmaku_in_time_range`、`get_analysis`、`get_danmaku_by_id`、`search_danmaku`、`get_search_count`

**旧路由接口**：
| 方法 | 路径 | 能力 |
| --- | --- | --- |
| GET | `/danmakus/` | 弹幕分页查询（`limit`/`offset`/`keyword`/`room_id`/`start_time`/`end_time`） |
| GET | `/danmakus/statistics` | 统计：总条数、独立用户数、活跃房间数、峰值小时 |
| GET | `/danmakus/word-frequency` | 词频 Top-N |
| GET | `/danmakus/wordcloud` | 词云数据 |
| POST | `/danmakus/analysis/generate` | 触发分析（当前唯一保留的接口） |

---

## 2. 重构目标

1. **应用可启动**：消除循环导入与失效引用（P1–P8）。
2. **分层完整**：补齐 domain 事件/领域服务、application CQRS/DTO/mapper（G1、G2）。
3. **实现收敛**：ORM↔实体映射集中化（G3），删除遗留平铺包（G4）。
4. **能力对齐**：恢复并补全弹幕查询、统计、词频、词云接口（G5）。
5. **正确性**：修复 G6–G8、G10、G11 等确定性缺陷。
6. **可回归**：重写 `test/` 使其覆盖新分层并可全绿通过（G9）。
7. **准则固化**：以 `docs/ARCHITECTURE.md` 作为后续开发强制标准。

---

## 3. 目标结构

```
src/
├── api/
│   ├── __init__.py                     # api_router 汇总
│   ├── dependencies/danmaku.py         # Annotated Depends 别名（去 @inject）
│   ├── middleware/logging_middleware.py
│   ├── routers/danmaku.py              # 精简为 5 个 HTTP 端点
│   └── schemas/{common,danmaku}.py     # 请求/响应契约
├── application/danmaku/
│   ├── dtos.py                         # DanmakuDto / AnalysisDto / StatisticsDto / PagedDto
│   ├── mappers.py                      # 实体 → DTO
│   ├── commands.py                     # GenerateAnalysis / PrecomputeAllRooms
│   ├── queries.py                      # ListDanmaku / SearchDanmaku / GetStatistics / GetWordFrequency / GetWordcloud
│   └── services.py                     # DanmakuAnalyzer / AnalyticsNotificationService
├── domain/danmaku/
│   ├── entities.py                     # DanmakuEntity / CaptureJobEntity / DanmakuAnalysisEntity
│   ├── value_objects.py                # FanMedal / AnalysisPeriod / AnalysisType / TimeRange
│   ├── events.py                       # DanmakuAnalysisCompletedDomainEvent
│   ├── repositories.py                 # 三个仓储 ABC（修正拼写与返回类型）
│   └── services.py                     # WordFrequencyDomainService（jieba 分词 + 停用词）
├── infrastructure/
│   ├── cache/cache_session.py
│   ├── database/{interfaces,manager,providers}.py   # 删除 deps.py
│   ├── logging/constructor.py
│   ├── messaging/eventbus.py
│   ├── persistence/
│   │   ├── mappers/danmaku_mapper.py    # 实体 ↔ ORM 模型（唯一转换入口）
│   │   ├── models/*.py
│   │   └── repositories/*.py            # 三个仓储实现
│   ├── schedulers/
│   └── telemetry/
├── core/ + shared/
├── app.py                              # 组合根
└── container.py                        # 组合根
删除：src/repositories/、src/mappers/
```

---

## 4. 执行阶段

### 阶段 0 — 建立准则与基线
- [x] 编写 `docs/ARCHITECTURE.md`
- [x] 编写本文档
- [x] 记录基线：`import src.app` 失败、`pytest` 收集失败

### 阶段 1 — domain 层补全
- [x] `value_objects.py`：`FanMedal`、`AnalysisPeriod`（枚举，替代 API 层 `PeriodType` 作为领域概念）、`AnalysisType`、`TimeRange`（含校验）
- [x] `events.py`：`DanmakuAnalysisCompletedDomainEvent`（纯数据 + `to_integration_payload()`）
- [x] `services.py`：`WordFrequencyDomainService`（分词、停用词过滤、Top-N），把 `STOP_WORDS` 从应用层下沉
- [x] `repositories.py`：修正 `add_in_bacth` → `add_in_batch`；`search` 返回领域实体 `(entity, room_name)` 而非 DTO；补齐 `update`/`delete`/`count`/`get_active`/`get_capture_jobs`
- [x] 实体：`DanmakuEntity` 增加 `is_from_room()` 等不变量方法

### 阶段 2 — application 层补全
- [x] `dtos.py`：`DanmakuDto`、`DanmakuPageDto`、`DanmakuStatisticsDto`、`WordFrequencyDto`、`WordcloudDto`、`DanmakuAnalysisDto`
- [x] `mappers.py`：实体 → DTO
- [x] `commands.py`：`GenerateAnalysisCommand`/`Handler`、`PrecomputeAllRoomsCommand`/`Handler`
- [x] `queries.py`：`ListDanmakuQuery`/`Handler`、`GetDanmakuStatisticsQuery`/`Handler`、`GetWordFrequencyQuery`/`Handler`、`GetWordcloudQuery`/`Handler`
- [x] `services.py`：**移除 `src.api.*` 导入**；改依赖领域仓储接口 + 领域服务；修复 DI 构造签名

### 阶段 3 — infrastructure 层收敛
- [x] `persistence/mappers/danmaku_mapper.py`：三个实体双向映射
- [x] `PostgresDanmakuRepository`：全部走 mapper；修复 `add_in_batch`；`search_*` 返回实体元组；补齐缺失查询
- [x] `PostgresCaptureJobRepository`：修复 `get_list` 过滤失效；补齐 `get_active`/`get_capture_jobs` 分页
- [x] `PostgresDanmakuAnalysisRepository`：走 mapper，支持按类型/房间/时间范围查询
- [x] `CacheSession`：单例连接池化（原实现每次调用新建 `Redis`）
- [x] 删除 `infrastructure/database/deps.py`

### 阶段 4 — api 层重建
- [x] `schemas/danmaku.py`：请求/响应模型；`PeriodType` 保留给 HTTP 契约但由应用层枚举映射
- [x] `dependencies/danmaku.py`：为每个 Handler 提供 `Annotated` 依赖别名
- [x] `routers/danmaku.py`：恢复 `GET /`（列表）、`GET /statistics`、`GET /word-frequency`、`GET /wordcloud`、`POST /analysis/generate`；薄路由
- [x] `api/__init__.py`：汇总路由，去除 `__init__` 副作用导入链

### 阶段 5 — 组合根与配置修复
- [x] `container.py`：修正装配、wiring、类型注解；注册全部仓储与 Handler
- [x] `app.py`：统一 `src.` 导入；修正 `uvicorn.run("src.app:app")`；CORS 使用配置值
- [x] `core/config.py`：`get_yaml_file()` 指向 `src/core/`
- [x] `core/model.py`：移除/修正永不生效的 `field_validator`
- [x] `alembic/env.py`：`target_metadata` 指向新模型包
- [x] `pyproject.toml`：补充 `[tool.pytest.ini_options]`（asyncio 模式、testpaths）
- [x] 删除 `src/repositories/`、`src/mappers/` 与全部陈旧 `__pycache__`

### 阶段 6 — 测试重写
- [x] `test/domain/`：实体不变量、值对象、领域服务（分词/停用词）
- [x] `test/application/`：命令/查询 Handler、分析服务（mock 仓储）
- [x] `test/infrastructure/`：仓储（mock session）、`CacheSession`、`EventBus`、`DatabaseUtils`、`ObjectPool`、调度策略
- [x] `test/api/`：路由（依赖覆盖）覆盖 5 个端点与错误分支
- [x] 删除全部旧测试文件

### 阶段 7 — 校验
- [x] `python -c "import src.app"` 通过
- [x] `ruff check src test` + `ruff format --check src test` 通过
- [x] `pytest test -q` 全绿（192 passed）
- [x] TestClient 冒烟：`/health`、`/`、`/danmakus/statistics`（mock 仓储）
- [x] 真实 `uvicorn src.app:app` 启动冒烟：`/health` → 200，`/openapi.json` 含全部 5 个弹幕端点

### 阶段 8 — 联机验证发现的运行时缺陷（单元测试无法暴露）

以下缺陷只有在"真正启动 uvicorn 并打 HTTP 请求"时才暴露，均为发布阻断级：

- [x] **D12：DI 容器注入未 await 的 Future。**
  原 `container.py` 使用 `providers.Resource(provide_db_manager)`（异步生成器工厂），
  `dependency_injector` 会把未 await 的 Future 注入所有下游 provider，启动必然报
  `AttributeError: '_asyncio.Future' object has no attribute 'start'`。
  → 改为 `infrastructure/database/providers.py` 的 `DatabaseManagerProvider`
  （显式 `initialize()`/`dispose()` + 同步 `__call__`），由 lifespan 驱动生命周期。
  回归用例：`test_container_and_app.py::test_no_provider_is_an_awaitable`。

- [x] **D13：缓存不可用时请求无限挂起。**
  `redis-py` 在当前接口下不遵守 `socket_connect_timeout`（实测对端拒绝连接仍需 25s），
  且应用层没有缓存降级路径，`/danmakus/word-frequency` 实测挂起 37.5s。
  → `CacheSession` 增加 `asyncio.timeout` 操作级超时并包装为 `CacheUnavailableError`；
  应用层捕获后把缓存降级为"未命中"（读失败→回退 DB/实时计算，写失败→仅告警）。
  实测该端点由 37.5s 降至 3.3s。
  回归用例：`test/application/test_services.py::TestCacheDegradation`、
  `test/infrastructure/test_adapters.py::TestCacheSession`。

- [x] **D14：日志 enqueue sink 在受限环境导致启动失败。**
  `logger.add(..., enqueue=True)` 需要创建 multiprocessing 管道，在禁止命名管道的
  沙箱/容器中抛 `PermissionError`，直接中断启动。
  → `_add_file_sink` 捕获 `OSError/PermissionError` 后降级为 `enqueue=False` 同步写入。

---

## 5. 验收标准

| 编号 | 标准 | 验证方式 |
| --- | --- | --- |
| A1 | 应用可导入、可创建、lifespan 无循环导入 | `python -c "from src.app import app"` |
| A2 | `src/` 下不存在 `models/`、`repositories/`、`mappers/`、`services/`、`schemas/`、`deps.py`、`logging_utils.py`、`telemetry.py` 遗留物 | `ls src` |
| A3 | 5 个 HTTP 端点全部可用且 schema 正确 | TestClient + `/openapi.json` |
| A4 | `application` 层无 `src.api` 导入 | `grep -rn "src.api" src/application` 无结果 |
| A5 | 仓储不返回 DTO | 代码评审 + 类型注解 |
| A6 | `ruff check` / `ruff format --check` 无问题 | CI 命令 |
| A7 | `pytest test` 全绿（192 passed） | CI 命令 |
| A8 | `alembic upgrade head --sql` 可生成 | alembic 命令（离线） |
| A9 | 真实 `uvicorn src.app:app` 可启动并响应 `/health` | 启动后 HTTP 探测 |

---

## 6. 风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 旧接口契约细节无法完全还原 | 前端集成不一致 | 以本文档 §1.4 恢复的能力清单为准，保持字段名与旧 DTO 一致；对不确定处采用向后兼容的宽松参数 |
| 同步 SQLAlchemy 会话在 async 路由中阻塞事件循环 | 高并发下吞吐下降 | 本阶段保持同步仓储以降低风险；后续统一迁移 `async_uow`（见 §7） |
| 删除遗留包时误删仍被引用的符号 | 导入失败 | 先全量 `grep` 引用，再删除；删除后立即执行 A1 校验 |
| 测试重写范围大 | 交付周期 | 按层推进，每层完成后即可运行该层子集测试 |
| 单元测试通过但真实启动失败 | 发布阻断 | 验收必须包含真实 `uvicorn` 启动 + HTTP 探测（A9）；D12/D13/D14 即由此发现 |

### 6.1 后续开发必须注意的两个坑

1. **不要给 `dependency_injector` 注册异步生成器提供的 `providers.Resource`。**
   它不会在注入前 await，而是把 Future 直接交给下游。需要异步生命周期时，
   使用 `DatabaseManagerProvider` 这种"同步 provider + 显式 initialize/dispose"模式。
   回归用例：`test_container_and_app.py::test_no_provider_is_an_awaitable`。
2. **不要依赖 `redis-py` 的 socket 超时。** 必须在适配层用 `asyncio.timeout`
   强制操作级超时，并让调用方对缓存故障降级。

---

## 7. 后续计划（本次范围之外）

1. PostgreSQL 迁移脚本补全（当前 `alembic/versions` 内容为其它项目残留：`egame_audits` 等，需为 `danmakus`/`capture_jobs`/`danmaku_analyses`/`rooms` 生成正式初始迁移）。
2. 同步仓储 → 异步仓储迁移（使用已有的 `async_session`/`async_uow`），消除 async 路由中的同步阻塞。
3. `EventBus` 改为异步与连接池常驻，消除每次发布新建 RabbitMQ 连接。
4. 弹幕采集入口（`capture_jobs` 的创建/停止接口与抓取器）尚未纳入本模块，如需恢复应新增 `application/danmaku` 命令与对应采集基础设施。
5. `ObjectPool` 的 `peak_pool_size` 初始化语义与 `DatabaseUtils` 的 API 收敛。
