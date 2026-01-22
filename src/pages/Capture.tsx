import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, MapPin, Fish, Weight, Ruler, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Capture = () => {
  const [species, setSpecies] = useState("");
  const [locationName, setLocationName] = useState("");
  const [weight, setWeight] = useState(2.0); // Default to 2 lbs
  const [length, setLength] = useState(12.0); // Default to 12 inches
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let imageUrl = "";

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('catch_photos')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('catch_photos')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { error: dbError } = await supabase
        .from('catches')
        .insert([{
          user_id: user.id,
          species,
          location_name: locationName,
          weight,
          length,
          image_url: imageUrl,
        }]);

      if (dbError) throw dbError;

      toast({ title: "Trophy Logged!", description: "Your catch is live on the feed." });
      navigate("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-black italic tracking-tighter text-primary">LOG CATCH</h1>

      <form onSubmit={handleCapture} className="space-y-6">
        <Card className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed bg-muted overflow-hidden rounded-3xl">
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="text-center p-6">
              <Camera className="mx-auto mb-2 text-muted-foreground" size={48} />
              <p className="text-sm font-bold text-muted-foreground uppercase">Snap the Trophy</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            required
          />
        </Card>

        <div className="space-y-4">
          <div className="relative">
            <Fish className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Species (e.g. Largemouth Bass)"
              className="pl-10 h-12 bg-card border-none rounded-2xl shadow-sm font-bold"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Fishing Spot"
              className="pl-10 h-12 bg-card border-none rounded-2xl shadow-sm font-bold"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />
          </div>

          {/* WEIGHT SLIDER */}
          <div className="bg-card p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Weight size={12} /> Weight
              </label>
              <span className="text-lg font-black text-primary italic">{weight} LBS</span>
            </div>
            <input
              type="range" min="0" max="25" step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* LENGTH SLIDER */}
          <div className="bg-card p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Ruler size={12} /> Length
              </label>
              <span className="text-lg font-black text-primary italic">{length} IN</span>
            </div>
            <input
              type="range" min="0" max="60" step="0.5"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={uploading}
          className="w-full h-14 text-lg font-black italic uppercase rounded-2xl shadow-lg"
        >
          {uploading ? <Loader2 className="animate-spin" /> : "Submit Trophy"}
        </Button>
      </form>
    </div>
  );
};

export default Capture;
