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
      const { data, error: aiError } = await supabase.functions.invoke('verify-catch', {
        body: { image: base64Image }
      });

      if (aiError) throw aiError;

      setScanStatus("Finalizing Records...");
      const fileName = `${user.id}/${Date.now()}.jpg`;
      await supabase.storage.from('catch_photos').upload(fileName, selectedImage);

      await supabase.from('catches').insert([{
        user_id: user.id,
        species: data.species,
        points: data.points,
        length_inches: data.length,
        image_url: fileName,
        ai_verified: true
      }]);

      setAiResult(data);
      toast({ title: "CASTRS Verified!" });
      setTimeout(() => onComplete(), 3000);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsAnalyzing(false);
    }
  };

  return (
    // "max-w-md mx-auto" ensures it stays iPhone-sized even on a desktop/tablet browser
    <div className="fixed inset-0 z-[100] bg-black flex flex-col p-5 animate-in fade-in sm:max-w-md sm:mx-auto sm:right-0 sm:left-0">
      
      {/* Header Area - Reduced margin for mobile height */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <h2 className="text-xl font-black italic uppercase text-primary tracking-tighter">New Catch</h2>
        <button onClick={onComplete} className="p-2 text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {!previewUrl ? (
        <label className="flex-1 border-2 border-dashed border-primary/20 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
          <div className="bg-primary/10 p-5 rounded-full mb-4">
            <Camera size={32} className="text-primary" />
          </div>
          <p className="text-white font-bold uppercase text-[10px] tracking-widest">Capture Specimen</p>
          <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="flex-1 flex flex-col gap-5 overflow-hidden">
          
          {/* Square Image Container - aspect-square is key for iPhone UI */}
          <div className="relative aspect-square w-full rounded-[32px] overflow-hidden border border-white/10 bg-muted">
            <img src={previewUrl} className="w-full h-full object-cover" alt="Catch preview" />
            
            {isAnalyzing && !aiResult && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-primary mb-3" size={32} />
                <p className="text-primary font-black text-xs uppercase italic tracking-tighter">{scanStatus}</p>
              </div>
            )}

            {aiResult && (
              <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6 animate-in zoom-in-95">
                <CheckCircle2 size={48} className="mb-2" />
                <h3 className="text-2xl font-black italic uppercase text-center leading-none mb-1">{aiResult.species}</h3>
                <p className="text-lg font-bold uppercase tracking-tighter">+{aiResult.points} PTS</p>
              </div>
            )}
          </div>

          {/* Action Button - Placed at the bottom for thumb-reach */}
          <div className="mt-auto pb-4">
            {!isAnalyzing && (
              <Button 
                onClick={startAIAuthentication}
                className="w-full h-14 rounded-2xl bg-primary text-black font-black italic uppercase text-sm shadow-[0_8px_30px_rgb(var(--primary)/0.3)] active:scale-95 transition-transform"
              >
                <ShieldCheck className="mr-2" size={20} /> Verify Specimen
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatchUpload;
