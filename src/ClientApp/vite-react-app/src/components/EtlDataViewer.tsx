import React, { useState, useEffect } from 'react';
import workflowService from '../services/workflowService';
import type { EtlDatabaseInfo, EtlTableInfo, EtlTableData, EtlExecutionResult } from '../services/workflowService';
import styled from 'styled-components';

// Styled Components
const EtlDataViewerContainer = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
`;

const ViewerHeader = styled.div`
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

const ViewerControls = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const ControlButton = styled.button<{ disabled?: boolean }>`
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

const ExecutionResult = styled.div<{ success: boolean }>`
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  background-color: ${props => props.success ? '#d4edda' : '#f8d7da'};
  border: 1px solid ${props => props.success ? '#c3e6cb' : '#f5c6cb'};
`;

const ExecutionTitle = styled.h3`
  margin-top: 0;
  color: ${props => props.color === 'success' ? '#155724' : '#721c24'};
`;

const StepResult = styled.div`
  margin: 15px 0;
  padding: 10px;
  background-color: #e9ecef;
  border-radius: 4px;
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

const DetailsTitle = styled.h5`
  margin-top: 0;
`;

const DetailsList = styled.ul`
  margin: 10px 0;
  padding-left: 20px;
`;

const DetailItem = styled.li`
  margin: 5px 0;
`;

const DataViewerContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SelectorContainer = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
`;

const SelectorTitle = styled.h3`
  margin-top: 0;
`;

const SelectorList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SelectorItem = styled.li<{ selected?: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #dee2e6;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #e9ecef;
  }
  
  ${props => props.selected && `
    background-color: #007bff;
    color: white;
  `}
`;

const TableContainer = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  grid-column: span 3;
`;

const TableTitle = styled.h3`
  margin-top: 0;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background-color: #e9ecef;
`;

const TableHeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
`;

const TableBodyCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const EtlDataViewer: React.FC = () => {
  const [databases, setDatabases] = useState<EtlDatabaseInfo[]>([]);
  const [tables, setTables] = useState<EtlTableInfo[]>([]);
  const [tableData, setTableData] = useState<EtlTableData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds
  const [executionResult, setExecutionResult] = useState<EtlExecutionResult | null>(null);

  // 获取ETL数据库列表
  const fetchDatabases = async () => {
    try {
      const data = await workflowService.getEtlDatabases();
      setDatabases(data);
      setError(null);
      
      // 如果有数据库，选择第一个
      if (data.length > 0 && !selectedDatabase) {
        setSelectedDatabase(data[0].name);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch ETL databases';
      setError(errorMessage);
      console.error('Error fetching ETL databases:', err);
    }
  };

  // 获取选定数据库中的表列表
  const fetchTables = async (databaseName: string) => {
    if (!databaseName) return;
    
    try {
      const data = await workflowService.getEtlTables(databaseName);
      setTables(data);
      setError(null);
      
      // 如果有表，选择第一个
      if (data.length > 0 && !selectedTable) {
        setSelectedTable(data[0].name);
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to fetch tables for database ${databaseName}`;
      setError(errorMessage);
      console.error(`Error fetching ETL tables for database ${databaseName}:`, err);
    }
  };

  // 获取选定表的数据
  const fetchTableData = async (databaseName: string, tableName: string) => {
    if (!databaseName || !tableName) return;
    
    try {
      const data = await workflowService.getEtlTableDataNew(databaseName, tableName);
      setTableData(data);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || `Failed to fetch data for table ${tableName}`;
      setError(errorMessage);
      console.error(`Error fetching ETL table data for ${databaseName}.${tableName}:`, err);
    }
  };

  // 执行ETL工作流
  const executeEtlWorkflow = async () => {
    try {
      setExecuting(true);
      setError(null);
      
      // 执行ETL工作流 (使用ID 4，这是我们的ETL工作流)
      const result = await workflowService.executeEtlWorkflow('4');
      setExecutionResult(result);
      
      // 显示执行结果
      if (result.success) {
        alert(`ETL workflow executed successfully! Processed ${result.stepResults.reduce((acc, step) => acc + step.rowsAffected, 0)} rows.`);
      } else {
        alert(`ETL workflow failed: ${result.message}`);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to execute ETL workflow';
      setError(errorMessage);
      console.error('Error executing ETL workflow:', err);
    } finally {
      setExecuting(false);
    }
  };

  // 刷新所有数据
  const refreshData = async () => {
    setLoading(true);
    await fetchDatabases();
    if (selectedDatabase) {
      await fetchTables(selectedDatabase);
      if (selectedTable) {
        await fetchTableData(selectedDatabase, selectedTable);
      }
    }
    setLoading(false);
  };

  // 设置定时刷新
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, selectedDatabase, selectedTable]);

  // 当选定的数据库改变时，获取表列表
  useEffect(() => {
    if (selectedDatabase) {
      fetchTables(selectedDatabase);
      setSelectedTable(''); // 重置选定的表
      setTableData([]); // 清空表数据
    } else {
      setTables([]);
      setSelectedTable('');
      setTableData([]);
    }
  }, [selectedDatabase]);

  // 当选定的表改变时，获取表数据
  useEffect(() => {
    if (selectedDatabase && selectedTable) {
      fetchTableData(selectedDatabase, selectedTable);
    } else {
      setTableData([]);
    }
  }, [selectedDatabase, selectedTable]);

  // 手动刷新
  const handleRefresh = () => {
    refreshData();
  };

  // 更改刷新间隔
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(Number(e.target.value));
  };

  // 渲染执行结果详情
  const renderExecutionResult = () => {
    if (!executionResult) return null;

    return (
      <ExecutionResult success={executionResult.success}>
        <ExecutionTitle>ETL Execution Result</ExecutionTitle>
        <p><strong>Status:</strong> {executionResult.success ? 'Success' : 'Failed'}</p>
        <p><strong>Message:</strong> {executionResult.message}</p>
        <p><strong>Execution Time:</strong> {new Date(executionResult.endTime).getTime() - new Date(executionResult.startTime).getTime()} ms</p>
        <details>
          <summary>Step Details</summary>
          {executionResult.stepResults.map((step, index) => (
            <StepResult key={index}>
              <StepHeader>{step.stepName} ({step.stepType})</StepHeader>
              <p>Status: {step.success ? 'Success' : 'Failed'}</p>
              <p>Message: {step.message}</p>
              <p>Rows Affected: {step.rowsAffected}</p>
              <StepDetails>
                <DetailsTitle>Details:</DetailsTitle>
                <DetailsList>
                  <DetailItem><strong>Start Time:</strong> {new Date(step.startTime).toLocaleString()}</DetailItem>
                  <DetailItem><strong>End Time:</strong> {new Date(step.endTime).toLocaleString()}</DetailItem>
                  <DetailItem><strong>Duration:</strong> {new Date(step.endTime).getTime() - new Date(step.startTime).getTime()} ms</DetailItem>
                  {Object.entries(step.details).map(([key, value]) => (
                    <DetailItem key={key}><strong>{key}:</strong> {JSON.stringify(value)}</DetailItem>
                  ))}
                </DetailsList>
              </StepDetails>
            </StepResult>
          ))}
        </details>
      </ExecutionResult>
    );
  };

  if (loading) {
    return <div>Loading ETL data...</div>;
  }

  return (
    <EtlDataViewerContainer>
      <ViewerHeader>
        <h2>ETL Data Viewer</h2>
        <ViewerControls>
          <ControlButton onClick={executeEtlWorkflow} disabled={executing}>
            {executing ? 'Executing...' : 'Execute ETL Workflow'}
          </ControlButton>
          <ControlButton onClick={handleRefresh} disabled={loading}>
            Refresh
          </ControlButton>
          <IntervalSelector>
            <label>Refresh Interval:</label>
            <select value={refreshInterval} onChange={handleIntervalChange}>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
            </select>
          </IntervalSelector>
        </ViewerControls>
      </ViewerHeader>

      {error && <ErrorMessage>Error: {error}</ErrorMessage>}
      
      {executionResult && renderExecutionResult()}

      <DataViewerContent>
        <SelectorContainer>
          <SelectorTitle>Databases</SelectorTitle>
          <SelectorList>
            {databases.map((db) => (
              <SelectorItem
                key={db.name}
                selected={selectedDatabase === db.name}
                onClick={() => setSelectedDatabase(db.name)}
              >
                {db.name}
              </SelectorItem>
            ))}
          </SelectorList>
        </SelectorContainer>

        <SelectorContainer>
          <SelectorTitle>Tables</SelectorTitle>
          <SelectorList>
            {tables.map((table) => (
              <SelectorItem
                key={table.name}
                selected={selectedTable === table.name}
                onClick={() => setSelectedTable(table.name)}
              >
                {table.name}
              </SelectorItem>
            ))}
          </SelectorList>
        </SelectorContainer>

        {tableData.length > 0 && (
          <TableContainer>
            <TableTitle>
              {selectedDatabase}.{selectedTable} ({tableData.length} rows)
            </TableTitle>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <StyledTable>
                <TableHeader>
                  <tr>
                    {Object.keys(tableData[0]).map((column) => (
                      <TableHeaderCell key={column}>{column}</TableHeaderCell>
                    ))}
                  </tr>
                </TableHeader>
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, colIndex) => (
                        <TableBodyCell key={colIndex}>
                          {value === null ? 'NULL' : String(value)}
                        </TableBodyCell>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            </div>
          </TableContainer>
        )}
      </DataViewerContent>
    </EtlDataViewerContainer>
  );
};

export default EtlDataViewer;