import React from 'react';

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface WorkflowConnectionProps {
  connection: Connection;
  sourceNode: Node;
  targetNode: Node;
}

const WorkflowConnection: React.FC<WorkflowConnectionProps> = ({
  connection: _connection, // 重命名参数以表明它虽然未使用但已声明
  sourceNode,
  targetNode
}) => {
  // Calculate positions for the connection line
  const sourceX = sourceNode.position.x + 120; // Node width
  const sourceY = sourceNode.position.y + 30;  // Half node height
  const targetX = targetNode.position.x;
  const targetY = targetNode.position.y + 30;  // Half node height

  // Calculate the path for the connection line
  const calculatePath = () => {
    // Create a curved path from source to target
    const midX = (sourceX + targetX) / 2;
    return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
  };

  return (
    <g className="connection">
      <path
        d={calculatePath()}
        stroke="#555"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
    </g>
  );
};

export default WorkflowConnection;