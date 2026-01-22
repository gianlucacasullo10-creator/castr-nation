import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, MapPin, Fish, Loader2, CheckCircle2, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const FISH_SPECIES = [
  "Largemouth Bass", "Smallmouth Bass", "Spotted Bass", 
  "Northern Pike", "Muskellunge (Muskie)", "Walleye", 
  "Rainbow Trout", "Brown Trout", "Brook Trout", "Lake Trout",
  "Bluegill", "Pumpkinseed Sunfish", "Crappie (Black)", "Crappie (White)",
  "Channel Catfish", "Blue Catfish", "Flathead Catfish", 
  "Yellow Perch", "Common Carp", "Striped Bass", "Bullhead"
].sort();

const Capture = () => {
  const [species, setSpecies] = useState("");
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // GPS State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // 1. Automatically grab GPS on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsLocating(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          setIsLocating(false);
        }
      );
    }
  }, []);

  const getFishPoints = (name: string) => {
    const s = name.toLowerCase();
    if (s.includes("muskie")) return 150;
    if (s.includes("smallmouth")) return 85;
    if (s.includes("largemouth")) return 75;
    if (s.includes("walleye")) return 90;
    return 25;
  };

  const handleSpeciesChange = (value: string) => {
    setSpecies(value);
    if (value.length > 1) {
      const filtered = FISH_SPECIES.filter(f => f.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

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
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('catch_photos').upload(filePath, image);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('catch_photos').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // AI Scoring Simulation (Species Base * Random Size Multiplier)
      let pointsScored = getFishPoints(species);
      const aiSizeMultiplier = Math.random() * (1.8 - 1.1) + 1.1; 
      pointsScored = Math.round(pointsScored * aiSizeMultiplier);

      const { error: dbError } = await supabase
        .from('catches')
        .insert([{
          user_id: user.id,
          species,
          location_name: locationName,
          points: pointsScored,
          image_url: imageUrl,
          latitude,
          longitude,
          weight: 0,
          length: 0
        }]);

      if (dbError) throw dbError;

      toast({ title: "Trophy Verified!", description: `Earned ${pointsScored} PTS via GPS & AI.` });
      navigate("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase">Verify Catch</h1>

      <form onSubmit={handleCapture} className="space-y-6">
        <Card className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed bg-muted overflow-hidden rounded-3xl">
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="text-center p-6">
              <Camera className="mx-auto mb-2 text-muted-foreground" size={48} />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Snap Fish</p>
            </div>
          )}
          <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" required />
        </Card>

        <div className="space-y-4">
          {/* Species Dropdown */}
          <div className="relative">
            <Fish className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Identify Species..."
              className="pl-10 h-12 bg-card border-none rounded-2xl shadow-sm font-bold"
              value={species}
              onChange={(e) => handleSpeciesChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute z-50 w-full mt-2 border-none shadow-2xl rounded-2xl overflow-hidden bg-card/95 backdrop-blur-sm">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-primary/10 flex justify-between items-center" onClick={() => { setSpecies(s); setShowSuggestions(false); }}>
                    {s} <CheckCircle2 size={14} className="text-primary" />
                  </button>
                ))}
              </Card>
            )}
          </div>

          {/* GPS Enhanced Location Input */}
          <div className="relative">
            <MapPin className={`absolute left-3 top-3 ${latitude ? "text-primary" : "text-muted-foreground"}`} size={18} />
            <Input
              placeholder={isLocating ? "Acquiring GPS..." : "Fishing Spot Name"}
              className="pl-10 h-12 bg-card border-none rounded-2xl shadow-sm font-bold"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />
            {latitude && (
              <div className="absolute right-3 top-3 flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                <Globe size={10} className="text-primary animate-spin" />
                <span className="text-[8px] font-black text-primary uppercase">GPS Locked</span>
              </div>
            )}
          </div>

          {/* AI Processing Status */}
          <div className="bg-card p-4 rounded-3xl border border-primary/10 flex flex-col items-center gap-2">
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full bg-primary transition-all duration-1000 ${previewUrl && species ? 'w-full' : 'w-1/4'}`}></div>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
               AI REF: {previewUrl && species ? "Ready to Score" : "Scanning metadata..."}
            </p>
          </div>
        </div>

        <Button type="submit" disabled={uploading} className="w-full h-14 text-lg font-black italic uppercase rounded-2xl shadow-lg">
          {uploading ? <Loader2 className="animate-spin" /> : "Verify & Submit"}
        </Button>
      </form>
    </div>
  );
};

export default Capture;
