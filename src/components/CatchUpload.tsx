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

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Return base64 without the prefix
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
    
    try {
      // 1. Check Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      // 2. Compress for Gemini
      setScanStatus("AI Analyzing Species...");
      const base64Image = await compressImage(selectedImage);

      // 3. Call Edge Function (Ensure this matches your Supabase Function slug)
      const { data, error: aiError } = await supabase.functions.invoke('clever-endpoint', {
        body: { image: base64Image }
      });

      if (aiError) throw new Error(`AI Offline: ${aiError.message}`);
      if (!data || data.error) throw new Error(data?.error || "AI could not identify fish.");

      // 4. Upload Original to Storage
      setScanStatus("Finalizing Audit...");
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('catch_photos')
        .upload(fileName, selectedImage);

      if (uploadError) throw new Error("Photo upload failed.");

      // 5. Get the Public URL for the Feed
      const { data: { publicUrl } } = supabase.storage
        .from('catch_photos')
        .getPublicUrl(fileName);

      // 6. Save to Database
      setScanStatus("Logging Result...");
      const { error: dbError } = await supabase.from('catches').insert([{
        user_id: user.id,
        species: data.species,
        points: data.points,
        length_inches: data.length,
        image_url: publicUrl, // Using full URL so index.tsx can display it
        ai_verified: true,
        location_name: "St. Catharines"
      }]);

      if (dbError) throw new Error("Database log failed.");

      // Success!
      setAiResult(data);
      toast({ title: "Verification Successful", description: `${data.species} identified!` });
      setTimeout(() => onComplete(), 2500);

    } catch (error: any) {
      console.error("Critical Upload Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Audit Failed", 
        description: error.message 
      });
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
          <label className="w-[85vw] max-w-xs aspect-square border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
            <Camera size={40} className="text-primary mb-2" />
            <p className="text-white font-black uppercase text-[10px] tracking-widest text-center px-4">Tap to upload fish photo</p>
            <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} capture="environment" />
          </label>
        ) : (
          <div className="flex flex-col items-center w-full gap-8">
            <div className="relative w-[85vw] max-w-xs aspect-square rounded-[32px] overflow-hidden border-2 border-primary/30 shadow-2xl bg-zinc-900">
              <img src={previewUrl} className="w-full h-full object-cover" alt="Fish Preview" />
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                  <Loader2 className="animate-spin text-primary mb-4" size={40} />
                  <p className="text-primary font-black italic uppercase text-xs tracking-widest animate-pulse">{scanStatus}</p>
                </div>
              )}

              {aiResult && (
                <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6 animate-in zoom-in">
                  <CheckCircle2 size={54} className="mb-4" />
                  <h3 className="text-3xl font-black italic uppercase text-center">{aiResult.species}</h3>
                  <p className="text-2xl font-black mt-3 italic">+{aiResult.points} PTS</p>
                </div>
              )}
            </div>

            {!isAnalyzing && !aiResult && (
              <div className="flex flex-col w-full gap-3 items-center">
                <Button onClick={startAIAuthentication} className="w-[85vw] max-w-xs h-16 rounded-[24px] bg-primary text-black font-black italic uppercase text-lg shadow-lg hover:bg-primary/90">
                  <ShieldCheck className="mr-2" /> Verify and Submit
                </Button>
                <button onClick={() => {setPreviewUrl(null); setSelectedImage(null);}} className="text-white/40 uppercase text-[10px] font-black tracking-widest">Retake Photo</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatchUpload;
