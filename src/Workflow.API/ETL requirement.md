# ETL System Architecture

请帮我设计一个ETL（Extract Transform Load）数据处理系统架构，要求如下：

1. 系统包含多个模块：Extract、Transform、 Load、 Monitor和Data Visualization.  
2. Extract：支持多种数据源并支持数据验证，如数据库、文件、API等。并支持后续扩展。  
3. Transform：支持对数据进行清洗、转换和 enrichment。支持多种数据格式转换。并支持后续扩展。  
4. Load：支持多种数据目标，如数据库、文件、API等。并支持后续扩展。  
5. Monitor：支持对数据处理进度和结果进行监控。并支持后续扩展。  
6. Data Visualization：支持对数据进行可视化，如折线图、饼图、柱状图等。并支持后续扩展。  


## 框架组成

- 前端：
  1. 用户界面：使用pnpm + typescript + vite + redux + reactjs + styled-components + react-router-dom 构建用户界面。
  2. 数据可视化：使用d3.js构建，提供数据可视化功能，用户可以查看处理后的数据。
  3. 数据处理：使用axios进行数据请求
  4. 数据处理进度和结果监控：使用signalr进行数据处理进度和结果监控，用户可以查看数据处理进度和结果。
  5. workflow支持定时任务，手动触发任务
  6. 页面：
    - Dashboard：用户可以查看系统状态，如系统运行状态、数据处理进度和结果、数据处理进度和结果监控等。
    - Workflow：用户可以配置数据处理任务，如数据源、数据目标、数据处理规则等。
    - Data Visualization：用户可以查看处理后的数据，如折线图、饼图、柱状图等。
    - Monitor：用户可以查看数据处理进度和结果，如数据处理进度和结果监控。
    - 测试：用户可以查看测试结果，如测试报告、测试用例等。
  7. 使用pnpm create vite来创建项目

- 后端
  1. 使用基于.Net 10 + Asp.Net core webapi + Signalr + Minimal API + Scalar.AspNetCore构建后端API。
  2. 数据处理模块：提供数据处理模块，接收用户请求，进行数据处理。
  3. 数据处理进度和结果监控模块：使用Asp.Net Core Signalr构建，提供数据处理进度和结果监控模块，接收数据处理进度和结果，进行数据处理。
  4. 数据库操作使用entity framework core + sql server localdb
  5. 其中workflow支持定时任务，手动触发任务  
  6. 使用库(使用Directory.Packages.props文件来进行库的中心化管理，均安装最近稳定版本)：
    - Scalar.AspNetCore
    - Microsoft.AspNetCore.SignalR.Core
    - Microsoft.EntityFrameworkCore
    - Microsoft.EntityFrameworkCore.SqlServer


基于以上的需求，请帮我生成相应的代码。我需要的是一个可以使用的框架，并且production ready.
