import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Upload, Loader2, Fish } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Capture = () => {
  const [uploading, setUploading] = useState(false);
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first");

      // For now, we are saving the text data. 
      // We will add the actual image storage logic in the next step!
      const { error } = await supabase
        .from('catches')
        .insert([
          {
            user_id: user.id,
            species: species,
            location_name: location,
            weight: 0,
            length: 0
          }
        ]);

      if (error) throw error;

      toast({ title: "Catch Recorded!", description: `Nice ${species}!` });
      navigate("/"); // Go back to home to see the new catch
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 pb-24">
      <div className="text-center space-y-2">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Camera size={40} className="text-primary" />
        </div>
        <h1 className="text-3xl font-black italic uppercase italic tracking-tighter">Log a Catch</h1>
        <p className="text-muted-foreground text-sm">Record your latest trophy</p>
      </div>

      <form onSubmit={handleCapture} className="space-y-6">
        <div className="space-y-4 bg-card p-6 rounded-3xl border-2 border-border shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase ml-1">Fish Species</label>
            <Input 
              placeholder="e.g. Largemouth Bass" 
              value={species} 
              onChange={(e) => setSpecies(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase ml-1">Location</label>
            <Input 
              placeholder="e.g. Greenlane Reservoir" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="pt-4">
             <div className="h-40 w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
                <Upload size={24} className="mb-2" />
                <span className="text-[10px] font-bold uppercase">Upload Photo</span>
                <span className="text-[8px] opacity-60">(Coming Soon)</span>
             </div>
          </div>
        </div>

        <Button type="submit" className="w-full py-8 text-xl font-black italic uppercase rounded-2xl shadow-lg" disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin mr-2" /> : <Fish className="mr-2" />}
          Submit Catch
        </Button>
      </form>
    </div>
  );
};

export default Capture;
