// 工作流API服务，用于与后端API交互
const API_BASE_URL = 'http://localhost:5205/api';

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
  status?: string;
}

export interface NodeData {
  label: string;
  description?: string;
  operatorType: string;
  taskParams?: Record<string, any>;
  retries?: number;
  retryDelay?: number;
  priorityWeight?: number;
  queue?: string;
  pool?: string;
  upstreamTasks?: string[];
  downstreamTasks?: string[];
  triggerRule?: string;
  startDate?: string;
  endDate?: string;
  sla?: number;
  triggerCondition?: string;
  additionalConfig?: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Position {
  x: number;
  y: number;
}

// 添加执行日志接口
export interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

// 添加工作流状态接口
export interface WorkflowStatus {
  workflowId: string;
  workflowName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastExecutionTime?: string;
  message: string;
}

// 添加ETL执行结果接口
export interface EtlExecutionResult {
  workflowId: string;
  executionId: string;
  success: boolean;
  message: string;
  startTime: string;
  endTime: string;
  stepResults: EtlStepResult[];
  metadata: Record<string, any>;
}

export interface EtlStepResult {
  stepName: string;
  stepType: string;
  success: boolean;
  message: string;
  rowsAffected: number;
  startTime: string;
  endTime: string;
  details: Record<string, any>;
}

// 添加数据库和表信息接口
export interface EtlDatabaseInfo {
  name: string;
}

export interface EtlTableInfo {
  name: string;
}

export interface EtlTableData {
  [columnName: string]: any;
}

class WorkflowService {
  // 获取所有工作流
  async getAllWorkflows(): Promise<Workflow[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch workflows: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching workflows:', error);
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }
  }

  // 根据ID获取工作流
  async getWorkflowById(id: string): Promise<Workflow> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch workflow: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching workflow ${id}:`, error);
      throw new Error(`Failed to fetch workflow ${id}: ${error.message}`);
    }
  }

  // 创建新工作流
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create workflow: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  // 更新工作流
  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update workflow: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error updating workflow ${id}:`, error);
      throw new Error(`Failed to update workflow ${id}: ${error.message}`);
    }
  }

  // 删除工作流
  async deleteWorkflow(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete workflow: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`Error deleting workflow ${id}:`, error);
      throw new Error(`Failed to delete workflow ${id}: ${error.message}`);
    }
  }

  // 执行工作流
  async executeWorkflow(id: string): Promise<{ workflowInstanceId: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}/execute`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute workflow: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error executing workflow ${id}:`, error);
      throw new Error(`Failed to execute workflow ${id}: ${error.message}`);
    }
  }

  // 获取正在运行的工作流
  async getRunningWorkflows(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/running`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch running workflows: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching running workflows:', error);
      throw new Error(`Failed to fetch running workflows: ${error.message}`);
    }
  }

  // 获取工作流执行日志
  async getExecutionLogs(): Promise<ExecutionLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/logs`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch execution logs: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching execution logs:', error);
      throw new Error(`Failed to fetch execution logs: ${error.message}`);
    }
  }

  // 获取特定工作流实例的日志
  async getWorkflowExecutionLogs(workflowInstanceId: string): Promise<ExecutionLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/logs/${workflowInstanceId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch execution logs for workflow instance ${workflowInstanceId}: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching execution logs for workflow instance ${workflowInstanceId}:`, error);
      throw new Error(`Failed to fetch execution logs for workflow instance ${workflowInstanceId}: ${error.message}`);
    }
  }

  // 获取工作流状态
  async getWorkflowStatus(id: string): Promise<WorkflowStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${id}/status`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch workflow status: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching workflow status for ${id}:`, error);
      throw new Error(`Failed to fetch workflow status for ${id}: ${error.message}`);
    }
  }

  // 获取ETL数据
  async getEtlData(): Promise<Record<string, any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/etl/data`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ETL data: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching ETL data:', error);
      throw new Error(`Failed to fetch ETL data: ${error.message}`);
    }
  }

  // 获取特定表的ETL数据
  async getEtlTableData(tableName: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/etl/table/${tableName}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ETL data for table ${tableName}: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching ETL data for table ${tableName}:`, error);
      throw new Error(`Failed to fetch ETL data for table ${tableName}: ${error.message}`);
    }
  }

  // 执行ETL工作流
  async executeEtlWorkflow(workflowId: string): Promise<EtlExecutionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/etl/execute/${workflowId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute ETL workflow: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error executing ETL workflow ${workflowId}:`, error);
      throw new Error(`Failed to execute ETL workflow ${workflowId}: ${error.message}`);
    }
  }

  // 获取ETL数据库列表
  async getEtlDatabases(): Promise<EtlDatabaseInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/etl/databases`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ETL databases: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching ETL databases:', error);
      throw new Error(`Failed to fetch ETL databases: ${error.message}`);
    }
  }

  // 获取特定数据库中的表列表
  async getEtlTables(databaseName: string): Promise<EtlTableInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/etl/databases/${databaseName}/tables`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ETL tables: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching ETL tables for database ${databaseName}:`, error);
      throw new Error(`Failed to fetch ETL tables for database ${databaseName}: ${error.message}`);
    }
  }

  // 获取特定表的数据
  async getEtlTableDataNew(databaseName: string, tableName: string): Promise<EtlTableData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/etl/databases/${databaseName}/tables/${tableName}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ETL table data: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching ETL table data for ${databaseName}.${tableName}:`, error);
      throw new Error(`Failed to fetch ETL table data for ${databaseName}.${tableName}: ${error.message}`);
    }
  }
}

export default new WorkflowService();