import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; handleType: 'source' | 'target'; handleId?: string } | null>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
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

  // Handle mouse down on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only handle if clicking on the canvas itself, not on a node or connection
    if (e.target === e.currentTarget) {
      // Deselect any selected node or connection
      if (selectedNode) {
        setSelectedNode(null);
      }
      
      if (selectedConnection) {
        setSelectedConnection(null);
      }
      
      // Start panning
      startPanning(e.clientX, e.clientY);
    }
  };

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
        onMouseUp={handleCanvasMouseUp}
        onMouseMove={handleCanvasMouseMove}
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
                onSelect={() => {
                  setSelectedNode(null);
                  setSelectedConnection(conn.id);
                }}
                onDelete={() => deleteConnection(conn.id)}
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
                setSelectedConnection(null);
                setSelectedNode(node.id);
              }}
              onDelete={() => deleteNode(node.id)}
              onStartConnection={startConnection}
              onCompleteConnection={completeConnection}
              onDragStart={startDrag}
              onEdit={() => handleEditNode(node.id)}
              connecting={!!connecting}
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