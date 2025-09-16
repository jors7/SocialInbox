import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';

export const WaitNode = memo(({ data, selected }: NodeProps) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-sm transition-all ${
        selected ? 'border-yellow-500 shadow-lg' : 'border-gray-200'
      }`}
      style={{ minWidth: 160 }}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-100">
          <Clock className="h-4 w-4 text-yellow-600" />
        </div>
        <span className="text-sm font-semibold">Wait</span>
      </div>
      <p className="text-sm text-gray-600">
        {data.duration ? formatDuration(data.duration) : 'No duration'}
      </p>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2" />
    </div>
  );
});