import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import workflowService from '../services/workflowService';

// Styled Components
const VisualizationContainer = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: bold;
  font-size: 0.9rem;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const ChartContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
`;

const ChartWrapper = styled.div`
  flex: 1;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ChartTitle = styled.h3`
  margin-top: 0;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const DataVisualization: React.FC = () => {
  const [databases, setDatabases] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');
  
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);

  // 获取ETL数据库列表
  const fetchDatabases = async () => {
    try {
      const data = await workflowService.getEtlDatabases();
      setDatabases(data);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch ETL databases';
      setError(errorMessage);
      console.error('Error fetching ETL databases:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取选定数据库中的表列表
  const fetchTables = async (databaseName: string) => {
    if (!databaseName) return;
    
    try {
      const data = await workflowService.getEtlTables(databaseName);
      setTables(data);
      setError(null);
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
      
      // Set default columns for charting if available
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        if (columns.length >= 2) {
          setXColumn(columns[0]);
          setYColumn(columns[1]);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to fetch data for table ${tableName}`;
      setError(errorMessage);
      console.error(`Error fetching ETL table data for ${databaseName}.${tableName}:`, err);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDatabase) {
      fetchTables(selectedDatabase);
    } else {
      setTables([]);
      setSelectedTable('');
      setTableData([]);
    }
  }, [selectedDatabase]);

  useEffect(() => {
    if (selectedDatabase && selectedTable) {
      fetchTableData(selectedDatabase, selectedTable);
    } else {
      setTableData([]);
    }
  }, [selectedDatabase, selectedTable]);

  // Render bar chart
  const renderBarChart = () => {
    if (!barChartRef.current || tableData.length === 0 || !xColumn || !yColumn) return;
    
    // Clear previous chart
    barChartRef.current.innerHTML = '';
    
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = barChartRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select(barChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Process data
    const data = tableData.map(d => ({
      x: d[xColumn],
      y: +d[yColumn] || 0
    })).filter(d => !isNaN(d.y));
    
    if (data.length === 0) return;
    
    // X axis
    const x = d3.scaleBand()
      .domain(data.map(d => d.x))
      .range([0, width])
      .padding(0.1);
    
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) as number])
      .range([height, 0]);
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.x) as number)
      .attr('y', d => y(d.y))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.y))
      .attr('fill', '#007bff');
    
    // Add labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.top + 20)
      .attr('text-anchor', 'middle')
      .text(xColumn);
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 20)
      .attr('text-anchor', 'middle')
      .text(yColumn);
  };

  // Render pie chart
  const renderPieChart = () => {
    if (!pieChartRef.current || tableData.length === 0 || !xColumn || !yColumn) return;
    
    // Clear previous chart
    pieChartRef.current.innerHTML = '';
    
    const width = pieChartRef.current.clientWidth;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 20;
    
    const svg = d3.select(pieChartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
    
    // Process data
    const data = tableData.map(d => ({
      label: d[xColumn],
      value: +d[yColumn] || 0
    })).filter(d => !isNaN(d.value) && d.value > 0);
    
    if (data.length === 0) return;
    
    // Compute pie
    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);
    
    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);
    
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Draw pie slices
    const arcs = svg.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i.toString()));
    
    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text(d => d.data.label);
  };

  // Render line chart
  const renderLineChart = () => {
    if (!lineChartRef.current || tableData.length === 0 || !xColumn || !yColumn) return;
    
    // Clear previous chart
    lineChartRef.current.innerHTML = '';
    
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = lineChartRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select(lineChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Process data
    const data = tableData.map(d => ({
      x: d[xColumn],
      y: +d[yColumn] || 0
    })).filter(d => !isNaN(d.y));
    
    if (data.length === 0) return;
    
    // X axis
    const x = d3.scalePoint()
      .domain(data.map(d => d.x))
      .range([0, width]);
    
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) as number])
      .range([height, 0]);
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Line
    const line = d3.line<any>()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveMonotoneX);
    
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#007bff')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add points
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 4)
      .attr('fill', '#007bff');
    
    // Add labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.top + 20)
      .attr('text-anchor', 'middle')
      .text(xColumn);
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 20)
      .attr('text-anchor', 'middle')
      .text(yColumn);
  };

  // Render all charts
  useEffect(() => {
    if (tableData.length > 0) {
      renderBarChart();
      renderPieChart();
      renderLineChart();
    }
  }, [tableData, xColumn, yColumn]);

  const handleRefresh = () => {
    if (selectedDatabase && selectedTable) {
      fetchTableData(selectedDatabase, selectedTable);
    }
  };

  if (loading) {
    return <div>Loading visualization data...</div>;
  }

  return (
    <VisualizationContainer>
      <h2>Data Visualization</h2>
      
      {error && <ErrorMessage>Error: {error}</ErrorMessage>}
      
      <ControlsContainer>
        <ControlGroup>
          <Label>Database:</Label>
          <Select 
            value={selectedDatabase} 
            onChange={(e) => setSelectedDatabase(e.target.value)}
          >
            <option value="">Select Database</option>
            {databases.map(db => (
              <option key={db.name} value={db.name}>{db.name}</option>
            ))}
          </Select>
        </ControlGroup>
        
        <ControlGroup>
          <Label>Table:</Label>
          <Select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            disabled={!selectedDatabase}
          >
            <option value="">Select Table</option>
            {tables.map(table => (
              <option key={table.name} value={table.name}>{table.name}</option>
            ))}
          </Select>
        </ControlGroup>
        
        <ControlGroup>
          <Label>X Axis Column:</Label>
          <Select 
            value={xColumn} 
            onChange={(e) => setXColumn(e.target.value)}
            disabled={tableData.length === 0}
          >
            <option value="">Select Column</option>
            {tableData.length > 0 && Object.keys(tableData[0]).map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </Select>
        </ControlGroup>
        
        <ControlGroup>
          <Label>Y Axis Column:</Label>
          <Select 
            value={yColumn} 
            onChange={(e) => setYColumn(e.target.value)}
            disabled={tableData.length === 0}
          >
            <option value="">Select Column</option>
            {tableData.length > 0 && Object.keys(tableData[0]).map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </Select>
        </ControlGroup>
        
        <ControlGroup>
          <Label>&nbsp;</Label>
          <Button onClick={handleRefresh} disabled={!selectedDatabase || !selectedTable}>
            Refresh Data
          </Button>
        </ControlGroup>
      </ControlsContainer>
      
      {tableData.length > 0 ? (
        <ChartContainer>
          <ChartWrapper>
            <ChartTitle>Bar Chart</ChartTitle>
            <div ref={barChartRef}></div>
          </ChartWrapper>
          
          <ChartWrapper>
            <ChartTitle>Pie Chart</ChartTitle>
            <div ref={pieChartRef}></div>
          </ChartWrapper>
          
          <ChartWrapper>
            <ChartTitle>Line Chart</ChartTitle>
            <div ref={lineChartRef}></div>
          </ChartWrapper>
        </ChartContainer>
      ) : (
        <p>Select a database and table to visualize the data.</p>
      )}
    </VisualizationContainer>
  );
};

export default DataVisualization;