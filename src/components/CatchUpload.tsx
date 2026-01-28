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
      alert("Error: " + error.message);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in">
      {/* FIXED HEADER: Always stays at the top */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black shrink-0">
        <h2 className="text-2xl font-black italic uppercase text-primary">New Catch</h2>
        <button onClick={onComplete} className="p-2 text-white/50 hover:text-white transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* SCROLLABLE BODY: This allows the iPhone to scroll the content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!previewUrl ? (
          <label className="w-full aspect-square border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
            <Camera size={48} className="text-primary mb-4" />
            <div className="text-center">
              <p className="text-white font-black uppercase text-sm tracking-tighter">Capture Catch</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Include rod or hand for scale</p>
            </div>
            <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="relative aspect-square rounded-[40px] overflow-hidden border-2 border-primary/30 shadow-2xl">
              <img src={previewUrl} className="w-full h-full object-cover" alt="Catch Preview" />
              
              {/* Analysis Overlay */}
              {isAnalyzing && !aiResult && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                  <Loader2 className="animate-spin text-primary mb-4" size={40} />
                  <p className="text-primary font-black italic uppercase text-sm tracking-widest animate-pulse">
                    {scanStatus}
                  </p>
                </div>
              )}

              {/* Result Overlay */}
              {aiResult && (
                <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6 animate-in zoom-in-95 duration-300">
                  <CheckCircle2 size={64} className="mb-4" />
                  <h3 className="text-4xl font-black italic uppercase leading-none text-center">
                    {aiResult.species}
                  </h3>
                  <div className="flex gap-8 mt-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase opacity-60">Points</p>
                      <p className="text-3xl font-black italic">+{aiResult.points}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isAnalyzing && !aiResult && (
              <Button 
                onClick={() => {
                  startAIAuthentication();
                }}
                className="w-full h-20 rounded-[30px] bg-primary text-black font-black italic uppercase text-xl shadow-[0_10px_30px_rgba(204,255,0,0.3)] active:scale-95 transition-all mb-10"
              >
                <ShieldCheck className="mr-3" size={24} /> Verify and Submit
              </Button>
            )}

            {aiResult && (
              <Button 
                onClick={onComplete}
                className="w-full h-20 rounded-[30px] bg-white text-black font-black italic uppercase text-xl mb-10"
              >
                Back to Feed
              </Button>
            )}
          </div>
        )}
        
        {/* Extra spacer for the bottom of the screen */}
        <div className="h-12 w-full" />
      </div>
    </div>
  );
};

export default CatchUpload;
