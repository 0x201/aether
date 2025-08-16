import React, { useState } from 'react';
import './App.css';
import WorkflowEditor from './components/WorkflowEditor';
import WorkflowList from './components/WorkflowList';
import WorkflowMonitor from './components/WorkflowMonitor';
import EtlDataViewer from './components/EtlDataViewer';
import { type Workflow } from './services/workflowService';

function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'list' | 'monitor' | 'etl'>('editor');
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setActiveTab('editor');
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Workflow Editor</h1>
        <nav className="app-nav">
          <button 
            className={activeTab === 'list' ? 'active' : ''}
            onClick={() => setActiveTab('list')}
          >
            Workflows
          </button>
          <button 
            className={activeTab === 'editor' ? 'active' : ''}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button 
            className={activeTab === 'monitor' ? 'active' : ''}
            onClick={() => setActiveTab('monitor')}
          >
            Monitor
          </button>
          <button 
            className={activeTab === 'etl' ? 'active' : ''}
            onClick={() => setActiveTab('etl')}
          >
            ETL Data
          </button>
        </nav>
      </header>
      <main className="app-main">
        {activeTab === 'editor' ? (
          <WorkflowEditor initialWorkflow={editingWorkflow} />
        ) : activeTab === 'list' ? (
          <WorkflowList onEditWorkflow={handleEditWorkflow} />
        ) : activeTab === 'monitor' ? (
          <WorkflowMonitor />
        ) : (
          <EtlDataViewer />
        )}
      </main>
    </div>
  );
}

export default App;