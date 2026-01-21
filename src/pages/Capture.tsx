import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Capture = () => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      // Simulate AI Analysis
      setSpecies("Analyzing...");
      setTimeout(() => setSpecies("Largemouth Bass"), 1500); 
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('fish-photo') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Upload Image to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fish-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fish-photos')
        .getPublicUrl(filePath);

      // 3. Save to Catches Table
      const { error: dbError } = await supabase.from('catches').insert({
        user_id: user.id,
        species: species,
        location: location,
        image_url: publicUrl,
        weight: "0", // Placeholder for now
        length: "0"  // Placeholder for now
      });

      if (dbError) throw dbError;

      toast({ title: "Success!", description: "Catch added to your feed." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold italic">CAPTURE CATCH</h1>
      
      <div className="aspect-square bg-muted rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <img src={previewUrl} className="w-full h-full object-cover" />
        ) : (
          <>
            <Camera size={48} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Tap to upload photo</p>
          </>
        )}
        <input 
          type="file" 
          id="fish-photo"
          accept="image/*" 
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Detected Species</label>
          <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Species" required />
        </div>
        <div>
          <label className="text-sm font-medium">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lake Ontario" required />
        </div>
        <Button type="submit" className="w-full py-6 text-lg font-bold" disabled={uploading || !previewUrl}>
          {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
          POST CATCH
        </Button>
      </form>
    </div>
  );
};

export default Capture;
