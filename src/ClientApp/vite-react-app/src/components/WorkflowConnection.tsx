import React, { useMemo } from 'react';

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
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

const WorkflowConnection: React.FC<WorkflowConnectionProps> = ({
  connection,
  sourceNode,
  targetNode,
  isDragging = false,
  isSelected = false,
  onSelect,
  onDelete
}) => {
  // Calculate positions for the connection line
  const sourceX = sourceNode.position.x + 120; // Node width
  const sourceY = sourceNode.position.y + 30;  // Half node height
  const targetX = targetNode.position.x;
  const targetY = targetNode.position.y + 30;  // Half node height

  // Calculate the path for the connection line
  const calculatePath = useMemo(() => {
    // Create a curved path from source to target
    const midX = (sourceX + targetX) / 2;
    return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
  }, [sourceX, sourceY, targetX, targetY]);

  return (
    <g 
      className={`connection ${isDragging ? 'connection-dragging' : ''} ${isSelected ? 'connection-selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect();
      }}
    >
      {/* Invisible thick line for easier clicking */}
      <path
        d={calculatePath}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        cursor="pointer"
      />
      <path
        d={calculatePath}
        stroke={isSelected ? "#2575fc" : "#555"}
        strokeWidth={isSelected ? "3" : "2"}
        fill="none"
        markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
        className={isDragging ? 'connection-line-dragging' : 'connection-line'}
      />
      {isSelected && (
        <g>
          {/* Delete button in the middle of the connection */}
          <circle
            cx={(sourceX + targetX) / 2}
            cy={(sourceY + targetY) / 2}
            r="12"
            fill="#f44336"
            stroke="white"
            strokeWidth="2"
            cursor="pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete();
            }}
          />
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2}
            textAnchor="middle"
            dy=".35em"
            fill="white"
            fontSize="16"
            fontWeight="bold"
            cursor="pointer"
            pointerEvents="all"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete();
            }}
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
};

export default WorkflowConnection;