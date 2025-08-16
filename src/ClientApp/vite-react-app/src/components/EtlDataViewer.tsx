import React, { useState, useEffect } from 'react';
import workflowService from '../services/workflowService';
import type { EtlDatabaseInfo, EtlTableInfo, EtlTableData } from '../services/workflowService';

const EtlDataViewer: React.FC = () => {
  const [databases, setDatabases] = useState<EtlDatabaseInfo[]>([]);
  const [tables, setTables] = useState<EtlTableInfo[]>([]);
  const [tableData, setTableData] = useState<EtlTableData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds

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

  // 获取表头
  const getTableHeaders = (data: EtlTableData[]): string[] => {
    if (!data || data.length === 0) return [];
    
    const headers = new Set<string>();
    data.forEach(row => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => headers.add(key));
      }
    });
    
    return Array.from(headers);
  };

  // 渲染表格数据
  const renderTableData = (data: EtlTableData[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="no-data">
          <p>No data available</p>
        </div>
      );
    }

    const headers = getTableHeaders(data);

    return (
      <div className="table-container">
        <table className="etl-table">
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {headers.map(header => (
                  <td key={`${index}-${header}`}>
                    {row && typeof row === 'object' && row.hasOwnProperty(header) 
                      ? typeof row[header] === 'object' && row[header] !== null
                        ? JSON.stringify(row[header]) 
                        : String(row[header] ?? '')
                      : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="etl-data-viewer">
      <div className="viewer-header">
        <h2>ETL Data Viewer</h2>
        <div className="viewer-controls">
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

      <div className="viewer-content">
        <div className="database-selector">
          <label htmlFor="database-select">Select database: </label>
          <select 
            id="database-select"
            value={selectedDatabase} 
            onChange={(e) => setSelectedDatabase(e.target.value)}
          >
            <option value="">-- Select Database --</option>
            {databases.map(database => (
              <option key={database.name} value={database.name}>
                {database.name}
              </option>
            ))}
          </select>
        </div>

        {selectedDatabase && (
          <div className="table-selector">
            <label htmlFor="table-select">Select table: </label>
            <select 
              id="table-select"
              value={selectedTable} 
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={tables.length === 0}
            >
              <option value="">-- Select Table --</option>
              {tables.map(table => (
                <option key={table.name} value={table.name}>
                  {table.name} ({tableData.length} rows)
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedDatabase && selectedTable && (
          <div className="table-data">
            <h3>{selectedDatabase}.{selectedTable}</h3>
            {renderTableData(tableData)}
          </div>
        )}

        {!selectedDatabase && !loading && (
          <p>Please select a database to view ETL data</p>
        )}
      </div>
    </div>
  );
};

export default EtlDataViewer;