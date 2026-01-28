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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black italic uppercase text-primary">New Catch</h2>
        <button onClick={onComplete} className="text-white/50"><X size={24} /></button>
      </div>

      {!previewUrl ? (
        <label className="flex-1 border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center cursor-pointer">
          <Camera size={40} className="text-primary mb-2" />
          <p className="text-white font-bold uppercase text-xs">Upload Photo</p>
          <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          <div className="relative aspect-square rounded-[40px] overflow-hidden border-2 border-primary/30">
            <img src={previewUrl} className="w-full h-full object-cover" />
            {isAnalyzing && !aiResult && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary mb-2" />
                <p className="text-primary font-bold text-xs uppercase">{scanStatus}</p>
              </div>
            )}
            {aiResult && (
              <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6">
                <CheckCircle2 size={48} className="mb-2" />
                <h3 className="text-3xl font-black italic uppercase">{aiResult.species}</h3>
                <p className="text-xl font-bold">+{aiResult.points} PTS</p>
              </div>
            )}
          </div>

          {!isAnalyzing && (
            <Button 
              onClick={() => {
                alert("Triggering AI...");
                startAIAuthentication().catch(e => alert(e.message));
              }}
              className="w-full h-16 rounded-3xl bg-primary text-black font-black italic uppercase shadow-lg"
            >
              <ShieldCheck className="mr-2" /> Verify and Submit
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CatchUpload;
