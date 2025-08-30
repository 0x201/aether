import React, { useState, useEffect } from 'react';
import workflowService, { type ExecutionLog, type EtlExecutionResult } from '../services/workflowService';
import styled from 'styled-components';

// Styled Components
const WorkflowMonitorContainer = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
`;

const MonitorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  background-color: white;
  padding: 10px 0;
  z-index: 10;
`;

const MonitorControls = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const RefreshButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

const IntervalSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const MonitorContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SectionContainer = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
`;

const SectionTitle = styled.h3`
  margin-top: 0;
`;

const LogsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const LogItem = styled.div<{ status: string }>`
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.status-running {
    color: #007bff;
  }
  
  &.status-success {
    color: #28a745;
  }
  
  &.status-failed {
    color: #dc3545;
  }
`;

const LogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const LogTimestamp = styled.span`
  font-size: 0.85em;
  color: #6c757d;
`;

const LogStatus = styled.span`
  font-weight: bold;
  text-transform: uppercase;
`;

const LogWorkflow = styled.span`
  font-weight: bold;
`;

const LogMessage = styled.div`
  margin: 5px 0;
`;

const LogNode = styled.div`
  font-style: italic;
  color: #6c757d;
`;

const LogDetails = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #e9ecef;
  border-radius: 4px;
`;

const DetailsTitle = styled.h4`
  margin-top: 0;
`;

const EtlResultsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const EtlResult = styled.div<{ success: boolean }>`
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid ${props => props.success ? '#28a745' : '#dc3545'};
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ResultTitle = styled.h4`
  margin: 0;
`;

const ResultStatus = styled.span<{ success: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  background-color: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
`;

const StepResults = styled.div`
  margin-top: 10px;
`;

const StepResult = styled.div<{ success: boolean }>`
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 3px solid ${props => props.success ? '#28a745' : '#dc3545'};
`;

const StepResultContainer = styled.div`
  margin: 15px 0;
`;

const StepHeader = styled.h4`
  margin-top: 0;
`;

const StepDetails = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
`;

const DetailsList = styled.ul`
  margin: 10px 0;
  padding-left: 20px;
`;

const DetailItem = styled.li`
  margin: 5px 0;
`;

const WorkflowMonitor: React.FC = () => {
  const [runningWorkflows, setRunningWorkflows] = useState<string[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [etlResults, setEtlResults] = useState<EtlExecutionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds

  // 获取正在运行的工作流
  const fetchRunningWorkflows = async () => {
    try {
      const workflows = await workflowService.getRunningWorkflows();
      setRunningWorkflows(workflows);
      setError(null);
    } catch (err: any) {
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
    } catch (err: any) {
      setError('Failed to fetch execution logs');
      console.error('Error fetching execution logs:', err);
    }
  };

  // 获取ETL执行结果
  const fetchEtlResults = async () => {
    try {
      // 这里应该从后端获取ETL执行结果
      // 目前我们只是演示如何展示数据
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch ETL results');
      console.error('Error fetching ETL results:', err);
    }
  };

  // 刷新所有数据
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRunningWorkflows(),
      fetchExecutionLogs(),
      fetchEtlResults()
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

  // 渲染日志详情
  const renderLogDetails = (log: ExecutionLog) => {
    if (!log.details) return null;
    
    return (
      <LogDetails>
        <DetailsTitle>Details:</DetailsTitle>
        <DetailsList>
          {Object.entries(log.details).map(([key, value]) => (
            <DetailItem key={key}><strong>{key}:</strong> {JSON.stringify(value)}</DetailItem>
          ))}
        </DetailsList>
      </LogDetails>
    );
  };

  // 渲染ETL步骤结果
  const renderEtlStepResult = (step: any) => {
    return (
      <StepResult success={step.success}>
        <StepHeader>{step.stepName} ({step.stepType})</StepHeader>
        <p>Status: {step.success ? 'Success' : 'Failed'}</p>
        <p>Message: {step.message}</p>
        <p>Rows Affected: {step.rowsAffected}</p>
        <p>Duration: {new Date(step.endTime).getTime() - new Date(step.startTime).getTime()} ms</p>
        {step.details && (
          <StepDetails>
            <DetailsTitle>Details:</DetailsTitle>
            <DetailsList>
              {Object.entries(step.details).map(([key, value]) => (
                <DetailItem key={key}><strong>{key}:</strong> {JSON.stringify(value)}</DetailItem>
              ))}
            </DetailsList>
          </StepDetails>
        )}
      </StepResult>
    );
  };

  return (
    <WorkflowMonitorContainer>
      <MonitorHeader>
        <h2>Workflow Monitor</h2>
        <MonitorControls>
          <RefreshButton onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
          <IntervalSelector>
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
          </IntervalSelector>
        </MonitorControls>
      </MonitorHeader>

      {error && (
        <ErrorMessage>
          Error: {error}
        </ErrorMessage>
      )}

      <MonitorContent>
        <SectionContainer>
          <SectionTitle>Running Workflows ({runningWorkflows.length})</SectionTitle>
          {runningWorkflows.length > 0 ? (
            <ul>
              {runningWorkflows.map(id => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>No workflows currently running.</p>
          )}
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>Execution Logs</SectionTitle>
          {executionLogs.length > 0 ? (
            <LogsList>
              {executionLogs.map(log => (
                <LogItem key={log.id} status={log.status}>
                  <LogHeader>
                    <LogTimestamp>
                      {new Date(log.timestamp).toLocaleString()}
                    </LogTimestamp>
                    <LogStatus>{log.status}</LogStatus>
                    <LogWorkflow>{log.workflowName || log.workflowId}</LogWorkflow>
                  </LogHeader>
                  <LogMessage>
                    {log.message}
                  </LogMessage>
                  {log.nodeName && (
                    <LogNode>
                      Node: {log.nodeName} ({log.nodeType})
                    </LogNode>
                  )}
                  {renderLogDetails(log)}
                </LogItem>
              ))}
            </LogsList>
          ) : (
            <p>No execution logs found.</p>
          )}
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>ETL Execution Results</SectionTitle>
          {etlResults.length > 0 ? (
            <EtlResultsList>
              {etlResults.map(result => (
                <EtlResult key={result.executionId} success={result.success}>
                  <ResultHeader>
                    <ResultTitle>Workflow: {result.workflowId}</ResultTitle>
                    <ResultStatus success={result.success}>
                      {result.success ? 'Success' : 'Failed'}
                    </ResultStatus>
                  </ResultHeader>
                  <p>Execution ID: {result.executionId}</p>
                  <p>Message: {result.message}</p>
                  <p>Duration: {new Date(result.endTime).getTime() - new Date(result.startTime).getTime()} ms</p>
                  
                  <StepResults>
                    <h5>Step Results:</h5>
                    {result.stepResults.map((step: any, index: number) => (
                      <StepResultContainer key={index}>
                        {renderEtlStepResult(step)}
                      </StepResultContainer>
                    ))}
                  </StepResults>
                </EtlResult>
              ))}
            </EtlResultsList>
          ) : (
            <p>No ETL results found.</p>
          )}
        </SectionContainer>
      </MonitorContent>
    </WorkflowMonitorContainer>
  );
};

export default WorkflowMonitor;