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
                
                // Look for DateTimeOriginal tag (more thorough check)
                // This is much harder to fake than just having EXIF
                for (let i = offset; i < offset + Math.min(exifLength, 2000); i++) {
                  try {
                    // Check for common camera metadata tags
                    const tag = view.getUint16(i, false);
                    // DateTimeOriginal = 0x9003, Make = 0x010F, Model = 0x0110
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
        
        // Require both EXIF and camera metadata tags
        resolve(hasExif && hasDateTaken);
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  };

  const startAIAuthentication = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setScanStatus("Establishing Secure Link...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      // Check EXIF data before uploading
      setScanStatus("Verifying Photo Authenticity...");
      const hasValidExif = await checkImageExif(selectedImage);
      
      if (!hasValidExif) {
        throw new Error("This photo doesn't appear to be an original camera photo. Please take a fresh photo with your phone camera.");
      }

      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      setScanStatus("AI Analyzing Species...");
      const { data, error: aiError } = await supabase.functions.invoke('clever-endpoint', {
        body: { image: base64Image }
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
        ai_verified: true
      }]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save catch: ${insertError.message}`);
      }

      setAiResult(data);
      toast({ title: "CASTRS Verified!" });
      setTimeout(() => onComplete(), 3000);

    } catch (error: any) {
      console.error('Full error:', error);
      
      // Show error message in the scan status overlay for longer
      setScanStatus("⚠️ " + error.message);
      
      toast({ 
        variant: "destructive", 
        title: "Verification Failed", 
        description: error.message || "Something went wrong",
        duration: 5000, // Show toast for 5 seconds
      });
      
      // Keep the error message visible for 4 seconds before allowing retry
      setTimeout(() => {
        setIsAnalyzing(false);
        setScanStatus("");
      }, 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col p-5 animate-in fade-in sm:max-w-md sm:mx-auto sm:right-0 sm:left-0">
      
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
