import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, X, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const CatchUpload = ({ onComplete }: { onComplete: () => void }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [errorResult, setErrorResult] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false); // NEW: Track if we're done
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAiResult(null);
      setErrorResult(null);
    }
  };

  // Function to check EXIF data in the frontend
  const checkImageExif = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const view = new DataView(arrayBuffer);
        
        // Check for JPEG SOI marker
        if (view.getUint16(0, false) !== 0xFFD8) {
          console.log('Not a valid JPEG');
          resolve(false);
          return;
        }
        
        // Look for EXIF marker (APP1)
        let offset = 2;
        let hasExif = false;
        let hasDateTaken = false;
        
        while (offset < view.byteLength - 4) {
          const marker = view.getUint16(offset, false);
          
          if (marker === 0xFFE1) { // APP1 (EXIF) marker
            const exifLength = view.getUint16(offset + 2, false);
            
            // Check for "Exif" string
            if (offset + 10 < view.byteLength) {
              const exifString = String.fromCharCode(
                view.getUint8(offset + 4),
                view.getUint8(offset + 5),
                view.getUint8(offset + 6),
                view.getUint8(offset + 7)
              );
              
              if (exifString === 'Exif') {
                hasExif = true;
                console.log('✓ EXIF data found');
                
                for (let i = offset; i < offset + Math.min(exifLength, 2000); i++) {
                  try {
                    const tag = view.getUint16(i, false);
                    if (tag === 0x9003 || tag === 0x010F || tag === 0x0110) {
                      hasDateTaken = true;
                      console.log('✓ Camera metadata found');
                      break;
                    }
                  } catch (e) {
                    // Continue searching
                  }
                }
                
                break;
              }
            }
          }
          
          // Move to next marker
          if ((marker & 0xFF00) !== 0xFF00) break;
          offset += 2 + view.getUint16(offset + 2, false);
        }
        
        console.log('EXIF check result:', { hasExif, hasDateTaken });
        resolve(hasExif && hasDateTaken);
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  };

  const startAIAuthentication = async () => {
    if (!selectedImage || isCompleted) return; // Prevent if already completed
    setIsAnalyzing(true);
    setScanStatus("Establishing Secure Link...");
    setErrorResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      setScanStatus("Verifying Photo Authenticity...");
      const hasValidExif = await checkImageExif(selectedImage);
      
      if (!hasValidExif) {
        throw new Error("Photo verification failed! This image doesn't contain camera metadata. Please take a NEW photo directly with your camera app - no screenshots or downloaded images.");
      }

      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      setScanStatus("AI Analyzing Species...");
      const { data, error: aiError } = await supabase.functions.invoke('clever-endpoint', {
  body: { 
    image: base64Image,
    userId: user.id  // ADD THIS
  }
});

      if (aiError) {
        console.error('Edge function error:', aiError);
        throw new Error(`AI Analysis failed: ${aiError.message}`);
      }

      console.log('Edge function returned:', data);

      setScanStatus("Uploading Image...");
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('catch_photos')
        .upload(fileName, selectedImage);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

     setScanStatus("Saving Catch...");
const { error: insertError } = await supabase.from('catches').insert([{
  user_id: user.id,
  species: data.species,
  points: data.points,
  image_url: fileName,
  image_hash: data.image_hash, // ADD THIS LINE
  ai_verified: true
}]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save catch: ${insertError.message}`);
      }

      // SUCCESS - Lock the state
      console.log('SUCCESS - Showing result screen');
      setAiResult(data);
setIsAnalyzing(false);
toast({ title: "CASTRS Verified!" });

    } catch (error: any) {
      console.error('Full error:', error);
      setErrorResult(error.message || "Verification failed");
      setIsAnalyzing(false);
      setScanStatus("");
      
      toast({ 
        variant: "destructive", 
        title: "Verification Failed", 
        description: error.message || "Something went wrong",
        duration: 6000,
      });
    }
  };

  const handleTryAgain = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setErrorResult(null);
    setAiResult(null);
    setIsCompleted(false);
  };

  const handleSuccessComplete = () => {
    console.log('User clicked Continue - closing modal');
    setIsCompleted(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col p-5 animate-in fade-in sm:max-w-md sm:mx-auto sm:right-0 sm:left-0">
      
      <div className="flex justify-between items-center mb-6 pt-2">
        <h2 className="text-xl font-black italic uppercase text-primary tracking-tighter">New Catch</h2>
        {/* Don't allow closing during success */}
        {!aiResult && (
          <button onClick={onComplete} className="p-2 text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        )}
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
          
          <div className="relative aspect-square w-full rounded-[32px] overflow-hidden border border-white/10 bg-muted">
            <img src={previewUrl} className="w-full h-full object-cover" alt="Catch preview" />
            
            {isAnalyzing && !aiResult && !errorResult && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-primary mb-3" size={32} />
                <p className="text-primary font-black text-xs uppercase italic tracking-tighter">{scanStatus}</p>
              </div>
            )}

            {errorResult && (
              <div className="absolute inset-0 bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in zoom-in-95">
                <AlertCircle size={48} className="mb-4 text-red-400" />
                <h3 className="text-lg font-black italic uppercase mb-2">Verification Failed</h3>
                <p className="text-sm font-medium leading-relaxed mb-4">{errorResult}</p>
              </div>
            )}

            {aiResult && (
              <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center text-black p-6 animate-in zoom-in-95">
                <CheckCircle2 size={48} className="mb-3" />
                <h3 className="text-2xl font-black italic uppercase text-center leading-none mb-2">{aiResult.species}</h3>
                {aiResult.estimated_weight > 0 && (
                  <p className="text-sm font-bold opacity-70 mb-3">~{aiResult.estimated_weight} lbs</p>
                )}
                <p className="text-4xl font-black uppercase tracking-tighter mb-2">+{aiResult.points} PTS</p>
                {aiResult.quality_multiplier > 1.3 && (
                  <Badge className="bg-black/20 text-black border-none font-black text-xs px-3 py-1 mb-2">
                    🔥 {aiResult.quality_multiplier}× TROPHY
                  </Badge>
                )}
                {aiResult.quality_multiplier >= 1.8 && (
                  <p className="text-xs font-black uppercase mt-1 opacity-80">LEGENDARY CATCH!</p>
                )}
                
                <Button
                  onClick={handleSuccessComplete}
                  className="mt-6 bg-black text-white hover:bg-black/80 font-black uppercase text-sm px-8 h-12 rounded-2xl active:scale-95 transition-transform"
                >
                  Continue →
                </Button>
              </div>
            )}
          </div>

          <div className="mt-auto pb-4">
            {errorResult ? (
              <Button 
                onClick={handleTryAgain}
                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black italic uppercase text-sm shadow-[0_8px_30px_rgba(220,38,38,0.3)] active:scale-95 transition-transform"
              >
                <Camera className="mr-2" size={20} /> Take New Photo
              </Button>
            ) : !isAnalyzing && !aiResult && (
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
