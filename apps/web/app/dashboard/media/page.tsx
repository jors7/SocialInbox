'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@socialinbox/ui';
import { 
  Upload, 
  Image, 
  Video, 
  File,
  Search,
  Grid3x3,
  List,
  Trash2,
  Download,
  Eye,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { MediaUpload } from '../../../components/media/media-upload';
import { MediaGrid } from '../../../components/media/media-grid';
import { MediaPreview } from '../../../components/media/media-preview';
import type { Database } from '@socialinbox/shared';

type MediaItem = Database['public']['Tables']['media_library']['Row'];

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    filterMedia();
  }, [media, selectedType, searchQuery]);

  const loadMedia = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user's team
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!teamMember) {
        throw new Error('No team found');
      }

      // Load media
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('team_id', teamMember.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMedia(data || []);
    } catch (error) {
      console.error('Failed to load media:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media library',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = media;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.media_type === selectedType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.file_name.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredMedia(filtered);
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      for (const file of Array.from(files)) {
        // Validate file
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 50MB limit`,
            variant: 'destructive',
          });
          continue;
        }

        // Determine media type
        let mediaType: 'image' | 'video' | 'audio' | 'document' = 'document';
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';

        // Upload to Supabase Storage
        const fileName = `${teamMember.team_id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        // Get image dimensions if it's an image
        let width, height;
        if (mediaType === 'image') {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              width = img.width;
              height = img.height;
              resolve(true);
            };
            img.src = URL.createObjectURL(file);
          });
        }

        // Save to database
        const { error: dbError } = await supabase
          .from('media_library')
          .insert({
            team_id: teamMember.team_id,
            media_type: mediaType,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_url: uploadData.path,
            public_url: publicUrl,
            width,
            height,
            uploaded_by: user!.id,
          });

        if (dbError) throw dbError;

        toast({
          title: 'Success',
          description: `${file.name} uploaded successfully`,
        });
      }

      // Reload media
      loadMedia();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload media files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([item.storage_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      setMedia(media.filter(m => m.id !== item.id));
      toast({
        title: 'Success',
        description: 'Media deleted successfully',
      });

      if (previewOpen && selectedMedia?.id === item.id) {
        setPreviewOpen(false);
        setSelectedMedia(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete media',
        variant: 'destructive',
      });
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied!',
      description: 'URL copied to clipboard',
    });
  };

  const handlePreview = (item: MediaItem) => {
    setSelectedMedia(item);
    setPreviewOpen(true);
  };

  const totalSize = media.reduce((sum, item) => sum + item.file_size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const mediaStats = {
    images: media.filter(m => m.media_type === 'image').length,
    videos: media.filter(m => m.media_type === 'video').length,
    documents: media.filter(m => m.media_type === 'document').length,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage images, videos, and documents
          </p>
        </div>
        
        <MediaUpload onUpload={handleUpload} disabled={uploading}>
          <Button disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </>
            )}
          </Button>
        </MediaUpload>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{media.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatSize(totalSize)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats.images}</div>
            <p className="text-xs text-muted-foreground">
              Photos & graphics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats.videos}</div>
            <p className="text-xs text-muted-foreground">
              Video content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats.documents}</div>
            <p className="text-xs text-muted-foreground">
              PDFs & files
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            {/* Type Filter */}
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="document">Documents</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No media found</h3>
            <p className="text-gray-500 text-center mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Upload your first media file to get started'}
            </p>
            {!searchQuery && (
              <MediaUpload onUpload={handleUpload} disabled={uploading}>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Media
                </Button>
              </MediaUpload>
            )}
          </CardContent>
        </Card>
      ) : (
        <MediaGrid
          media={filteredMedia}
          viewMode={viewMode}
          onPreview={handlePreview}
          onDelete={handleDelete}
          onCopyUrl={handleCopyUrl}
        />
      )}

      {/* Preview Modal */}
      {selectedMedia && (
        <MediaPreview
          media={selectedMedia}
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setSelectedMedia(null);
          }}
          onDelete={() => handleDelete(selectedMedia)}
          onCopyUrl={() => handleCopyUrl(selectedMedia.public_url)}
        />
      )}
    </div>
  );
}