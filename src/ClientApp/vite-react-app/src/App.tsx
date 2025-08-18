import React, { useState } from 'react';
import './App.css';
import WorkflowEditor from './components/WorkflowEditor';
import WorkflowList from './components/WorkflowList';
import WorkflowMonitor from './components/WorkflowMonitor';
import EtlDataViewer from './components/EtlDataViewer';
import Dashboard from './components/Dashboard';
import DataVisualization from './components/DataVisualization';
import { type Workflow } from './services/workflowService';
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Styled Components
const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background-color: #3498db;
  }
`;

const MainContent = styled.main`
  width: 100%;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
`;

function App() {
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
  };

  return (
    <Router>
      <AppContainer>
        <Header>
          <h1>ETL Workflow System</h1>
          <Nav>
            <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
              Dashboard
            </NavLink>
            <NavLink to="/workflows" className={({ isActive }) => isActive ? "active" : ""}>
              Workflows
            </NavLink>
            <NavLink to="/editor" className={({ isActive }) => isActive ? "active" : ""}>
              Editor
            </NavLink>
            <NavLink to="/monitor" className={({ isActive }) => isActive ? "active" : ""}>
              Monitor
            </NavLink>
            <NavLink to="/etl-data" className={({ isActive }) => isActive ? "active" : ""}>
              ETL Data
            </NavLink>
            <NavLink to="/visualization" className={({ isActive }) => isActive ? "active" : ""}>
              Visualization
            </NavLink>
          </Nav>
        </Header>
        <MainContent>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workflows" element={
              <WorkflowList onEditWorkflow={handleEditWorkflow} />
            } />
            <Route path="/editor" element={
              <WorkflowEditor initialWorkflow={editingWorkflow} />
            } />
            <Route path="/monitor" element={<WorkflowMonitor />} />
            <Route path="/etl-data" element={<EtlDataViewer />} />
            <Route path="/visualization" element={<DataVisualization />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </Router>
  );
}

export default App;