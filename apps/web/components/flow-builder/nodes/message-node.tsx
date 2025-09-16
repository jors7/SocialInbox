import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

export const MessageNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-sm transition-all ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      }`}
      style={{ minWidth: 200 }}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100">
          <MessageSquare className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-sm font-semibold">Message</span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{data.text || 'No message'}</p>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2" />
    </div>
  );
});