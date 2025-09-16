import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';

export const QuickReplyNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-sm transition-all ${
        selected ? 'border-purple-500 shadow-lg' : 'border-gray-200'
      }`}
      style={{ minWidth: 250 }}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100">
          <MessageCircle className="h-4 w-4 text-purple-600" />
        </div>
        <span className="text-sm font-semibold">Quick Reply</span>
      </div>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{data.text || 'No message'}</p>
      <div className="space-y-1">
        {data.quickReplies?.map((qr: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{qr.text}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`qr-${index}`}
              style={{ top: `${50 + index * 30}%` }}
              className="h-2 w-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
});