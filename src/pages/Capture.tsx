import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, MapPin, Fish, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getStorageUrl } from '@/utils/storage';

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
  const [country, setCountry] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const getCityName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.county;
      const countryName = data.address.country;
      
      if (city) setLocationName(city);
      if (countryName) setCountry(countryName);
    } catch (error) { 
      console.error("Geocoding error:", error); 
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        getCityName(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      }, () => setIsLocating(false));
    }
  }, []);

  const isAllowedRegion = country === "Canada" || country === "United States";

  const getFishPoints = (name: string) => {
    const s = name.toLowerCase();
    if (s.includes("muskie")) return 150;
    if (s.includes("smallmouth")) return 85;
    if (s.includes("largemouth")) return 75;
    if (s.includes("walleye")) return 90;
    return 25;
  };

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedRegion) {
      toast({ variant: "destructive", title: "Out of Bounds", description: "The Nation currently only supports Canada and the USA." });
      return;
    }
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let imageUrl = "";
      if (image) {
        const filePath = `${user.id}/${Math.random()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('catch_photos').upload(filePath, image);
        if (uploadError) throw uploadError;
        imageUrl = getStorageUrl('catch_photos', filePath);
      }

      let pointsScored = Math.round(getFishPoints(species) * (Math.random() * (1.8 - 1.1) + 1.1));

      const { error: dbError } = await supabase.from('catches').insert([{
        user_id: user.id, species, location_name: locationName, points: pointsScored, image_url: imageUrl, latitude, longitude
      }]);
      if (dbError) throw dbError;

      // Activity Logging for Achievements
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: userCatches } = await supabase.from('catches').select('id').eq('user_id', user.id);
      
      let existingTitles = profile?.unlocked_titles || ['Beginner'];
      let unlockedThisTurn: string[] = [];

      if (userCatches && userCatches.length >= 5 && !existingTitles.includes("Fingerling")) {
        unlockedThisTurn.push("Fingerling");
      }

      if (unlockedThisTurn.length > 0) {
        const newTitles = [...existingTitles, ...unlockedThisTurn];
        await supabase.from('profiles').update({ unlocked_titles: newTitles }).eq('id', user.id);
        const activityLogs = unlockedThisTurn.map(title => ({ user_id: user.id, type: 'TITLE_UNLOCK', content: title }));
        await supabase.from('activities').insert(activityLogs);
      }

      toast({ title: "Trophy Verified!", description: `Earned ${pointsScored} PTS.` });
      navigate("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally { setUploading(false); }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6 text-left">
      <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase">Verify Catch</h1>
      
      {!isAllowedRegion && country && (
        <Card className="p-4 bg-red-500/10 border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <p className="text-[10px] font-black uppercase text-red-500 leading-tight">
            Location detected as {country}. The Nation is currently exclusive to North America.
          </p>
        </Card>
      )}

      <form onSubmit={handleCapture} className="space-y-6">
        <Card className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed bg-muted overflow-hidden rounded-[40px]">
          {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Camera size={48} className="text-muted-foreground opacity-20" />}
          <input type="file" accept="image/*" capture="environment" onChange={(e) => {
            if (e.target.files?.[0]) {
              setImage(e.target.files[0]);
              setPreviewUrl(URL.createObjectURL(e.target.files[0]));
            }
          }} className="absolute inset-0 opacity-0 cursor-pointer" required />
        </Card>

        <div className="space-y-4">
          <div className="relative">
            <Fish className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input placeholder="Species..." className="pl-10 h-12 bg-card border-none rounded-2xl font-bold" value={species} onChange={(e) => {
              setSpecies(e.target.value);
              setSuggestions(FISH_SPECIES.filter(f => f.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5));
              setShowSuggestions(true);
            }} required />
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute z-50 w-full mt-2 border-none shadow-2xl rounded-2xl bg-card/95 backdrop-blur-sm overflow-hidden">
                {suggestions.map(s => (
                  <button key={s} type="button" className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-primary/10 flex justify-between" onClick={() => { setSpecies(s); setShowSuggestions(false); }}>
                    {s} <CheckCircle2 size={14} className="text-primary" />
                  </button>
                ))}
              </Card>
            )}
          </div>
          <div className="relative">
            <MapPin className={`absolute left-3 top-3 ${isAllowedRegion ? 'text-primary' : 'text-red-500'}`} size={18} />
            <Input className={`pl-10 h-12 bg-card border-none rounded-2xl font-bold ${isAllowedRegion ? 'text-primary' : 'text-red-500'}`} value={locationName || (isLocating ? "Locating..." : "Unknown")} readOnly />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={uploading || !isAllowedRegion || isLocating} 
          className="w-full h-14 text-lg font-black italic uppercase rounded-2xl shadow-lg"
        >
          {uploading ? <Loader2 className="animate-spin" /> : "Verify & Submit"}
        </Button>
      </form>
    </div>
  );
};

export default Capture;
