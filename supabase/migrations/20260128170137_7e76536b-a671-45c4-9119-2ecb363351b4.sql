-- Create catches table
CREATE TABLE public.catches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  species TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  length_inches NUMERIC,
  image_url TEXT,
  ai_verified BOOLEAN DEFAULT false,
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catches ENABLE ROW LEVEL SECURITY;

-- Users can view all catches (for the feed)
CREATE POLICY "Anyone can view catches" 
ON public.catches 
FOR SELECT 
USING (true);

-- Users can create their own catches
CREATE POLICY "Users can create their own catches" 
ON public.catches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own catches
CREATE POLICY "Users can update their own catches" 
ON public.catches 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own catches
CREATE POLICY "Users can delete their own catches" 
ON public.catches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for catch photos
INSERT INTO storage.buckets (id, name, public) VALUES ('catch_photos', 'catch_photos', true);

-- Storage policies for catch_photos bucket
CREATE POLICY "Anyone can view catch photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'catch_photos');

CREATE POLICY "Authenticated users can upload catch photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'catch_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own catch photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'catch_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own catch photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'catch_photos' AND auth.uid()::text = (storage.foldername(name))[1]);