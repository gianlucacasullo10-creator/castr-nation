import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, X, Zap, ShieldCheck, Scale, Loader2, CheckCircle2 } from "lucide-react";

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
    console.log("🚀 AI AUTHENTICATION INITIATED");
    
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setScanStatus("Establishing Secure Link...");

    try {
      // 1. Get User Session
      console.log("Step 1: Fetching User...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Authentication required. Please log in.");

      // 2. Convert Image to Base64
      setScanStatus("Encoding Data for Audit...");
      console.log("Step 2: Encoding Base64...");
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result?.toString().split(',')[1];
          if (result) resolve(result);
          else reject(new Error("Image encoding failed."));
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(selectedImage);
      });

      // 3. Call Supabase Edge Function
      setScanStatus("AI Analyzing Species & Scale...");
      console.log("Step 3: Invoking verify-catch...");
      const { data, error: aiError } = await supabase.functions.invoke('verify-catch', {
        body: { image: base64Image }
      });

      if (aiError) {
        console.error("AI Error:", aiError);
        throw new Error("AI Judge is busy. Try again in 10 seconds.");
      }

      setScanStatus("Finalizing Audit Records...");

      // 4. Upload to Storage
      console.log("Step 4: Storage Upload...");
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('catch_photos')
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      // 5. Save to Database
      console.log("Step 5: Database Entry...");
      const { error: dbError } = await supabase.from('catches').insert([{
        user_id: user.id,
        species: data.species,
        points: data.points,
        length_inches: data.length,
        image_url: fileName,
        location_name: "CASTRS Verified",
        ai_verified: true,
        species_multiplier: data.multiplier
      }]);

      if (dbError) throw dbError;

      // SUCCESS
      console.log("✅ Audit Successful!");
      setAiResult(data);
      toast({ title: "AUTHENTICATED", description: `${data.species} verified successfully.` });
      
      setTimeout(() => onComplete(), 3000);

    } catch (error: any) {
      console.error("Critical Catch Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Audit Failed", 
        description: error.message 
      });
      setIsAnalyzing(false);
      // Extra alert for when console isn't visible
      alert("Function Error: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black italic uppercase text-primary leading-none">AI Audit</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Verification Phase</p>
        </div>
        <button onClick={onComplete} className="p-2 text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {!previewUrl ? (
        <label className="flex-1 border-2 border-dashed border-primary/20 rounded-[40px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/5 transition-all group">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera size={32} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="font-black uppercase text-sm tracking-tighter text-white">Capture Catch</p>
            <p className="text-[10px] font-bold text-white/40 uppercase">Include hand or rod for scale</p>
          </div>
          <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          <div className="relative w-full aspect-square rounded-[40px] overflow-hidden border-2 border-primary/30 shadow-2xl">
            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
            
            {isAnalyzing && !aiResult && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-transparent h-20 w-full animate-scan-slow shadow-[0_0_20px_#ccff00]" />
                <Loader2 className="animate-spin text-primary mb-2" size={32} />
                <p className="font-black italic uppercase text-xs tracking-tighter text-primary bg-black/60 px-4 py-1 rounded-full">
                  {scanStatus}
                </p>
              </div>
            )}

            {aiResult && (
              <div className="absolute inset-0 bg-primary/90 flex flex-col items-center justify-center text-black p-6 animate-in zoom-in-95 duration-300">
                <CheckCircle2 size={64} className="mb-4" />
                <h3 className="text-4xl font-black italic uppercase leading-none text-center">{aiResult.species}</h3>
                <div className="flex gap-8 mt-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase opacity-60">Length</p>
                    <p className="text-3xl font-black italic">{aiResult.length}"</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase opacity-60">Points</p>
                    <p className="text-3xl font-black italic">+{aiResult.points}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isAnalyzing && (
            <Button 
              onClick={() => {
                console.log("Button clicked!");
                alert("Triggering AI Audit...");
                startAIAuthentication().catch(e => alert("Crash: " + e.message));
              }}
              className="w-full h-20 rounded-[30px] bg-primary text-black font-black italic uppercase text-xl shadow-[0_0_40px_rgba(204,255,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ShieldCheck className="mr-3" size={24} /> Verify and Submit
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CatchUpload;
