import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Upload, Loader2, Fish, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Capture = () => {
  const [uploading, setUploading] = useState(false);
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first");

      let photoUrl = "";

      // 1. Upload Image to Storage
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('catch_photos')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('catch_photos')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      // 2. Insert Catch Data (Note: Make sure 'location' matches your table column)
      const { error } = await supabase
        .from('catches')
        .insert([
          {
            user_id: user.id,
            species: species,
            location_name: location, // Verify this matches your table!
            image_url: photoUrl,
            weight: 0,
            length: 0
          }
        ]);

      if (error) throw error;

      toast({ title: "Catch Recorded!", description: `Nice ${species}!` });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 pb-24">
      <h1 className="text-3xl font-black italic uppercase text-center tracking-tighter">Log a Catch</h1>

      <form onSubmit={handleCapture} className="space-y-6">
        <div className="space-y-4 bg-card p-6 rounded-3xl border-2 border-border shadow-sm">
          
          {/* Image Upload Area */}
          <div className="relative">
            {previewUrl ? (
              <div className="relative h-60 w-full rounded-2xl overflow-hidden border-2 border-primary">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                <button 
                  onClick={() => {setPreviewUrl(null); setImageFile(null);}}
                  className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="h-40 w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
                <Upload size={24} className="mb-2" />
                <span className="text-[10px] font-bold uppercase">Tap to Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase ml-1">Fish Species</label>
            <Input 
              placeholder="e.g. Smallmouth Bass" 
              value={species} 
              onChange={(e) => setSpecies(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase ml-1">Location</label>
            <Input 
              placeholder="e.g. Local Pond" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full py-8 text-xl font-black italic uppercase rounded-2xl shadow-lg" disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin mr-2" /> : <Fish className="mr-2" />}
          Submit Trophy
        </Button>
      </form>
    </div>
  );
};

export default Capture;
