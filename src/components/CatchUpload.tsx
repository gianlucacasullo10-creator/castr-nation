import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // NEW: Shinks the image so it doesn't "Fail to send"
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Perfect for AI analysis
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Returns a small Base64 string
          resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        };
      };
    });
  };

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
    setScanStatus("Compressing for AI...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      const base64Image = await compressImage(selectedImage);

      setScanStatus("AI Analyzing Species...");
      
      // FIXED: Calling 'clever-endpoint' because that is the Slug in your screenshot!
      const { data, error: aiError } = await supabase.functions.invoke('clever-endpoint', {
        body: { image: base64Image }
      });

      if (aiError) throw new Error(aiError.message);

      setScanStatus("Saving to Leaderboard...");
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
      setTimeout(() => onComplete(), 2500);

    } catch (error: any) {
      console.error("Error:", error);
      alert(`AI Audit Failed: ${error.message}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center w-full h-full overflow-hidden touch-none">
      <div className="w-full max-w-md flex justify-between items-center p-6 border-b border-white/10 bg-black">
        <h2 className="text-xl font-black italic uppercase text-primary tracking-tighter">AI Audit</h2>
        <button onClick={onComplete} className="p-2 text-white/50"><X size={28} /></button>
      </div>

      <div className="w-full max-w-md flex-1 overflow-y-auto flex flex-col items-center p-6 space-y-8">
        {!previewUrl ? (
          <label className="w-[85vw] max-w-xs aspect-square border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center cursor-pointer bg-white/5">
            <Camera size={40} className="text-primary mb-2" />
            <p className="text-white font-black uppercase text-[10px] tracking-widest text-center px-4">Tap to upload fish photo</p>
            <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} capture="environment" />
          </label>
        ) : (
          <div className="flex flex-col items-center w-full gap-8">
            <div className="relative w-[85vw] max-w-xs aspect-square rounded-[32px] overflow-hidden border-2 border-primary/30 shadow-2xl bg-zinc-900">
              <img src={previewUrl} className="w-full h-full object-cover" alt="Fish Preview" />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                  <Loader2 className="animate-spin text-primary mb-4" size={40} />
                  <p className="text-primary font-black italic uppercase text-xs tracking-widest animate-pulse">{scanStatus}</p>
                </div>
              )}
              {aiResult && (
                <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6">
                  <CheckCircle2 size={54} className="mb-4" />
                  <h3 className="text-3xl font-black italic uppercase text-center">{aiResult.species}</h3>
                  <p className="text-2xl font-black mt-3 italic">+{aiResult.points} PTS</p>
                </div>
              )}
            </div>
            {!isAnalyzing && !aiResult && (
              <Button onClick={startAIAuthentication} className="w-[85vw] max-w-xs h-16 rounded-[24px] bg-primary text-black font-black italic uppercase text-lg shadow-lg">
                <ShieldCheck className="mr-2" /> Verify and Submit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatchUpload;
