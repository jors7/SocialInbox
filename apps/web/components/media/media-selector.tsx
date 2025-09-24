import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Tabs, TabsList, TabsTrigger } from '@socialinbox/ui';
import { ScrollArea } from '@socialinbox/ui';
import { 
  Search, 
  Image, 
  Video, 
  Check,
  Upload
} from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { MediaUpload } from './media-upload';
import type { Database } from '@socialinbox/shared';

type MediaItem = Database['public']['Tables']['media_library']['Row'];

interface MediaSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  mediaType?: 'image' | 'video' | 'all';
}

export function MediaSelector({ open, onClose, onSelect, mediaType = 'all' }: MediaSelectorProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [selectedType, setSelectedType] = useState(mediaType === 'all' ? 'image' : mediaType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open]);

  useEffect(() => {
    filterMedia();
  }, [media, selectedType, searchQuery]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!teamMember) return;

      const query = supabase
        .from('media_library')
        .select('*')
        .eq('team_id', teamMember.team_id)
        .order('created_at', { ascending: false });

      if (mediaType !== 'all') {
        query.eq('media_type', mediaType);
      }

      const { data } = await query;
      setMedia(data || []);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = media;

    if (selectedType && mediaType === 'all') {
      filtered = filtered.filter(item => item.media_type === selectedType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.original_name.toLowerCase().includes(query)
      );
    }

    setFilteredMedia(filtered);
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  const handleUpload = async (files: FileList) => {
    // Handle upload and refresh media list
    await loadMedia();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            {mediaType === 'all' && (
              <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as 'image' | 'video')}>
                <TabsList>
                  <TabsTrigger value="image">Images</TabsTrigger>
                  <TabsTrigger value="video">Videos</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <MediaUpload 
              onUpload={handleUpload}
              accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'image/*,video/*'}
            >
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </MediaUpload>
          </div>

          {/* Media Grid */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading media...</p>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Image className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No media found</p>
                <p className="text-sm text-gray-400 mt-1">Upload or adjust your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 p-1">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedMedia?.id === item.id 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMedia(item)}
                  >
                    {item.media_type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.original_name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-black flex items-center justify-center">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    )}
                    
                    {selectedMedia?.id === item.id && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-blue-500 rounded-full p-1">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-white text-xs truncate">{item.original_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div>
              {selectedMedia && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedMedia.original_name}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={!selectedMedia}>
                Select
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}