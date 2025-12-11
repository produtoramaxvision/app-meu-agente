-- Create very permissive policies for avatars bucket (temporary solution)
-- Anyone can view avatars
CREATE POLICY "Public access to avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Anyone can insert to avatars
CREATE POLICY "Anyone can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Anyone can update avatars
CREATE POLICY "Anyone can update avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'avatars');

-- Anyone can delete avatars
CREATE POLICY "Anyone can delete avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'avatars');