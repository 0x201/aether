import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import workflowService from '../services/workflowService';
import { useSignalR } from '../contexts/SignalRContext';

// Styled Components
const DashboardContainer = styled.div`
  padding: 20px;
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const StatusIndicator = styled.span<{ status: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => {
    switch (props.status) {
      case 'running': return '#ffc107';
      case 'success': return '#28a745';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  }};
`;

const JobList = styled.ul`
  list-style: none;
  padding: 0;
`;

const JobItem = styled.li`
  padding: 10px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Dashboard: React.FC = () => {
  const [workflowsCount, setWorkflowsCount] = useState(0);
  const [runningJobs, setRunningJobs] = useState<string[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const { connection, isConnected } = useSignalR();

  useEffect(() => {
    // Fetch initial data
    fetchDashboardData();
    
    // Set up SignalR listeners
    if (connection) {
      connection.on('JobStatusUpdate', (data) => {
        console.log('Job status update received:', data);
        // Update UI with job status
      });
      
      connection.on('WorkflowExecutionUpdate', (data) => {
        console.log('Workflow execution update received:', data);
        // Update UI with workflow execution status
      });
    }
    
    return () => {
      if (connection) {
        connection.off('JobStatusUpdate');
        connection.off('WorkflowExecutionUpdate');
      }
    };
  }, [connection]);

  const fetchDashboardData = async () => {
    try {
      // Fetch workflows count
      const workflows = await workflowService.getAllWorkflows();
      setWorkflowsCount(workflows.length);
      
      // Fetch running jobs
      const jobs = await workflowService.getRunningWorkflows();
      setRunningJobs(jobs);
      
      // Fetch recent jobs/logs
      const logs = await workflowService.getExecutionLogs();
      setRecentJobs(logs.slice(0, 5)); // Get last 5 logs
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <DashboardContainer>
      <Section>
        <SectionTitle>System Overview</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatValue>{workflowsCount}</StatValue>
            <StatLabel>Workflows</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{runningJobs.length}</StatValue>
            <StatLabel>Running Jobs</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{recentJobs.length}</StatValue>
            <StatLabel>Recent Executions</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>
              <StatusIndicator status={isConnected ? 'success' : 'failed'} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </StatValue>
            <StatLabel>System Status</StatLabel>
          </StatCard>
        </StatsGrid>
      </Section>
      
      <Section>
        <SectionTitle>Running Jobs</SectionTitle>
        {runningJobs.length > 0 ? (
          <JobList>
            {runningJobs.map((jobId, index) => (
              <JobItem key={index}>
                <strong>Job ID:</strong> {jobId}
              </JobItem>
            ))}
          </JobList>
        ) : (
          <p>No running jobs</p>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Recent Executions</SectionTitle>
        {recentJobs.length > 0 ? (
          <JobList>
            {recentJobs.map((log, index) => (
              <JobItem key={index}>
                <div>
                  <strong>{log.workflowName || 'Unknown Workflow'}</strong>
                </div>
                <div>
                  <StatusIndicator status={log.status} />
                  Status: {log.status}
                </div>
                <div>
                  <small>{new Date(log.timestamp).toLocaleString()}</small>
                </div>
              </JobItem>
            ))}
          </JobList>
        ) : (
          <p>No recent executions</p>
        )}
      </Section>
    </DashboardContainer>
  );
};

export default Dashboard;