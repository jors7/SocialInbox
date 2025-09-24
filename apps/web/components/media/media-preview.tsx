import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { 
  Download, 
  Copy, 
  Trash2,
  X,
  Image,
  Video,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@socialinbox/shared';

type MediaItem = Database['public']['Tables']['media_library']['Row'];

interface MediaPreviewProps {
  media: MediaItem;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
}

export function MediaPreview({ media, open, onClose, onDelete, onCopyUrl }: MediaPreviewProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const renderPreview = () => {
    switch (media.media_type) {
      case 'image':
        return (
          <img
            src={media.url}
            alt={media.original_name}
            className="max-w-full max-h-[60vh] object-contain mx-auto"
          />
        );
      
      case 'video':
        return (
          <video
            src={media.url}
            controls
            className="max-w-full max-h-[60vh] mx-auto"
          >
            Your browser does not support the video tag.
          </video>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500">Preview not available</p>
            <Button
              variant="outline"
              className="mt-4"
              asChild
            >
              <a href={media.url} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getMediaIcon(media.media_type || 'file')}
              {media.original_name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            {renderPreview()}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">Type</p>
              <p className="mt-1">{media.media_type}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Size</p>
              <p className="mt-1">{formatSize(media.size)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Format</p>
              <p className="mt-1">{media.mime_type}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Uploaded</p>
              <p className="mt-1">{format(new Date(media.created_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>


          {/* URL */}
          <div>
            <p className="font-medium text-gray-500 text-sm mb-2">Public URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs overflow-x-auto">
                {media.url}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                asChild
              >
                <a href={media.url} download={media.original_name}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={onCopyUrl}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}