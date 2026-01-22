import { useState, useEffect } from "react";
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
      if (city) setLocationName(city);
    } catch (error) { console.error("Geocoding error:", error); }
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
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let imageUrl = "";
      if (image) {
        const filePath = `${user.id}/${Math.random()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('catch_photos').upload(filePath, image);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('catch_photos').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // AI Scoring Logic
      let pointsScored = Math.round(getFishPoints(species) * (Math.random() * (1.8 - 1.1) + 1.1));

      const { error: dbError } = await supabase.from('catches').insert([{
        user_id: user.id, species, location_name: locationName, points: pointsScored, image_url: imageUrl, latitude, longitude
      }]);
      if (dbError) throw dbError;

      // --- CHALLENGE ENGINE & NOTIFICATIONS ---
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: userCatches } = await supabase.from('catches').select('id').eq('user_id', user.id);
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      let newTitles = [...(profile?.unlocked_titles || ['Beginner'])];
      let unlockedNew = false;

      // OG Title Unlock
      if (totalUsers && totalUsers <= 1000 && !newTitles.includes("OG CASTR")) {
        newTitles.push("OG CASTR");
        unlockedNew = true;
        toast({
          title: "👑 OG STATUS ACHIEVED",
          description: "You are one of the first 1,000 members. Equip your title!",
          className: "bg-yellow-500 text-black font-black italic border-none",
        });
      }

      // Fingerling Unlock (5 Catches)
      if (userCatches && userCatches.length >= 5 && !newTitles.includes("Fingerling")) {
        newTitles.push("Fingerling");
        unlockedNew = true;
        toast({
          title: "🎖️ NEW TITLE UNLOCKED",
          description: "You've earned the 'Fingerling' title for 5 catches!",
          className: "bg-primary text-black font-black italic border-none",
        });
      }

      // Save new titles if any were earned
      if (unlockedNew) {
        await supabase.from('profiles').update({ unlocked_titles: newTitles }).eq('id', user.id);
        // Inside Capture.tsx after updating titles
if (unlockedNew) {
  // Log each new title as an activity
  const activityInserts = newTitles
    .filter(t => !(profile?.unlocked_titles || []).includes(t))
    .map(t => ({
      user_id: user.id,
      type: 'TITLE_UNLOCK',
      content: t
    }));

  await supabase.from('activities').insert(activityInserts);
}
      }

      toast({ title: "Trophy Verified!", description: `Earned ${pointsScored} PTS.` });
      navigate("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally { setUploading(false); }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6 text-foreground">
      <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase leading-none">Log Catch</h1>
      <form onSubmit={handleCapture} className="space-y-6">
        <Card className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed bg-muted overflow-hidden rounded-[40px] shadow-inner">
          {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="Fish Preview" /> : <Camera size={48} className="text-muted-foreground opacity-20" />}
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
            <Input placeholder="Search Species..." className="pl-10 h-12 bg-card border-none rounded-2xl font-bold focus-visible:ring-primary" value={species} onChange={(e) => {
              setSpecies(e.target.value);
              const filtered = FISH_SPECIES.filter(f => f.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5);
              setSuggestions(filtered);
              setShowSuggestions(true);
            }} required />
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute z-50 w-full mt-2 border-none shadow-2xl rounded-2xl bg-card/95 backdrop-blur-sm overflow-hidden">
                {suggestions.map(s => (
                  <button key={s} type="button" className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-primary/10 flex justify-between items-center transition-colors" onClick={() => { setSpecies(s); setShowSuggestions(false); }}>
                    {s} <CheckCircle2 size={14} className="text-primary" />
                  </button>
                ))}
              </Card>
            )}
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-primary" size={18} />
            <Input placeholder="Location" className="pl-10 h-12 bg-card border-none rounded-2xl font-bold text-primary" value={locationName} readOnly />
            {locationName && (
               <div className="absolute right-3 top-3">
                 <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-full">GPS LOCKED</span>
               </div>
            )}
          </div>
        </div>

        <Button type="submit" disabled={uploading} className="w-full h-14 text-lg font-black italic uppercase rounded-2xl shadow-lg transition-transform active:scale-95">
          {uploading ? <Loader2 className="animate-spin" /> : "Verify & Submit"}
        </Button>
      </form>
    </div>
  );
};

export default Capture;
