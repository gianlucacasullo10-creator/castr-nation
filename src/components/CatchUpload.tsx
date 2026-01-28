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
      
      // Using the pro-slug 'clever-endpoint'
      const { data, error: aiError } = await supabase.functions.invoke('clever-endpoint', {
        body: { image: base64Image }
      });

      if (aiError) throw new Error("AI Service Unavailable. Check Supabase Edge Function logs.");

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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center overflow-x-hidden w-full h-[100dvh]">
      {/* HEADER - Sticky at top, constrained width */}
      <div className="w-full max-w-md flex justify-between items-center p-6 border-b border-white/10 shrink-0 bg-black">
        <h2 className="text-xl font-black italic uppercase text-primary tracking-tighter">AI Audit</h2>
        <button onClick={onComplete} className="p-2 text-white/50 active:text-white transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* SCROLLABLE BODY - Centered and width-limited */}
      <div className="w-full max-w-md flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center">
        <div className="p-6 w-full flex flex-col items-center space-y-8">
          
          {!previewUrl ? (
            <label className="w-full aspect-square max-w-[320px] border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center cursor-pointer bg-white/5 active:scale-95 transition-all">
              <Camera size={48} className="text-primary mb-4" />
              <div className="text-center">
                <p className="text-white font-black uppercase text-sm tracking-widest">Tap to Scan</p>
                <p className="text-[10px] font-bold text-white/30 uppercase mt-1 tracking-widest">Include rod or hand for scale</p>
              </div>
              <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} capture="environment" />
            </label>
          ) : (
            <div className="flex flex-col items-center w-full gap-8">
              
              {/* IMAGE CONTAINER - STRICT LIMITS to prevent iPhone width bleed */}
              <div className="relative w-full aspect-square max-w-[320px] rounded-[48px] overflow-hidden border-2 border-primary/30 shadow-[0_0_50px_rgba(204,255,0,0.1)] bg-zinc-900">
                <img 
                  src={previewUrl} 
                  className="w-full h-full object-cover" 
                  alt="Fish Preview" 
                />
                
                {isAnalyzing && !aiResult && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="animate-spin text-primary mb-4" size={40} />
                    <p className="text-primary font-black italic uppercase text-xs tracking-widest animate-pulse">{scanStatus}</p>
                  </div>
                )}

                {aiResult && (
                  <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-8 animate-in zoom-in-95 duration-500">
                    <CheckCircle2 size={64} className="mb-4" />
                    <h3 className="text-4xl font-black italic uppercase leading-none text-center">
                      {aiResult.species}
                    </h3>
                    <p className="text-2xl font-black mt-4 italic">+{aiResult.points} PTS</p>
                  </div>
                )}
              </div>

              {!isAnalyzing && !aiResult && (
                <Button 
                  onClick={startAIAuthentication}
                  className="w-full max-w-[320px] h-20 rounded-[30px] bg-primary text-black font-black italic uppercase text-xl shadow-[0_15px_30px_rgba(204,255,0,0.3)] active:scale-95 transition-all"
                >
                  <ShieldCheck className="mr-3" size={24} /> Authenticate
                </Button>
              )}
            </div>
          )}
          
          {/* Bottom Safety Spacer for iPhone Notch */}
          <div className="h-24 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default CatchUpload;
