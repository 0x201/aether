import React, { useState, useRef, useEffect, useCallback } from 'react';
import WorkflowNode from './WorkflowNode';
import WorkflowConnection from './WorkflowConnection';
import NodeEditor from './NodeEditor';
import workflowService from '../services/workflowService';

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
  // Airflow风格的任务类型（对应Operator类型）
  type: 'start' | 'end' | 'bash' | 'python' | 'email' | 'http' | 'sql' | 'branch' | 'subdag' | 'sensor' | 'dummy' | 'custom' | 'extract' | 'validate' | 'load';
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
    maxTries?: number;
  };
}

interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface WorkflowEditorProps {
  initialWorkflow?: any;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ initialWorkflow }) => {
  const [nodes, setNodes] = useState<AirflowTask[]>(() => {
    if (initialWorkflow) {
      return initialWorkflow.nodes.map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          // Ensure all required fields are present
          label: node.data.label || '',
          operatorType: node.data.operatorType || 'dummy'
        }
      }));
    }
    
    return [
      { 
        id: '1', 
        type: 'start', 
        position: { x: 100, y: 100 }, 
        data: { 
          label: 'Start', 
          operatorType: 'start'
        } 
      },
      { 
        id: '2', 
        type: 'end', 
        position: { x: 400, y: 100 }, 
        data: { 
          label: 'End', 
          operatorType: 'end'
        } 
      }
    ];
  });
  
  const [connections, setConnections] = useState<Connection[]>(() => {
    return initialWorkflow ? initialWorkflow.connections : [];
  });
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; handleType: 'source' | 'target'; handleId?: string } | null>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [panning, setPanning] = useState<{ isPanning: boolean; offset: { x: number; y: number } }>({ isPanning: false, offset: { x: 0, y: 0 } });
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [executing, setExecuting] = useState(false);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'Untitled Workflow');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // 保存工作流
  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      setSaveMessage('Please enter a workflow name');
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // 构建完整的工作流数据
      const workflowData = {
        name: workflowName,
        nodes: nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            // 确保所有可序列化的数据都被保存
            label: node.data.label,
            operatorType: node.data.operatorType,
            description: node.data.description,
            retries: node.data.retries,
            retryDelay: node.data.retryDelay,
            priorityWeight: node.data.priorityWeight,
            queue: node.data.queue,
            pool: node.data.pool,
            upstreamTasks: node.data.upstreamTasks,
            downstreamTasks: node.data.downstreamTasks,
            triggerRule: node.data.triggerRule,
            start_date: node.data.start_date,
            end_date: node.data.end_date,
            sla: node.data.sla
          }
        })),
        connections,
        createdAt: initialWorkflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 调用工作流服务保存数据
      if (initialWorkflow) {
        // 更新现有工作流
        await workflowService.updateWorkflow(initialWorkflow.id, workflowData);
        setSaveMessage('Workflow updated successfully!');
      } else {
        // 创建新工作流
        await workflowService.createWorkflow(workflowData);
        setSaveMessage('Workflow created successfully!');
      }
      
      // 5秒后清除消息
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error saving workflow:', error);
      setSaveMessage('Failed to save workflow. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 当initialWorkflow改变时更新状态
  useEffect(() => {
    if (initialWorkflow) {
      setWorkflowName(initialWorkflow.name);
      setNodes(initialWorkflow.nodes.map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          label: node.data.label || '',
          operatorType: node.data.operatorType || 'dummy'
        }
      })));
      setConnections(initialWorkflow.connections);
    }
  }, [initialWorkflow]);

  // 更新节点状态的方法
  const updateNodeStatus = (nodeId: string, status: AirflowTask['status']) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, status } : node
      )
    );
  };

  // 根据ID获取节点
  const getNodeById = useCallback((id: string) => {
    return nodes.find(node => node.id === id);
  }, [nodes]);

  // 添加新节点
  const addNode = (type: AirflowTask['type'], x: number, y: number) => {
    const newNode: AirflowTask = {
      id: Date.now().toString(),
      type,
      position: { x, y },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Task`,
        operatorType: type === 'start' || type === 'end' ? type : 'DummyOperator'
      }
    };
    
    setNodes([...nodes, newNode]);
  };

  // 删除节点
  const deleteNode = (nodeId: string) => {
    // 删除节点
    setNodes(nodes.filter(node => node.id !== nodeId));
    
    // 删除相关的连接
    setConnections(connections.filter(
      conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    ));
    
    // 清除选择
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    
    // 清除编辑状态
    if (editingNode === nodeId) {
      setEditingNode(null);
    }
  };

  // 删除连接
  const deleteConnection = (connectionId: string) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
    
    // 清除选择
    if (selectedConnection === connectionId) {
      setSelectedConnection(null);
    }
  };

  // 编辑节点
  const handleEditNode = (nodeId: string) => {
    setEditingNode(nodeId);
  };

  // 保存节点编辑
  const handleSaveNode = (nodeId: string, updatedData: AirflowTaskData) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, data: updatedData } : node
    ));
    setEditingNode(null);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingNode(null);
  };

  // 连接相关函数
  const startConnection = (nodeId: string, handleType: 'source' | 'target', handleId?: string) => {
    setConnecting({ nodeId, handleType, handleId });
  };

  const completeConnection = (nodeId: string, handleType: 'source' | 'target', handleId?: string) => {
    if (!connecting) return;
    
    // Prevent connecting to the same node
    if (connecting.nodeId === nodeId) {
      setConnecting(null);
      return;
    }
    
    // Prevent connecting two sources or two targets
    if (connecting.handleType === handleType) {
      setConnecting(null);
      return;
    }
    
    // Create connection (source -> target)
    const sourceNodeId = connecting.handleType === 'source' ? connecting.nodeId : nodeId;
    const targetNodeId = connecting.handleType === 'target' ? connecting.nodeId : nodeId;
    const sourceHandle = connecting.handleType === 'source' ? connecting.handleId : handleId;
    const targetHandle = connecting.handleType === 'target' ? connecting.handleId : handleId;
    
    const newConnection: Connection = {
      id: Date.now().toString(),
      sourceNodeId,
      targetNodeId,
      sourceHandle,
      targetHandle
    };
    
    setConnections([...connections, newConnection]);
    setConnecting(null);
  };

  // New function to handle connection completion on node handles
  const handleConnectionComplete = (nodeId: string, handleType: 'source' | 'target') => {
    if (connecting) {
      completeConnection(nodeId, handleType);
    }
  };

  const startDrag = (nodeId: string, x: number, y: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDragging({
      nodeId,
      offset: {
        x: x - (node.position.x * viewport.zoom + viewport.x),
        y: y - (node.position.y * viewport.zoom + viewport.y)
      }
    });
    setDraggingNodeId(nodeId);
  };

  const onDrag = (x: number, y: number) => {
    if (!dragging) return;
    
    setNodes(nodes.map(node => {
      if (node.id === dragging.nodeId) {
        return {
          ...node,
          position: {
            x: (x - dragging.offset.x - viewport.x) / viewport.zoom,
            y: (y - dragging.offset.y - viewport.y) / viewport.zoom
          }
        };
      }
      return node;
    }));
  };

  const endDrag = () => {
    setDragging(null);
    setDraggingNodeId(null);
  };

  // Panning functions
  const startPanning = (x: number, y: number) => {
    setPanning({
      isPanning: true,
      offset: {
        x: x - viewport.x,
        y: y - viewport.y
      }
    });
  };

  const onPanning = (x: number, y: number) => {
    if (!panning.isPanning) return;
    
    setViewport(prev => ({
      ...prev,
      x: x - panning.offset.x,
      y: y - panning.offset.y
    }));
  };

  const endPanning = () => {
    setPanning({ isPanning: false, offset: { x: 0, y: 0 } });
  };

  // Zoom functions
  const handleZoom = (delta: number, mouseX: number, mouseY: number) => {
    const zoomIntensity = 0.1;
    const zoomFactor = Math.exp(delta * zoomIntensity);
    const newZoom = Math.min(Math.max(0.1, viewport.zoom * zoomFactor), 5);
    
    // 计算新的视口位置，保持缩放中心点不变
    const newViewportX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
    const newViewportY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);
    
    setViewport({
      x: newViewportX,
      y: newViewportY,
      zoom: newZoom
    });
  };

  // 触发工作流执行
  const triggerWorkflow = async () => {
    setExecuting(true);
    try {
      // 保存当前工作流（如果尚未保存）
      if (!initialWorkflow) {
        await saveWorkflow();
      }
      
      // 调用API执行工作流
      if (initialWorkflow?.id) {
        const result = await workflowService.executeEtlWorkflow(initialWorkflow.id);
        console.log('ETL Workflow execution result:', result);
        setSaveMessage(`Workflow execution ${result.success ? 'completed' : 'failed'}: ${result.message}`);
      } else {
        setSaveMessage('Please save the workflow before executing');
      }
    } catch (error: any) {
      console.error('Failed to execute ETL workflow:', error);
      setSaveMessage(`Failed to execute workflow: ${error.message || 'Unknown error'}`);
    } finally {
      setExecuting(false);
      
      // 5秒后清除消息
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    }
  };

  const executeWorkflow = async () => {
    // Find the start node
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) {
      setSaveMessage('No start node found in workflow');
      return;
    }
    
    // 通过API执行工作流
    try {
      setExecuting(true);
      
      // 保存当前工作流（如果尚未保存）
      if (!initialWorkflow) {
        await saveWorkflow();
      }
      
      if (initialWorkflow?.id) {
        // 调用API执行ETL工作流
        const result = await workflowService.executeEtlWorkflow(initialWorkflow.id);
        console.log('ETL Workflow execution result:', result);
        setSaveMessage(`Workflow execution ${result.success ? 'completed' : 'failed'}: ${result.message}`);
      } else {
        setSaveMessage('Please save the workflow before executing');
      }
    } catch (error: any) {
      console.error('Failed to execute ETL workflow:', error);
      setSaveMessage(`Failed to execute workflow: ${error.message || 'Unknown error'}`);
    } finally {
      setExecuting(false);
      
      // 5秒后清除消息
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    }
  };

  const executeNode = async (nodeId: string, visitedNodes: Set<string>, inputData: unknown) => {
    // Prevent infinite loops
    if (visitedNodes.has(nodeId)) {
      return inputData;
    }
    
    // Mark node as visited
    visitedNodes.add(nodeId);
    
    // Find the node
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      return inputData;
    }
    
    // 更新节点状态为运行中
    updateNodeStatus(nodeId, 'running');
    
    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Executing node: ${node.data.label} (${nodeId}) with input data:`, inputData);
    
    // Simulate node execution based on action type
    let outputData: unknown = inputData; // Default to passing through input data
    
    // Special handling for start nodes - they should produce some initial data
    if (node.type === 'start') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        timestamp: new Date().toISOString(),
        message: "Workflow started"
      };
      updateNodeStatus(nodeId, 'success');
    } 
    // 处理不同类型的Operator
    else if (node.type === 'bash') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Executed bash command from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'python') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Executed Python script from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'email') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Sent email from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'http') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Made HTTP request from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'sql') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Executed SQL query from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'branch') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Evaluated branch condition from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'subdag') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Executed SubDAG from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'sensor') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Sensor check from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type === 'dummy') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Dummy task executed from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else {
      // Default case for custom or other node types
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Executed task from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    }
    
    // Find all downstream connections
    const downstreamConnections = connections.filter(conn => conn.sourceNodeId === nodeId);
    
    // Execute all downstream nodes
    for (const conn of downstreamConnections) {
      await executeNode(conn.targetNodeId, new Set(visitedNodes), outputData);
    }
    
    return outputData;
  };

  // Handle mouse events on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left click for panning
      startPanning(e.clientX, e.clientY);
    } else if (e.button === 0) { // Left click
      setSelectedNode(null);
      setSelectedConnection(null);
    }
  };

  // Global mouse up handler for completing connections
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (connecting) {
        // If we're connecting and mouse is released over the canvas but not on a node handle,
        // cancel the connection
        setConnecting(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [connecting]);

  // Handle mouse up on canvas
  const handleCanvasMouseUp = () => {
    endDrag();
    endPanning();
  };

  // Handle mouse move on canvas
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    onDrag(e.clientX, e.clientY);
    onPanning(e.clientX, e.clientY);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    // Note: We can't use preventDefault here because the event listener is passive
    handleZoom(e.deltaY > 0 ? -0.2 : 0.2, e.clientX, e.clientY);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected node with Delete key
      if (e.key === 'Delete') {
        if (selectedNode) {
          deleteNode(selectedNode);
        } else if (selectedConnection) {
          deleteConnection(selectedConnection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, selectedConnection]);

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Nodes</h3>
        <div className="node-types">
          <button onClick={() => addNode('start', 100, 100)} className="node-button node-button-start">
            Start
          </button>
          <button onClick={() => addNode('end', 100, 100)} className="node-button node-button-end">
            End
          </button>
          <button onClick={() => addNode('dummy', 100, 100)} className="node-button node-button-task">
            Task
          </button>
          <button onClick={() => addNode('branch', 100, 100)} className="node-button node-button-decision">
            Decision
          </button>
          <button onClick={() => addNode('bash', 100, 100)} className="node-button node-button-bash">
            Bash
          </button>
          <button onClick={() => addNode('python', 100, 100)} className="node-button node-button-python">
            Python
          </button>
          <button onClick={() => addNode('email', 100, 100)} className="node-button node-button-email">
            Email
          </button>
          <button onClick={() => addNode('http', 100, 100)} className="node-button node-button-http">
            HTTP
          </button>
          <button onClick={() => addNode('sql', 100, 100)} className="node-button node-button-sql">
            SQL
          </button>
          {/* ETL节点类型 */}
          <button onClick={() => addNode('extract', 100, 100)} className="node-button node-button-extract">
            Extract
          </button>
          <button onClick={() => addNode('validate', 100, 100)} className="node-button node-button-validate">
            Validate
          </button>
          <button onClick={() => addNode('load', 100, 100)} className="node-button node-button-load">
            Load
          </button>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3 className="toolbar-title">Workflow</h3>
        <div className="workflow-actions">
          <input 
            type="text" 
            value={workflowName} 
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="workflow-name-input"
          />
          <button 
            onClick={saveWorkflow}
            disabled={isSaving}
            className="toolbar-button save-button"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={triggerWorkflow}
            disabled={executing}
            className="toolbar-button execute-button"
          >
            {executing ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3 className="toolbar-title">View</h3>
        <div className="zoom-controls">
          <button onClick={() => handleZoom(0.2, 0, 0)} className="toolbar-button zoom-button">+</button>
          <span className="zoom-level">{Math.round(viewport.zoom * 100)}%</span>
          <button onClick={() => handleZoom(-0.2, 0, 0)} className="toolbar-button zoom-button">-</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="workflow-editor">
      {renderToolbar()}
      
      {saveMessage && (
        <div className="save-message-container">
          <div className={`save-message ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        </div>
      )}
      
      <div 
        className="workflow-canvas" 
        ref={canvasRef}
        onMouseDown={(e) => {
          handleCanvasMouseDown(e);
          if (e.button === 0 && !e.ctrlKey) { // Left click
            setSelectedConnection(null);
          }
        }}
        onMouseMove={(e) => {
          if (dragging) {
            onDrag(e.clientX, e.clientY);
          } else if (panning.isPanning) {
            onPanning(e.clientX, e.clientY);
          }
        }}
        onMouseUp={(e) => {
          endDrag();
          endPanning();
          // Complete connection if one is in progress
          if (connecting && e.target === e.currentTarget) {
            setConnecting(null);
          }
        }}
        onMouseLeave={() => {
          endDrag();
          endPanning();
        }}
        onWheel={handleWheel}
        >
        {/* Background pattern */}
        <div 
          className="background-pattern" 
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0'
          }}
        />
        
        <svg 
          className="connections-layer" 
          ref={svgRef}
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6c757d" />
            </marker>
            <marker
              id="arrowhead-selected"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#2575fc" />
            </marker>
          </defs>
          {connections.map(conn => {
            const sourceNode = getNodeById(conn.sourceNodeId);
            const targetNode = getNodeById(conn.targetNodeId);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <WorkflowConnection
                key={conn.id}
                connection={conn}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isDragging={draggingNodeId === conn.sourceNodeId || draggingNodeId === conn.targetNodeId}
                isSelected={selectedConnection === conn.id}
                onSelect={() => setSelectedConnection(conn.id)}
                onDelete={() => deleteConnection(conn.id)} // 使用包装函数
              />
            );
          })}
        </svg>
        
        <div className="nodes-layer">
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              onSelect={() => {
                setSelectedNode(node.id);
                setSelectedConnection(null);
              }}
              onDelete={() => deleteNode(node.id)}
              onStartConnection={startConnection}
              onCompleteConnection={completeConnection}
              onDragStart={startDrag}
              onEdit={() => handleEditNode(node.id)}
              connecting={connecting?.nodeId === node.id}
              onNodeStatusChange={updateNodeStatus}
              isDragging={draggingNodeId === node.id}
            />
          ))}
        </div>
      </div>
      
      {editingNode && (
        <NodeEditor
          node={nodes.find(n => n.id === editingNode)!}
          onSave={(updatedData) => handleSaveNode(editingNode, updatedData)}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
};

export default WorkflowEditor;