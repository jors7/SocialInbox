-- Create media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Team members can upload media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public.team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can view their media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public.team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete their media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public.team_members
    WHERE user_id = auth.uid()
  )
);