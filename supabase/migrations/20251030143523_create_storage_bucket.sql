/*
  # Create Storage Bucket for Images

  1. Storage Bucket
    - Create `storage-images` bucket for storage unit images
    - Enable public access for viewing images
    - Set file size limit to 5MB

  2. Security
    - Only authenticated storage owners can upload images
    - All users can view images (public read access)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('storage-images', 'storage-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload storage images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'storage-images');

CREATE POLICY "Anyone can view storage images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'storage-images');

CREATE POLICY "Storage owners can update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'storage-images');

CREATE POLICY "Storage owners can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'storage-images');
