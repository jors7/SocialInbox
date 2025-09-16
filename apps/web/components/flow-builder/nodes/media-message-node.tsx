import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Image, Video, FileText, MessageSquare } from 'lucide-react';

interface MediaMessageNodeData {
  label: string;
  mediaType?: 'image' | 'video' | 'carousel' | 'document';
  mediaUrl?: string;
  caption?: string;
  carouselCards?: any[];
}

interface MediaMessageNodeProps {
  data: MediaMessageNodeData;
  isConnectable: boolean;
  selected: boolean;
}

export const MediaMessageNode = memo(({ data, isConnectable, selected }: MediaMessageNodeProps) => {
  const getMediaIcon = () => {
    switch (data.mediaType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'carousel':
        return <MessageSquare className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMediaPreview = () => {
    if (!data.mediaUrl && !data.carouselCards) {
      return (
        <div className="bg-gray-100 rounded p-8 text-center">
          <p className="text-sm text-gray-500">No media selected</p>
        </div>
      );
    }

    switch (data.mediaType) {
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={data.mediaUrl}
              alt="Media preview"
              className="w-full h-32 object-cover rounded"
            />
            {data.caption && (
              <p className="text-xs text-gray-600">{data.caption}</p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            <div className="relative bg-black rounded overflow-hidden">
              <video
                src={data.mediaUrl}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white bg-opacity-75 rounded-full p-2">
                  <Video className="h-6 w-6 text-gray-800" />
                </div>
              </div>
            </div>
            {data.caption && (
              <p className="text-xs text-gray-600">{data.caption}</p>
            )}
          </div>
        );
      
      case 'carousel':
        return (
          <div className="space-y-2">
            <div className="flex gap-1 overflow-hidden">
              {data.carouselCards?.slice(0, 3).map((card, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-gray-100 rounded p-2"
                >
                  <p className="text-xs font-medium truncate">{card.title}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {data.carouselCards?.length || 0} cards
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`media-message-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
      
      <Card className={`p-4 min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getMediaIcon()}
              <span className="font-medium text-sm">{data.label || 'Send Media'}</span>
            </div>
            {data.mediaType && (
              <Badge variant="outline" className="text-xs">
                {data.mediaType}
              </Badge>
            )}
          </div>
          
          {getMediaPreview()}
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
    </div>
  );
});

MediaMessageNode.displayName = 'MediaMessageNode';