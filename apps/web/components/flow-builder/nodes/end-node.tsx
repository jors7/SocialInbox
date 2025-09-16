import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';

export const EndNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-sm transition-all ${
        selected ? 'border-red-500 shadow-lg' : 'border-gray-200'
      }`}
      style={{ minWidth: 120 }}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-red-100">
          <CheckCircle className="h-4 w-4 text-red-600" />
        </div>
        <span className="text-sm font-semibold">End</span>
      </div>
    </div>
  );
});