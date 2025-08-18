import React, { useState, useEffect } from 'react';
import workflowService, { type Workflow, type EtlExecutionResult } from '../services/workflowService';
import styled from 'styled-components';

interface WorkflowListProps {
  onEditWorkflow: (workflow: Workflow) => void;
}

// Styled Components
const WorkflowListContainer = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
`;

const ListHeader = styled.div`
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

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const WorkflowsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const WorkflowCard = styled.div`
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #333;
`;

const WorkflowActions = styled.div`
  display: flex;
  gap: 5px;
`;

const ActionButton = styled.button<{ primary?: boolean; success?: boolean; danger?: boolean; disabled?: boolean }>`
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.85em;
  background-color: ${props => {
    if (props.disabled) return '#6c757d';
    if (props.danger) return '#dc3545';
    if (props.success) return '#28a745';
    return '#007bff';
  }};
  color: white;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

const CardBody = styled.div`
  margin-bottom: 15px;
`;

const CardBodyText = styled.p`
  margin: 5px 0;
  font-size: 0.9em;
  color: #555;
`;

const CardFooter = styled.div`
  border-top: 1px solid #dee2e6;
  padding-top: 15px;
`;

const ExecutionResult = styled.div<{ success: boolean }>`
  background-color: ${props => props.success ? '#d4edda' : '#f8d7da'};
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.success ? '#c3e6cb' : '#f5c6cb'};
`;

const ExecutionTitle = styled.h4`
  margin-top: 0;
  color: #155724;
`;

const StepResult = styled.div`
  margin: 10px 0;
  padding: 10px;
  background-color: #e9ecef;
  border-radius: 4px;
`;

const StepTitle = styled.h5`
  margin-top: 0;
`;

const WorkflowList: React.FC<WorkflowListProps> = ({ onEditWorkflow }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, EtlExecutionResult>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getAllWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch workflows');
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleExecute = async (workflowId: string) => {
    try {
      setExecuting(workflowId);
      const result = await workflowService.executeWorkflow(workflowId);
      console.log('Workflow execution started:', result);
      
      // 对于ETL工作流，我们也可以直接执行ETL
      if (workflowId === '4') { // ETL工作流ID
        const etlResult = await workflowService.executeEtlWorkflow(workflowId);
        setExecutionResults(prev => ({
          ...prev,
          [workflowId]: etlResult
        }));
      }
      
      // 刷新工作流列表
      await fetchWorkflows();
    } catch (err: any) {
      setError('Failed to execute workflow');
      console.error('Error executing workflow:', err);
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await workflowService.deleteWorkflow(workflowId);
        await fetchWorkflows(); // Refresh the list
      } catch (err: any) {
        setError('Failed to delete workflow');
        console.error('Error deleting workflow:', err);
      }
    }
  };

  const formatExecutionResult = (result: EtlExecutionResult) => {
    return (
      <ExecutionResult success={result.success}>
        <ExecutionTitle>Execution Result</ExecutionTitle>
        <p><strong>Status:</strong> {result.success ? 'Success' : 'Failed'}</p>
        <p><strong>Message:</strong> {result.message}</p>
        <p><strong>Duration:</strong> {new Date(result.endTime).getTime() - new Date(result.startTime).getTime()} ms</p>
        <details>
          <summary>Step Details</summary>
          {result.stepResults.map((step, index) => (
            <StepResult key={index}>
              <StepTitle>{step.stepName} ({step.stepType})</StepTitle>
              <p>Status: {step.success ? 'Success' : 'Failed'}</p>
              <p>Message: {step.message}</p>
              <p>Rows Affected: {step.rowsAffected}</p>
              <p>Duration: {new Date(step.endTime).getTime() - new Date(step.startTime).getTime()} ms</p>
            </StepResult>
          ))}
        </details>
      </ExecutionResult>
    );
  };

  if (loading) {
    return <div>Loading workflows...</div>;
  }

  return (
    <WorkflowListContainer>
      <ListHeader>
        <h2>Workflows</h2>
        <ActionButton onClick={fetchWorkflows}>
          Refresh
        </ActionButton>
      </ListHeader>

      {error && (
        <ErrorMessage>
          Error: {error}
        </ErrorMessage>
      )}

      <WorkflowsGrid>
        {workflows.map(workflow => (
          <WorkflowCard key={workflow.id}>
            <CardHeader>
              <CardTitle>{workflow.name}</CardTitle>
              <WorkflowActions>
                <ActionButton 
                  onClick={() => onEditWorkflow(workflow)}
                  primary
                >
                  Edit
                </ActionButton>
                <ActionButton 
                  onClick={() => handleExecute(workflow.id)}
                  disabled={executing === workflow.id}
                  success
                >
                  {executing === workflow.id ? 'Executing...' : 'Execute'}
                </ActionButton>
                <ActionButton 
                  onClick={() => handleDelete(workflow.id)}
                  danger
                >
                  Delete
                </ActionButton>
              </WorkflowActions>
            </CardHeader>
            <CardBody>
              <CardBodyText><strong>ID:</strong> {workflow.id}</CardBodyText>
              <CardBodyText><strong>Nodes:</strong> {workflow.nodes.length}</CardBodyText>
              <CardBodyText><strong>Connections:</strong> {workflow.connections.length}</CardBodyText>
              <CardBodyText><strong>Created:</strong> {new Date(workflow.createdAt).toLocaleString()}</CardBodyText>
              {workflow.updatedAt && (
                <CardBodyText><strong>Updated:</strong> {new Date(workflow.updatedAt).toLocaleString()}</CardBodyText>
              )}
            </CardBody>
            {executionResults[workflow.id] && (
              <CardFooter>
                {formatExecutionResult(executionResults[workflow.id])}
              </CardFooter>
            )}
          </WorkflowCard>
        ))}
      </WorkflowsGrid>
    </WorkflowListContainer>
  );
};

export default WorkflowList;