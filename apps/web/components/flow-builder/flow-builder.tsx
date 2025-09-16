'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  NodeTypes,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@socialinbox/ui';
import { Card } from '@socialinbox/ui';
import { Save, Play, Plus } from 'lucide-react';
import { MessageNode } from './nodes/message-node';
import { QuickReplyNode } from './nodes/quick-reply-node';
import { ConditionNode } from './nodes/condition-node';
import { ActionNode } from './nodes/action-node';
import { WaitNode } from './nodes/wait-node';
import { EndNode } from './nodes/end-node';
import { NodeToolbar } from './node-toolbar';
import { FlowSpec } from '@socialinbox/shared';

const nodeTypes: NodeTypes = {
  message: MessageNode,
  quick_reply: QuickReplyNode,
  condition: ConditionNode,
  action: ActionNode,
  wait: WaitNode,
  end: EndNode,
};

const defaultEdgeOptions = {
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
};

interface FlowBuilderProps {
  initialFlow?: FlowSpec;
  onSave: (flow: FlowSpec) => void;
  onTest?: (flow: FlowSpec) => void;
}

export function FlowBuilder({ initialFlow, onSave, onTest }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Initialize flow
  useEffect(() => {
    if (initialFlow) {
      const flowNodes: Node[] = [];
      const flowEdges: Edge[] = [];

      // Convert flow spec to React Flow nodes
      Object.entries(initialFlow.nodes).forEach(([id, node]) => {
        let position = { x: 0, y: 0 };
        
        // Simple positioning algorithm
        const index = Object.keys(initialFlow.nodes).indexOf(id);
        position = {
          x: 250 + (index % 3) * 300,
          y: 100 + Math.floor(index / 3) * 200,
        };

        flowNodes.push({
          id,
          type: node.type,
          position,
          data: { ...node, id },
        });

        // Create edges based on node connections
        if (node.type === 'message' || node.type === 'action' || node.type === 'wait') {
          if (node.go) {
            flowEdges.push({
              id: `${id}-${node.go}`,
              source: id,
              target: node.go,
              ...defaultEdgeOptions,
            });
          }
        } else if (node.type === 'condition') {
          flowEdges.push({
            id: `${id}-${node.true}`,
            source: id,
            target: node.true,
            label: 'True',
            ...defaultEdgeOptions,
          });
          flowEdges.push({
            id: `${id}-${node.false}`,
            source: id,
            target: node.false,
            label: 'False',
            ...defaultEdgeOptions,
          });
        } else if (node.type === 'quick_reply') {
          node.quickReplies.forEach((qr, index) => {
            flowEdges.push({
              id: `${id}-${qr.go}-${index}`,
              source: id,
              target: qr.go,
              label: qr.text,
              ...defaultEdgeOptions,
            });
          });
        }
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } else {
      // Create default flow
      setNodes([
        {
          id: 'start',
          type: 'message',
          position: { x: 250, y: 100 },
          data: {
            id: 'start',
            type: 'message',
            text: 'Welcome! How can I help you today?',
          },
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 250, y: 300 },
          data: {
            id: 'end',
            type: 'end',
          },
        },
      ]);
      setEdges([
        {
          id: 'start-end',
          source: 'start',
          target: 'end',
          ...defaultEdgeOptions,
        },
      ]);
    }
  }, [initialFlow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 250, y: 100 },
      data: {
        id: `node-${Date.now()}`,
        type,
        text: type === 'message' ? 'New message' : undefined,
        quickReplies: type === 'quick_reply' ? [{ text: 'Option 1', go: 'end' }] : undefined,
        condition: type === 'condition' ? 'variable exists' : undefined,
        true: type === 'condition' ? 'end' : undefined,
        false: type === 'condition' ? 'end' : undefined,
        action: type === 'action' ? 'set_variable' : undefined,
        go: ['message', 'action', 'wait'].includes(type) ? 'end' : undefined,
        duration: type === 'wait' ? 60 : undefined,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const handleSave = useCallback(() => {
    // Convert React Flow to FlowSpec
    const flowSpec: FlowSpec = {
      version: '1',
      entry: 'start',
      nodes: {},
    };

    nodes.forEach((node) => {
      const nodeData: any = { ...node.data };
      delete nodeData.id;
      flowSpec.nodes[node.id] = nodeData;
    });

    onSave(flowSpec);
  }, [nodes, onSave]);

  const handleTest = useCallback(() => {
    if (onTest) {
      const flowSpec: FlowSpec = {
        version: '1',
        entry: 'start',
        nodes: {},
      };

      nodes.forEach((node) => {
        const nodeData: any = { ...node.data };
        delete nodeData.id;
        flowSpec.nodes[node.id] = nodeData;
      });

      onTest(flowSpec);
    }
  }, [nodes, onTest]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Panel position="top-left">
          <Card className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Add Node</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('message')}
                  className="justify-start"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('quick_reply')}
                  className="justify-start"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Quick Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('condition')}
                  className="justify-start"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Condition
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('action')}
                  className="justify-start"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Action
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('wait')}
                  className="justify-start"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Wait
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('end')}
                  className="justify-start"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  End
                </Button>
              </div>
            </div>
          </Card>
        </Panel>
        <Panel position="top-right">
          <div className="flex gap-2">
            {onTest && (
              <Button size="sm" variant="outline" onClick={handleTest}>
                <Play className="mr-2 h-4 w-4" />
                Test Flow
              </Button>
            )}
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Flow
            </Button>
          </div>
        </Panel>
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {selectedNode && (
        <NodeToolbar
          node={selectedNode}
          onUpdate={(data) => updateNodeData(selectedNode.id, data)}
          onDelete={() => deleteNode(selectedNode.id)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}