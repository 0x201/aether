import React from 'react';

// Airflow风格的节点数据结构
interface AirflowTaskData {
  // 基本信息
  label: string;
  description?: string;
  
  // Airflow Operator类型
  operatorType: string; // 对应Airflow中的Operator类型，如 'BashOperator', 'PythonOperator' 等
  
  // Airflow任务参数
  taskParams?: Record<string, any>;
  
  // Airflow特定配置
  retries?: number;
  retryDelay?: number; // 秒
  priorityWeight?: number;
  queue?: string;
  pool?: string;
  
  // 依赖关系
  upstreamTasks?: string[]; // 上游任务列表
  downstreamTasks?: string[]; // 下游任务列表
  
  // 触发规则
  triggerRule?: 'all_success' | 'all_failed' | 'all_done' | 'one_success' | 'one_failed' | 'none_failed' | 'none_failed_or_skipped' | 'none_skipped' | 'dummy';
  
  // 时间相关
  start_date?: string; // ISO格式日期
  end_date?: string; // ISO格式日期
  sla?: number; // 服务等级协议（分钟）
  
  // 其他配置
  [key: string]: string | number | boolean | object | null | undefined;
}

interface AirflowTask {
  id: string;
  // Airflow风格的任务类型（对应Operator类型）
  type: 'start' | 'end' | 'bash' | 'python' | 'email' | 'http' | 'sql' | 'branch' | 'subdag' | 'sensor' | 'dummy' | 'custom';
  position: { x: number; y: number };
  data: AirflowTaskData;
  
  // Airflow风格的状态
  status?: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'upstream_failed' | 'retry' | 'no_status';
  
  // 执行信息
  executionInfo?: {
    startTime?: string;
    endTime?: string;
    duration?: number; // 毫秒
    tryNumber?: number;
  };
}

interface WorkflowNodeProps {
  node: AirflowTask;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (nodeId: string) => void;
  onStartConnection: (nodeId: string, handleType: 'source' | 'target', handleId?: string) => void;
  onCompleteConnection: (nodeId: string, handleType: 'source' | 'target', handleId?: string) => void;
  onDragStart: (nodeId: string, x: number, y: number) => void;
  onEdit: () => void;
  connecting: boolean;
  onNodeStatusChange: (nodeId: string, status: AirflowTask['status']) => void;
  isDragging?: boolean;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onStartConnection,
  onCompleteConnection,
  onDragStart,
  onEdit,
  connecting,
  isDragging = false
}) => {
  const getNodeClass = () => {
    let baseClass = 'workflow-node';
    if (isSelected) baseClass += ' selected';
    if (connecting) baseClass += ' connecting';
    if (isDragging) baseClass += ' dragging';
    
    // 基于Airflow风格的类型类
    baseClass += ` node-type-${node.type}`;
    
    // 添加状态类
    if (node.status) {
      baseClass += ` status-${node.status}`;
    }
    
    return baseClass;
  };

  const getNodeStyle = () => {
    return {
      transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      position: 'absolute' as const
    };
  };

  const renderNodeContent = () => {
    // 基于Airflow风格的节点内容渲染
    const getOperatorIcon = () => {
      switch (node.type) {
        case 'bash':
          return '쉘';
        case 'python':
          return '🐍';
        case 'email':
          return '✉️';
        case 'http':
          return '🌐';
        case 'sql':
          return '🗄️';
        case 'branch':
          return '🔀';
        case 'subdag':
          return '📂';
        case 'sensor':
          return '📡';
        case 'dummy':
          return '🔘';
        case 'custom':
          return '🔧';
        case 'extract':
          return '📤';
        case 'validate':
          return '✅';
        case 'load':
          return '📥';
        default:
          return '';
      }
    };

    const getOperatorDisplayName = () => {
      switch (node.type) {
        case 'start':
          return 'Start';
        case 'end':
          return 'End';
        case 'bash':
          return 'Bash';
        case 'python':
          return 'Python';
        case 'email':
          return 'Email';
        case 'http':
          return 'HTTP';
        case 'sql':
          return 'SQL';
        case 'branch':
          return 'Branch';
        case 'subdag':
          return 'SubDAG';
        case 'sensor':
          return 'Sensor';
        case 'dummy':
          return 'Task';
        case 'custom':
          return 'Custom';
        case 'extract':
          return 'Extract';
        case 'validate':
          return 'Validate';
        case 'load':
          return 'Load';
        default:
          return node.type.charAt(0).toUpperCase() + node.type.slice(1);
      }
    };

    return (
      <div className="node-content">
        <div className="node-header">
          <div className="node-operator-icon">{getOperatorIcon()}</div>
          <div className="node-title">
            <div className="node-label">{node.data.label || getOperatorDisplayName()}</div>
            <div className="node-type-label">{getOperatorDisplayName()}</div>
          </div>
        </div>
        {node.status && (
          <div className="node-status">
            <span className={`status-indicator status-${node.status}`}></span>
            {node.status.replace('_', ' ')}
          </div>
        )}
        {node.executionInfo?.duration && (
          <div className="node-duration">
            {Math.round(node.executionInfo.duration)}ms
          </div>
        )}
      </div>
    );
  };

  // 基于Airflow风格的节点句柄配置
  const renderHandles = () => {
    // 所有节点都有输入和输出句柄，除了特殊节点
    return (
      <>
        {/* 输入句柄 */}
        <div
          className="handle handle-input"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnection(node.id, 'target');
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onCompleteConnection(node.id, 'target');
          }}
        />
        
        {/* 输出句柄 */}
        <div
          className="handle handle-output"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnection(node.id, 'source');
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onCompleteConnection(node.id, 'source');
          }}
        />
      </>
    );
  };

  return (
    <div
      className={getNodeClass()}
      style={getNodeStyle()}
      onMouseDown={(e) => {
        e.stopPropagation(); // 阻止事件冒泡到画布
        if (e.button === 0) { // Left click
          // 只有在节点未被选中时才调用 onSelect
          // 如果节点已被选中，则不调用 onSelect，这样可以防止取消选择
          if (!isSelected) {
            onSelect();
          }
          onDragStart(node.id, e.clientX, e.clientY);
        }
      }}
      onDoubleClick={onEdit}
    >
      {renderHandles()}
      {renderNodeContent()}
      
      {isSelected && (
        <button 
          className="delete-button" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default WorkflowNode;