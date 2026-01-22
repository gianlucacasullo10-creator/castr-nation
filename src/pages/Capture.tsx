import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, MapPin, Fish, Loader2, CheckCircle2 } from "lucide-react";
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
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // SCORING ENGINE: Determines points based on species
  const getFishPoints = (name: string) => {
    const s = name.toLowerCase();
    if (s.includes("muskie") || s.includes("muskellunge")) return 150;
    if (s.includes("smallmouth")) return 85;
    if (s.includes("largemouth")) return 75;
    if (s.includes("walleye")) return 90;
    if (s.includes("pike")) return 100;
    if (s.includes("trout")) return 60;
    if (s.includes("catfish")) return 50;
    return 25; // Default for panfish/others
  };

  const handleSpeciesChange = (value: string) => {
    setSpecies(value);
    if (value.length > 1) {
      const filtered = FISH_SPECIES.filter(f => 
        f.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
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

      const pointsScored = getFishPoints(species);

      const { error: dbError } = await supabase
        .from('catches')
        .insert([{
          user_id: user.id,
          species,
          location_name: locationName,
          points: pointsScored,
          image_url: imageUrl,
          weight: 0, // Resetting to 0 as points take priority
          length: 0
        }]);

      if (dbError) throw dbError;

      toast({ 
        title: "Trophy Verified!", 
        description: `You earned ${pointsScored} points for that ${species}!` 
      });
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
          {/* SPECIES INPUT WITH AUTOCOMPLETE */}
          <div className="relative">
            <div className="relative">
              <Fish className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search Species..."
                className="pl-10 h-12 bg-card border-none rounded-2xl shadow-sm font-bold focus-visible:ring-primary"
                value={species}
                onChange={(e) => handleSpeciesChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute z-50 w-full mt-2 border-none shadow-2xl rounded-2xl overflow-hidden bg-card/95 backdrop-blur-sm">
                <div className="p-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-primary/10 hover:text-primary transition-colors rounded-xl flex items-center justify-between"
                      onClick={() => {
                        setSpecies(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                      <CheckCircle2 size={14} className="text-primary opacity-50" />
                    </button>
                  ))}
                </div>
              </Card>
            )}
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

          {/* AI SCORING PREVIEW */}
          <div className="bg-card p-6 rounded-3xl border-2 border-primary/10 flex flex-col items-center justify-center space-y-2 shadow-inner">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full bg-primary transition-all duration-700 ${previewUrl && species ? 'w-full' : 'w-1/3'}`}
              ></div>
            </div>
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">
              {previewUrl && species ? "Ready for AI Verification" : "Awaiting Photo & Species"}
            </p>
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
