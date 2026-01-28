import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, X, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

const CatchUpload = ({ onComplete }: { onComplete: () => void }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAiResult(null);
    }
  };

  const startAIAuthentication = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setScanStatus("Establishing Secure Link...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      setScanStatus("AI Analyzing Species...");
      
      // Attempting to hit the Edge Function
      const { data, error: aiError } = await supabase.functions.invoke('verify-catch', {
        body: { image: base64Image }
      });

      if (aiError) throw new Error("AI Service Unavailable. Is the function deployed?");

      setScanStatus("Finalizing Records...");
      const fileName = `${user.id}/${Date.now()}.jpg`;
      await supabase.storage.from('catch_photos').upload(fileName, selectedImage);

      await supabase.from('catches').insert([{
        user_id: user.id,
        species: data.species,
        points: data.points,
        length_inches: data.length,
        image_url: fileName,
        ai_verified: true,
        location_name: "St. Catharines"
      }]);

      setAiResult(data);
      toast({ title: "CASTRS Verified!" });
      setTimeout(() => onComplete(), 3000);

    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center animate-in fade-in">
      {/* HEADER - Constrained to phone width */}
      <div className="w-full max-w-md flex justify-between items-center p-6 border-b border-white/10 shrink-0">
        <h2 className="text-xl font-black italic uppercase text-primary tracking-tighter">New Catch</h2>
        <button onClick={onComplete} className="p-2 text-white/50"><X size={24} /></button>
      </div>

      {/* SCROLLABLE BODY - Centered and width-limited */}
      <div className="w-full max-w-md flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center">
        <div className="p-6 w-full flex flex-col items-center space-y-6">
          
          {!previewUrl ? (
            <label className="w-[85vw] max-w-sm aspect-square border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center cursor-pointer bg-white/5">
              <Camera size={40} className="text-primary mb-2" />
              <p className="text-white font-black uppercase text-[10px] tracking-widest text-center px-4">Tap to upload fish photo</p>
              <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex flex-col items-center w-full gap-6">
              
              {/* IMAGE CONTAINER - STRICT LIMITS */}
              <div className="relative w-[85vw] max-w-sm aspect-square rounded-[32px] overflow-hidden border-2 border-primary/30 shadow-2xl bg-zinc-900">
                <img 
                  src={previewUrl} 
                  className="w-full h-full object-cover" 
                  alt="Fish Preview" 
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                    <Loader2 className="animate-spin text-primary mb-4" size={32} />
                    <p className="text-primary font-black italic uppercase text-xs tracking-widest animate-pulse">{scanStatus}</p>
                  </div>
                )}

                {aiResult && (
                  <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6">
                    <CheckCircle2 size={48} className="mb-2" />
                    <h3 className="text-3xl font-black italic uppercase leading-none">{aiResult.species}</h3>
                    <p className="text-xl font-black mt-2">+{aiResult.points} PTS</p>
                  </div>
                )}
              </div>

              {!isAnalyzing && !aiResult && (
                <Button 
                  onClick={startAIAuthentication}
                  className="w-[85vw] max-w-sm h-16 rounded-[24px] bg-primary text-black font-black italic uppercase text-lg shadow-lg active:scale-95 transition-transform"
                >
                  <ShieldCheck className="mr-2" /> Verify and Submit
                </Button>
              )}
            </div>
          )}
          
          {/* Bottom Safety Spacer */}
          <div className="h-20 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default CatchUpload;
