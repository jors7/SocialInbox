import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-sm transition-all ${
        selected ? 'border-green-500 shadow-lg' : 'border-gray-200'
      }`}
      style={{ minWidth: 200 }}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100">
          <GitBranch className="h-4 w-4 text-green-600" />
        </div>
        <span className="text-sm font-semibold">Condition</span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{data.condition || 'No condition'}</p>
      <div className="mt-3 flex justify-between">
        <div className="text-xs text-green-600">
          True
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: '25%' }}
            className="h-2 w-2"
          />
        </div>
        <div className="text-xs text-red-600">
          False
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: '75%' }}
            className="h-2 w-2"
          />
        </div>
      </div>
    </div>
  );
});