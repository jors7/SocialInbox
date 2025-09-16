import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

const actionLabels: Record<string, string> = {
  capture_email: 'Capture Email',
  add_tag: 'Add Tag',
  remove_tag: 'Remove Tag',
  set_variable: 'Set Variable',
  http_request: 'HTTP Request',
  notify_team: 'Notify Team',
};

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-sm transition-all ${
        selected ? 'border-orange-500 shadow-lg' : 'border-gray-200'
      }`}
      style={{ minWidth: 200 }}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-100">
          <Zap className="h-4 w-4 text-orange-600" />
        </div>
        <span className="text-sm font-semibold">Action</span>
      </div>
      <p className="text-sm text-gray-600">
        {actionLabels[data.action] || data.action || 'No action'}
      </p>
      {data.params && (
        <p className="text-xs text-gray-500 mt-1">
          {Object.entries(data.params).map(([key, value]) => `${key}: ${value}`).join(', ')}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="h-2 w-2" />
    </div>
  );
});