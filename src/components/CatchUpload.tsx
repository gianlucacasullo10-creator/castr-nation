import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, X, Zap, ShieldCheck, Scale, Loader2 } from "lucide-react";

const CatchUpload = ({ onComplete }: { onComplete: () => void }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const startAIAuthentication = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setScanStatus("Detecting Species...");

    // STAGE 1: AI Analysis Simulation (Real API call would go here)
    await new Promise(r => setTimeout(r, 1500));
    setScanStatus("Estimating Scale via Reference...");
    
    await new Promise(r => setTimeout(r, 1500));
    setScanStatus("Calculating CASTRS Point Multiplier...");
    
    await new Promise(r => setTimeout(r, 1500));
    
    // STAGE 2: Upload to Supabase Storage & Database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('catches')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      // Logic for AI Result (Mocking the AI's math for now)
      // This is where you'd use the logic: Points = (Length * Species Multiplier)
      const { error: dbError } = await supabase.from('catches').insert([{
        user_id: user.id,
        species: "Northern Pike", // This would come from AI
        points: 450,             // This would come from AI
        image_url: filePath,
        location_name: "Lake Agartha",
        ai_verified: true
      }]);

      if (dbError) throw dbError;

      toast({ title: "Catch Verified!", description: "+450 Points added to your profile." });
      onComplete();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black italic uppercase text-primary">Log Catch</h2>
        <button onClick={onComplete} className="p-2 text-white/50 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {!previewUrl ? (
        <label className="flex-1 border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/5 transition-all">
          <Camera size={48} className="text-primary/40" />
          <p className="font-black uppercase text-xs tracking-widest text-primary/60">Upload Photo for AI Audit</p>
          <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          <div className="relative w-full aspect-square rounded-[40px] overflow-hidden border-2 border-primary/30">
            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
            
            {isAnalyzing && (
              <div className="absolute inset-0">
                {/* THE SCANNING LASER */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-transparent h-20 w-full animate-pulse translate-y-[-100%] animate-scan-slow shadow-[0_0_20px_#ccff00]" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-primary mb-2" size={32} />
                  <p className="font-black italic uppercase text-[10px] tracking-tighter text-primary">
                    {scanStatus}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isAnalyzing && (
            <Button 
              onClick={startAIAuthentication}
              className="w-full h-16 rounded-3xl bg-primary text-black font-black italic uppercase text-lg shadow-[0_0_30px_rgba(204,255,0,0.3)]"
            >
              Start AI Verification
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CatchUpload;
