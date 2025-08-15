import React, { useState, useRef, useEffect } from 'react';
import WorkflowNode from './WorkflowNode';
import WorkflowConnection from './WorkflowConnection';
import NodeEditor from './NodeEditor';

// 添加新的样式常量
const CONNECTION_COLOR = "#6c757d";
const PRIMARY_BUTTON_CLASS = "primary";

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

const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<AirflowTask[]>([
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
  ]);
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; handleType: 'source' | 'target'; handleId?: string } | null>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
  const [panning, setPanning] = useState<{ isPanning: boolean; offset: { x: number; y: number } }>({ isPanning: false, offset: { x: 0, y: 0 } });
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [executing, setExecuting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 更新节点状态的方法
  const updateNodeStatus = (nodeId: string, status: AirflowTask['status']) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, status } : node
      )
    );
  };

  const addNode = (type: AirflowTask['type'], x: number, y: number) => {
    const newNode: AirflowTask = {
      id: Date.now().toString(),
      type,
      position: { x, y },
      data: { 
        label: `${type} task`,
        operatorType: type
      }
    };
    
    // 根据节点类型设置默认标签
    switch (type) {
      case 'start':
        newNode.data.label = 'Start';
        break;
      case 'end':
        newNode.data.label = 'End';
        break;
      case 'bash':
        newNode.data.label = 'Bash Task';
        break;
      case 'python':
        newNode.data.label = 'Python Task';
        break;
      case 'email':
        newNode.data.label = 'Email Task';
        break;
      case 'http':
        newNode.data.label = 'HTTP Task';
        break;
      case 'sql':
        newNode.data.label = 'SQL Task';
        break;
      case 'branch':
        newNode.data.label = 'Branch Task';
        break;
      case 'subdag':
        newNode.data.label = 'SubDAG Task';
        break;
      case 'sensor':
        newNode.data.label = 'Sensor Task';
        break;
      case 'dummy':
        newNode.data.label = 'Dummy Task';
        break;
      case 'custom':
        newNode.data.label = 'Custom Task';
        break;
    }
    
    setNodes([...nodes, newNode]);
  };

  const updateNode = (nodeId: string, updatedData: Partial<AirflowTask>) => {
    setNodes(nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, ...updatedData };
      }
      return node;
    }));
  };

  const deleteNode = (nodeId: string) => {
    // Remove the node
    setNodes(nodes.filter(node => node.id !== nodeId));
    // Remove connections to/from this node
    setConnections(connections.filter(
      conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    ));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    if (editingNode === nodeId) {
      setEditingNode(null);
    }
  };

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
    setViewport(prev => {
      const newZoom = Math.max(0.1, Math.min(3, prev.zoom + delta));
      const zoomFactor = newZoom / prev.zoom;
      
      // 修复缩放中心点计算
      const mouseXCanvas = (mouseX - prev.x) / prev.zoom;
      const mouseYCanvas = (mouseY - prev.y) / prev.zoom;
      
      return {
        x: mouseX - mouseXCanvas * newZoom,
        y: mouseY - mouseYCanvas * newZoom,
        zoom: newZoom
      };
    });
  };

  const triggerWorkflow = async () => {
    try {
      setExecuting(true);
      // In a real implementation, this would call your backend API
      // For now, we'll just execute the workflow
      await executeWorkflow();
      
      alert('Workflow triggered! Check console for details.');
    } catch (error) {
      console.error('Error triggering workflow:', error);
      alert('Error triggering workflow. Check console for details.');
    } finally {
      setExecuting(false);
    }
  };

  const executeWorkflow = async () => {
    // Find the start node
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) {
      return;
    }
    
    // Execute nodes in order, starting with initial data
    const initialData = {
      workflowStarted: true,
      startTime: new Date().toISOString(),
      startNodeId: startNode.id,
      startNodeLabel: startNode.data.label
    };
    
    await executeNode(startNode.id, new Set(), initialData);
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
        result: `Executed Python function from ${node.data.label}`,
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
    } else if (node.type === 'dummy') {
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        result: `Executed dummy task from ${node.data.label}`,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    } else if (node.type !== 'branch') {
      // For other node types (except branch nodes), pass through or add node info
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        timestamp: new Date().toISOString()
      };
      updateNodeStatus(nodeId, 'success');
    }
    
    // Special handling for branch nodes
    let outgoingConnections = connections.filter(conn => conn.sourceNodeId === nodeId);
    
    if (node.type === 'branch') {
      // For branch nodes, make a decision based on input data
      let branchResult = false;
      
      try {
        // Simple condition evaluation
        if (inputData && typeof inputData === 'object') {
          // Check if inputData has a "value" property
          if ('value' in (inputData as object)) {
            const value = (inputData as { value: unknown }).value;
            branchResult = typeof value === 'number' ? value > 5 : !!value;
          } else {
            // Default to true for non-empty objects
            branchResult = true;
          }
        } else {
          // For simple values, use truthiness
          branchResult = !!inputData;
        }
      } catch (e) {
        console.warn('Error evaluating branch condition:', e);
        // Default to false if there's an error
        branchResult = false;
      }
      
      console.log(`Branch node ${nodeId} evaluated condition as:`, branchResult);
      
      // Filter connections based on branch result
      if (branchResult) {
        // Take the "true" path (top connection)
        outgoingConnections = outgoingConnections.filter(conn => conn.sourceHandle === 'true');
      } else {
        // Take the "false" path (bottom connection)
        outgoingConnections = outgoingConnections.filter(conn => conn.sourceHandle === 'false');
      }
      
      // Add branch result to output data
      outputData = {
        ...(inputData as object || {}),
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.type,
        branchResult: branchResult,
        timestamp: new Date().toISOString()
      };
      
      updateNodeStatus(nodeId, 'success');
    }
    
    // Execute connected nodes and pass the output data
    let result: unknown = outputData;
    for (const connection of outgoingConnections) {
      console.log(`Following connection from ${nodeId} to ${connection.targetNodeId}`);
      result = await executeNode(connection.targetNodeId, visitedNodes, outputData);
    }
    
    return result; // Return the final result
  };

  const getNodeById = (id: string) => nodes.find(node => node.id === id);

  const handleEditNode = (nodeId: string) => {
    setEditingNode(nodeId);
  };

  const handleSaveNode = (nodeId: string, updatedData: AirflowTaskData) => {
    updateNode(nodeId, { data: updatedData });
    setEditingNode(null);
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
  };

  // Handle mouse events on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left click for panning
      startPanning(e.clientX, e.clientY);
    } else if (e.button === 0) { // Left click
      setSelectedNode(null);
    }
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
      if (e.key === 'Delete' && selectedNode) {
        deleteNode(selectedNode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode]);

  return (
    <div className="workflow-editor">
      <div className="toolbar">
        <button onClick={() => addNode('dummy', 200, 200)}>
          <span>➕</span> Add Task
        </button>
        <button onClick={() => addNode('branch', 200, 200)}>
          <span>🔀</span> Add Decision
        </button>
        <button onClick={() => addNode('branch', 200, 200)}>
          <span>📊</span> Add Branch
        </button>
        <button onClick={() => addNode('subdag', 200, 200)}>
          <span>📂</span> Add SubDAG
        </button>
        <button onClick={() => addNode('sensor', 200, 200)}>
          <span>📡</span> Add Sensor
        </button>
        <button onClick={() => addNode('start', 200, 200)} className="primary">
          <span>▶</span> Add Start
        </button>
        <button onClick={() => addNode('end', 200, 200)} className="primary">
          <span>⏹</span> Add End
        </button>
        <button onClick={triggerWorkflow} disabled={executing}>
          {executing ? 'Executing...' : '🚀 Trigger Workflow'}
        </button>
        <div className="zoom-controls">
          <button onClick={() => handleZoom(0.2, 0, 0)}>+</button>
          <span>{Math.round(viewport.zoom * 100)}%</span>
          <button onClick={() => handleZoom(-0.2, 0, 0)}>-</button>
        </div>
      </div>
      
      <div 
        className="workflow-canvas" 
        ref={canvasRef}
        onMouseUp={() => {
          endDrag();
          endPanning();
        }}
        onMouseMove={(e) => {
          onDrag(e.clientX, e.clientY);
          onPanning(e.clientX, e.clientY);
        }}
        onMouseDown={handleCanvasMouseDown}
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
              onSelect={() => setSelectedNode(node.id)}
              onDelete={() => deleteNode(node.id)}
              onStartConnection={startConnection}
              onCompleteConnection={completeConnection}
              onDragStart={startDrag}
              onEdit={() => handleEditNode(node.id)}
              connecting={!!connecting}
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