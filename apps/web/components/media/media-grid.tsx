import { Card } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { 
  Image, 
  Video, 
  FileText,
  MoreVertical,
  Eye,
  Copy,
  Trash2,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@socialinbox/ui';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@socialinbox/shared';

type MediaItem = Database['public']['Tables']['media_library']['Row'];

interface MediaGridProps {
  media: MediaItem[];
  viewMode: 'grid' | 'list';
  onPreview: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onCopyUrl: (url: string) => void;
}

export function MediaGrid({ media, viewMode, onPreview, onDelete, onCopyUrl }: MediaGridProps) {
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getThumbnail = (item: MediaItem) => {
    if (item.media_type === 'image') {
      return item.url;
    }
    // TODO: Add thumbnail support
    if ((item as any).thumbnail_url) {
      return (item as any).thumbnail_url;
    }
    return null;
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media.map((item) => {
          const thumbnail = getThumbnail(item);
          
          return (
            <Card key={item.id} className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <div 
                className="aspect-square relative bg-gray-100"
                onClick={() => onPreview(item)}
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getMediaIcon(item.media_type || 'file')}
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white" />
                </div>

                {/* Type badge */}
                <Badge className="absolute top-2 left-2" variant="secondary">
                  {item.media_type}
                </Badge>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.original_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatSize(item.size)} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPreview(item)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCopyUrl(item.url)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={item.url} download={item.original_name}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(item)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // List view
  return (
    <Card>
      <div className="divide-y">
        {media.map((item) => {
          const thumbnail = getThumbnail(item);
          
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onPreview(item)}
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getMediaIcon(item.media_type || 'file')}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{item.original_name}</p>
                  <Badge variant="outline" className="flex-shrink-0">
                    {item.media_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{formatSize(item.size)}</span>
                  <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyUrl(item.url);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={item.url} download={item.original_name}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}