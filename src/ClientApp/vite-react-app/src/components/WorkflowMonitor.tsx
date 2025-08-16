import React, { useState, useEffect } from 'react';
import workflowService, { type ExecutionLog } from '../services/workflowService';

const WorkflowMonitor: React.FC = () => {
  const [runningWorkflows, setRunningWorkflows] = useState<string[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds

  // 获取正在运行的工作流
  const fetchRunningWorkflows = async () => {
    try {
      const workflows = await workflowService.getRunningWorkflows();
      setRunningWorkflows(workflows);
      setError(null);
    } catch (err) {
      setError('Failed to fetch running workflows');
      console.error('Error fetching running workflows:', err);
    }
  };

  // 获取执行日志
  const fetchExecutionLogs = async () => {
    try {
      const logs = await workflowService.getExecutionLogs();
      setExecutionLogs(logs);
      setError(null);
    } catch (err) {
      setError('Failed to fetch execution logs');
      console.error('Error fetching execution logs:', err);
    }
  };

  // 刷新所有数据
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRunningWorkflows(),
      fetchExecutionLogs()
    ]);
    setLoading(false);
  };

  // 设置定时刷新
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // 手动刷新
  const handleRefresh = () => {
    refreshData();
  };

  // 更改刷新间隔
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(Number(e.target.value));
  };

  return (
    <div className="workflow-monitor">
      <div className="monitor-header">
        <h2>Workflow Monitor</h2>
        <div className="monitor-controls">
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="interval-selector">
            <label htmlFor="refresh-interval">Refresh interval: </label>
            <select 
              id="refresh-interval"
              value={refreshInterval} 
              onChange={handleIntervalChange}
            >
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="monitor-content">
        <div className="running-workflows">
          <h3>Running Workflows ({runningWorkflows.length})</h3>
          {runningWorkflows.length > 0 ? (
            <ul>
              {runningWorkflows.map(id => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>No workflows currently running</p>
          )}
        </div>

        <div className="execution-logs">
          <h3>Execution Logs</h3>
          {executionLogs.length > 0 ? (
            <div className="logs-container">
              {executionLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`log-entry status-${log.status}`}
                >
                  <div className="log-header">
                    <span className="workflow-name">{log.workflowName}</span>
                    {log.nodeName && (
                      <span className="node-info">
                        {log.nodeName} ({log.nodeType})
                      </span>
                    )}
                    <span className={`status-badge status-${log.status}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="log-message">
                    {log.message}
                  </div>
                  <div className="log-timestamp">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  {log.details && (
                    <div className="log-details">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No execution logs available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowMonitor;