'use client';

import { useState, useEffect, useRef } from 'react';

interface Cherry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  branch_type: string;
  twig_name?: string;
  source_file?: string;
  line_number?: number;
  image_url?: string;
  review_status: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  cherry: Cherry;
  connections: string[];
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  type: 'branch' | 'time' | 'content' | 'source';
}

interface MindMapVisualizerProps {
  cherries: Cherry[];
  onCherrySelect: (cherry: Cherry) => void;
}

export default function MindMapVisualizer({ cherries, onCherrySelect }: MindMapVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (cherries.length > 0) {
      generateMindMap();
    }
  }, [cherries]);

  useEffect(() => {
    drawMindMap();
  }, [nodes, connections, zoom, pan, selectedNode]);

  const generateMindMap = () => {
    const newNodes: Node[] = [];
    const newConnections: Connection[] = [];
    
    // Create nodes in a circular layout
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(200, cherries.length * 20);
    
    cherries.forEach((cherry, index) => {
      const angle = (index / cherries.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      newNodes.push({
        id: cherry.id,
        x,
        y,
        cherry,
        connections: []
      });
    });

    // Generate connections based on various criteria
    cherries.forEach((cherry, index) => {
      cherries.slice(index + 1).forEach((otherCherry) => {
        let connectionStrength = 0;
        let connectionType: Connection['type'] = 'branch';

        // Same branch type
        if (cherry.branch_type === otherCherry.branch_type) {
          connectionStrength += 0.8;
          connectionType = 'branch';
        }

        // Same twig
        if (cherry.twig_name && cherry.twig_name === otherCherry.twig_name) {
          connectionStrength += 0.6;
          connectionType = 'content';
        }

        // Same source file
        if (cherry.source_file && cherry.source_file === otherCherry.source_file) {
          connectionStrength += 0.7;
          connectionType = 'source';
        }

        // Time proximity (within 24 hours)
        const timeDiff = Math.abs(
          new Date(cherry.created_at).getTime() - new Date(otherCherry.created_at).getTime()
        );
        if (timeDiff < 24 * 60 * 60 * 1000) {
          connectionStrength += 0.4;
          connectionType = 'time';
        }

        // Content similarity (simple keyword matching)
        const cherryWords = cherry.content.toLowerCase().split(/\s+/);
        const otherWords = otherCherry.content.toLowerCase().split(/\s+/);
        const commonWords = cherryWords.filter(word => otherWords.includes(word));
        if (commonWords.length > 2) {
          connectionStrength += 0.3;
          connectionType = 'content';
        }

        if (connectionStrength > 0.3) {
          newConnections.push({
            from: cherry.id,
            to: otherCherry.id,
            strength: connectionStrength,
            type: connectionType
          });

          // Add to node connections
          const fromNode = newNodes.find(n => n.id === cherry.id);
          const toNode = newNodes.find(n => n.id === otherCherry.id);
          if (fromNode) fromNode.connections.push(otherCherry.id);
          if (toNode) toNode.connections.push(cherry.id);
        }
      });
    });

    setNodes(newNodes);
    setConnections(newConnections);
  };

  const drawMindMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw connections
    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        // Color based on connection type
        switch (connection.type) {
          case 'branch':
            ctx.strokeStyle = `rgba(59, 130, 246, ${connection.strength})`; // Blue
            break;
          case 'content':
            ctx.strokeStyle = `rgba(16, 185, 129, ${connection.strength})`; // Green
            break;
          case 'source':
            ctx.strokeStyle = `rgba(245, 158, 11, ${connection.strength})`; // Yellow
            break;
          case 'time':
            ctx.strokeStyle = `rgba(239, 68, 68, ${connection.strength})`; // Red
            break;
        }
        
        ctx.lineWidth = connection.strength * 3;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      const isConnected = node.connections.length > 0;
      
      // Node background
      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 25 : 20, 0, 2 * Math.PI);
      ctx.fillStyle = getBranchColor(node.cherry.branch_type);
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Connection indicator
      if (isConnected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }

      // Node text
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const title = node.cherry.title || 'Untitled';
      const displayText = title.length > 15 ? title.substring(0, 15) + '...' : title;
      
      ctx.fillText(displayText, node.x, node.y + 35);
      
      // Branch indicator
      ctx.font = '10px Arial';
      ctx.fillStyle = getBranchTextColor(node.cherry.branch_type);
      ctx.fillText(node.cherry.branch_type, node.x, node.y - 35);
    });

    ctx.restore();
  };

  const getBranchColor = (branchType: string): string => {
    switch (branchType) {
      case 'funny': return '#eab308'; // Yellow
      case 'mystical': return '#a855f7'; // Purple
      case 'technical': return '#3b82f6'; // Blue
      case 'research': return '#10b981'; // Green
      case 'ideas': return '#f59e0b'; // Orange
      default: return '#6b7280'; // Gray
    }
  };

  const getBranchTextColor = (branchType: string): string => {
    switch (branchType) {
      case 'funny': return '#fbbf24'; // Light yellow
      case 'mystical': return '#c084fc'; // Light purple
      case 'technical': return '#60a5fa'; // Light blue
      case 'research': return '#34d399'; // Light green
      case 'ideas': return '#fbbf24'; // Light orange
      default: return '#9ca3af'; // Light gray
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    // Check if clicked on a node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 25;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      onCherrySelect(clickedNode.cherry);
    } else {
      setSelectedNode(null);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const newZoom = Math.max(0.5, Math.min(2, zoom - event.deltaY * 0.001));
    setZoom(newZoom);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🧠 Mind Map Visualization</h3>
        <button
          onClick={resetView}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
        >
          Reset View
        </button>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 rounded cursor-pointer bg-gray-900"
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Legend */}
        <div className="absolute top-2 right-2 bg-gray-900/90 p-3 rounded border border-gray-600">
          <div className="text-white text-sm font-medium mb-2">Connections:</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-gray-300">Branch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span className="text-gray-300">Content</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-yellow-500"></div>
              <span className="text-gray-300">Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span className="text-gray-300">Time</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p>💡 <strong>Tip:</strong> Click on nodes to see cherry details. Drag to pan, scroll to zoom.</p>
        <p>🔗 <strong>Connections:</strong> Thicker lines = stronger relationships between cherries.</p>
      </div>
    </div>
  );
}
