import React, { useState, useEffect } from 'react';
import workflowService, { type Workflow } from '../services/workflowService';

interface WorkflowListProps {
  onEditWorkflow?: (workflow: Workflow) => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ onEditWorkflow }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getAllWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch workflows');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteWorkflow = async (id: string) => {
    try {
      const result = await workflowService.executeWorkflow(id);
      alert(`Workflow execution started. Instance ID: ${result.workflowInstanceId}`);
    } catch (err) {
      setError('Failed to execute workflow');
      console.error(err);
    }
  };

  const handleEditClick = (workflow: Workflow) => {
    if (onEditWorkflow) {
      onEditWorkflow(workflow);
    }
  };

  if (loading) return <div>Loading workflows...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="workflow-list">
      <h2>Available Workflows</h2>
      <ul>
        {workflows.map(workflow => (
          <li key={workflow.id} className="workflow-item">
            <div className="workflow-header">
              <h3>{workflow.name}</h3>
              <div className="workflow-actions">
                <button onClick={() => handleExecuteWorkflow(workflow.id)}>
                  Execute
                </button>
                <button onClick={() => handleEditClick(workflow)}>
                  Edit
                </button>
              </div>
            </div>
            <div className="workflow-details">
              <p>Nodes: {workflow.nodes.length}</p>
              <p>Connections: {workflow.connections.length}</p>
              <p>Created: {new Date(workflow.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={() => setSelectedWorkflow(workflow)}>
              View Details
            </button>
          </li>
        ))}
      </ul>

      {selectedWorkflow && (
        <div className="workflow-detail-modal">
          <div className="modal-content">
            <h2>{selectedWorkflow.name} - Details</h2>
            <pre>{JSON.stringify(selectedWorkflow, null, 2)}</pre>
            <button onClick={() => setSelectedWorkflow(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowList;