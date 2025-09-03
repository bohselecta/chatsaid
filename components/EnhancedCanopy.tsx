'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ZoomIn, ZoomOut, RotateCcw, Bot, Users, Sparkles, X } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  member_count: number;
  post_count: number;
}

interface Cherry {
  id: string;
  title?: string;
  content: string;
  author_id: string;
  author_display_name: string;
  author_avatar?: string;
  created_at: string;
  engagement_score?: number;
  bot_attribution?: string;
}

interface Connection {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  connection_strength: number;
  connection_type: string;
}

interface CanopyNode {
  id: string;
  type: 'branch' | 'cherry' | 'user';
  data: Branch | Cherry | any;
  x: number;
  y: number;
  connections: string[];
}

export default function EnhancedCanopy() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cherries, setCherries] = useState<Cherry[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [nodes, setNodes] = useState<CanopyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Zoom and view state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Cache state
  const [cacheKey, setCacheKey] = useState<string>('');
  const [cachedData, setCachedData] = useState<any>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load data with caching
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cacheKey = `canopy_${Date.now()}`;
        const cached = await checkCache(cacheKey);
        
        if (cached) {
          setBranches(cached.branches);
          setCherries(cached.cherries);
          setConnections(cached.connections);
          setCachedData(cached);
          setCacheKey(cacheKey);
        } else {
          // Load fresh data
          await Promise.all([
            loadBranches(),
            loadCherries(),
            loadConnections()
          ]);
          
          // Cache the data
          await cacheData(cacheKey, { branches, cherries, connections });
        }
      } catch (error) {
        console.error('Error loading canopy data:', error);
        setError('Failed to load canopy data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate nodes layout when data changes
  useEffect(() => {
    if (branches.length > 0 || cherries.length > 0) {
      generateNodeLayout();
    }
  }, [branches, cherries, connections]);

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadCherries = async () => {
    try {
      const { data, error } = await supabase
        .from('cherries')
        .select(`
          id,
          title,
          content,
          author_id,
          author_display_name,
          author_avatar,
          created_at,
          engagement_score,
          bot_attribution
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit for performance

      if (error) throw error;
      setCherries(data || []);
    } catch (error) {
      console.error('Error loading cherries:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('precomputed_connections')
        .select('*')
        .order('connection_strength', { ascending: false })
        .limit(200); // Limit for performance

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const checkCache = async (key: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('branch_cache')
        .select('*')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return data.cache_data;
    } catch (error) {
      return null;
    }
  };

  const cacheData = async (key: string, data: any) => {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

      await supabase
        .from('branch_cache')
        .upsert({
          branch_id: 'canopy', // Use a special ID for canopy cache
          cache_key: key,
          cache_data: data,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  const generateNodeLayout = useCallback(() => {
    const newNodes: CanopyNode[] = [];
    
    // Position branches vertically
    branches.forEach((branch, index) => {
      newNodes.push({
        id: `branch_${branch.id}`,
        type: 'branch',
        data: branch,
        x: 100,
        y: 100 + (index * 150),
        connections: []
      });
    });

    // Position cherries horizontally around branches
    cherries.forEach((cherry, index) => {
      const branchIndex = index % branches.length;
      const branch = branches[branchIndex];
      
      if (branch) {
        newNodes.push({
          id: `cherry_${cherry.id}`,
          type: 'cherry',
          data: cherry,
          x: 300 + (index * 50),
          y: 100 + (branchIndex * 150) + (index % 3) * 30,
          connections: [`branch_${branch.id}`]
        });
      }
    });

    setNodes(newNodes);
  }, [branches, cherries]);

  // Zoom and pan handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const focusOnNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setPan({
        x: -node.x * zoom + window.innerWidth / 2,
        y: -node.y * zoom + window.innerHeight / 2
      });
      setSelectedNode(nodeId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading canopy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Canopy</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🌳 Enhanced Canopy</h1>
            <p className="text-gray-400">Interactive branch and cherry visualization</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 border-b border-gray-600 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-2xl font-bold">{branches.length}</div>
              <div className="text-sm text-gray-400">Branches</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <Sparkles className="w-6 h-6 text-green-400" />
            <div>
              <div className="text-2xl font-bold">{cherries.length}</div>
              <div className="text-sm text-gray-400">Cherries</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <Bot className="w-6 h-6 text-purple-400" />
            <div>
              <div className="text-2xl font-bold">{connections.length}</div>
              <div className="text-sm text-gray-400">Connections</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold">{Math.round(zoom * 100)}%</div>
              <div className="text-sm text-gray-400">Zoom Level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="relative w-full h-[calc(100vh-200px)] overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((connection) => {
              const sourceNode = nodes.find(n => n.id === connection.source_id);
              const targetNode = nodes.find(n => n.id === connection.target_id);
              
              if (!sourceNode || !targetNode) return null;
              
              const strength = Math.max(0.1, connection.connection_strength);
              const opacity = strength * 0.6;
              
              return (
                <line
                  key={connection.id}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#6B7280"
                  strokeWidth={strength * 2}
                  opacity={opacity}
                  strokeDasharray={connection.connection_type === 'weak' ? '5,5' : 'none'}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                selectedNode === node.id ? 'scale-110 z-10' : 'hover:scale-105'
              }`}
              style={{
                left: node.x,
                top: node.y
              }}
              onClick={() => handleNodeClick(node.id)}
            >
              {node.type === 'branch' && (
                <div className="group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white"
                    style={{ backgroundColor: (node.data as Branch).color }}
                  >
                    {(node.data as Branch).icon}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="font-medium">{(node.data as Branch).name}</div>
                    <div className="text-gray-400 text-xs">
                      {(node.data as Branch).member_count} members
                    </div>
                  </div>
                </div>
              )}
              
              {node.type === 'cherry' && (
                <div className="group">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs shadow-lg border-2 border-gray-500">
                    🍒
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity max-w-xs">
                    <div className="font-medium truncate">
                      {(node.data as Cherry).title || 'Untitled Cherry'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      by {(node.data as Cherry).author_display_name}
                    </div>
                    {(node.data as Cherry).bot_attribution && (
                      <div className="text-blue-400 text-xs">
                        via {(node.data as Cherry).bot_attribution}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="fixed bottom-4 left-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Node Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
              title="Close details"
              aria-label="Close node details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {(() => {
            const node = nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            
            if (node.type === 'branch') {
              const branch = node.data as Branch;
              return (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: branch.color }}
                    >
                      {branch.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{branch.name}</h4>
                      <p className="text-gray-400">{branch.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Members:</span> {branch.member_count}
                    </div>
                    <div>
                      <span className="text-gray-400">Posts:</span> {branch.post_count}
                    </div>
                  </div>
                </div>
              );
            }
            
            if (node.type === 'cherry') {
              const cherry = node.data as Cherry;
              return (
                <div>
                  <h4 className="text-lg font-bold mb-2">
                    {cherry.title || 'Untitled Cherry'}
                  </h4>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {cherry.content}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Author:</span> {cherry.author_display_name}
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span> {new Date(cherry.created_at).toLocaleDateString()}
                    </div>
                    {cherry.bot_attribution && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Bot:</span> {cherry.bot_attribution}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
