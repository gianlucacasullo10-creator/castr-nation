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
      
      // Detailed logging for debugging
      console.log("Invoking verify-catch function...");
      
      const { data, error: aiError } = await supabase.functions.invoke('verify-catch', {
        body: { image: base64Image }
      });

      if (aiError) {
        console.error("AI Function Error Details:", aiError);
        throw new Error(`Edge Function Error: ${aiError.message || 'Check deployment'}`);
      }

      setScanStatus("Finalizing Records...");
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('catch_photos').upload(fileName, selectedImage);
      
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('catches').insert([{
        user_id: user.id,
        species: data.species,
        points: data.points,
        length_inches: data.length,
        image_url: fileName,
        ai_verified: true,
        location_name: "St. Catharines" // Placeholder based on your profile
      }]);

      if (dbError) throw dbError;

      setAiResult(data);
      toast({ title: "CASTRS Verified!" });
      setTimeout(() => onComplete(), 3000);

    } catch (error: any) {
      console.error("Upload process failed:", error);
      alert(error.message);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black shrink-0">
        <h2 className="text-xl font-black italic uppercase text-primary tracking-tighter">New Catch</h2>
        <button onClick={onComplete} className="p-2 text-white/50"><X size={24} /></button>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto w-full max-w-md mx-auto">
        <div className="p-6 space-y-6">
          {!previewUrl ? (
            <label className="w-full aspect-square border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center cursor-pointer bg-white/5">
              <Camera size={40} className="text-primary mb-2" />
              <p className="text-white font-black uppercase text-[10px] tracking-widest">Capture Trophy</p>
              <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} capture="environment" />
            </label>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              {/* IMAGE CONTAINER - Fixed width to prevent "explosion" */}
              <div className="relative w-full aspect-square rounded-[32px] overflow-hidden border-2 border-primary/30 bg-muted">
                <img 
                  src={previewUrl} 
                  className="w-full h-full object-cover" 
                  alt="Catch Preview" 
                />
                
                {isAnalyzing && !aiResult && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                    <Loader2 className="animate-spin text-primary mb-4" size={32} />
                    <p className="text-primary font-black italic uppercase text-xs tracking-widest animate-pulse">
                      {scanStatus}
                    </p>
                  </div>
                )}

                {aiResult && (
                  <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6 animate-in zoom-in">
                    <CheckCircle2 size={48} className="mb-2" />
                    <h3 className="text-3xl font-black italic uppercase leading-none">{aiResult.species}</h3>
                    <p className="text-xl font-black mt-2">+{aiResult.points} PTS</p>
                  </div>
                )}
              </div>

              {!isAnalyzing && !aiResult && (
                <Button 
                  onClick={startAIAuthentication}
                  className="w-full h-16 rounded-[24px] bg-primary text-black font-black italic uppercase text-lg shadow-[0_10px_20px_rgba(204,255,0,0.3)]"
                >
                  <ShieldCheck className="mr-2" /> Verify and Submit
                </Button>
              )}
            </div>
          )}
          {/* Spacer for bottom safety area */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
};

export default CatchUpload;
