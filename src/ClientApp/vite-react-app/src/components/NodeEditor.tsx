import React, { useState, useEffect } from 'react';

// Airflow风格的节点数据结构
interface AirflowTaskData {
  // 基本信息
  label: string;
  description?: string;
  
  // Airflow Operator类型
  operatorType: string;
  
  // Airflow任务参数
  taskParams?: Record<string, any>;
  
  // Airflow特定配置
  retries?: number;
  retryDelay?: number; // 秒
  priorityWeight?: number;
  queue?: string;
  pool?: string;
  
  // 依赖关系
  upstreamTasks?: string[];
  downstreamTasks?: string[];
  
  // 触发规则
  triggerRule?: 'all_success' | 'all_failed' | 'all_done' | 'one_success' | 'one_failed' | 'none_failed' | 'none_failed_or_skipped' | 'none_skipped' | 'dummy';
  
  // 时间相关
  start_date?: string;
  end_date?: string;
  sla?: number; // 分钟
  
  // 其他配置
  [key: string]: string | number | boolean | object | null | undefined;
}

interface AirflowTask {
  id: string;
  type: 'start' | 'end' | 'bash' | 'python' | 'email' | 'http' | 'sql' | 'branch' | 'subdag' | 'sensor' | 'dummy' | 'custom';
  position: { x: number; y: number };
  data: AirflowTaskData;
  status?: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'upstream_failed' | 'retry' | 'no_status';
}

interface NodeEditorProps {
  node: AirflowTask;
  onSave: (updatedData: AirflowTaskData) => void;
  onCancel: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AirflowTaskData>(node.data);
  
  useEffect(() => {
    setFormData(node.data);
  }, [node]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTaskParamsChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      taskParams: {
        ...prev.taskParams,
        [key]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const operatorTypes = [
    'BashOperator',
    'PythonOperator',
    'EmailOperator',
    'SimpleHttpOperator',
    'SqlOperator',
    'BranchPythonOperator',
    'SubDagOperator',
    'Sensor',
    'DummyOperator',
    'CustomOperator'
  ];

  const triggerRules = [
    'all_success',
    'all_failed',
    'all_done',
    'one_success',
    'one_failed',
    'none_failed',
    'none_failed_or_skipped',
    'none_skipped',
    'dummy'
  ];

  return (
    <div className="node-editor-overlay">
      <div className="node-editor">
        <div className="node-editor-header">
          <h2>Edit Node: {node.data.label}</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <form className="node-editor-content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="label">Label</label>
            <input
              type="text"
              id="label"
              name="label"
              value={formData.label || ''}
              onChange={handleChange}
              placeholder="Enter node label"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Enter node description"
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="operatorType">Operator Type</label>
              <select
                id="operatorType"
                name="operatorType"
                value={formData.operatorType || ''}
                onChange={handleChange}
              >
                <option value="">Select operator type</option>
                {operatorTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="triggerRule">Trigger Rule</label>
              <select
                id="triggerRule"
                name="triggerRule"
                value={formData.triggerRule || ''}
                onChange={handleChange}
              >
                <option value="">Select trigger rule</option>
                {triggerRules.map(rule => (
                  <option key={rule} value={rule}>{rule}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="retries">Retries</label>
              <input
                type="number"
                id="retries"
                name="retries"
                value={formData.retries || ''}
                onChange={handleChange}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="retryDelay">Retry Delay (seconds)</label>
              <input
                type="number"
                id="retryDelay"
                name="retryDelay"
                value={formData.retryDelay || ''}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="queue">Queue</label>
              <input
                type="text"
                id="queue"
                name="queue"
                value={formData.queue || ''}
                onChange={handleChange}
                placeholder="Enter queue name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pool">Pool</label>
              <input
                type="text"
                id="pool"
                name="pool"
                value={formData.pool || ''}
                onChange={handleChange}
                placeholder="Enter pool name"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Task Parameters</label>
            <small>Key-value pairs for task-specific parameters</small>
            {formData.taskParams && Object.entries(formData.taskParams).map(([key, value]) => (
              <div className="form-row" key={key}>
                <div className="form-group">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    placeholder="Parameter name"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={value as string || ''}
                    onChange={(e) => handleTaskParamsChange(key, e.target.value)}
                    placeholder="Parameter value"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
        
        <div className="node-editor-footer">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="save-button" onClick={handleSubmit}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;