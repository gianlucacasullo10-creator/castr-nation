import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Camera, RefreshCw, Check, X, Loader2 } from "lucide-react";

const CapturePage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCatch = async () => {
    if (!image) return;
    
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to save catches");

      // For now, we save a placeholder. 
      // To do real AI, we'd send this image to a Supabase Edge Function next.
      const { error } = await supabase.from('catches').insert([{
        user_id: user.id,
        species: "Pending Analysis...",
        weight: "Calculating...",
        photo_url: image, // In production, upload this to Supabase Storage first
        caught_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast({ title: "Catch Recorded!", description: "Your fish has been saved to your profile." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-container bg-black">
      <AppHeader title="Identify Catch" className="text-white border-white/10" />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleCapture} 
        />

        {!image ? (
          <div className="text-center space-y-6">
            <div className="w-64 h-64 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mx-auto">
              <Camera className="w-20 h-20 text-white/20" />
            </div>
            <div className="space-y-2">
              <h2 className="text-white text-xl font-bold">Ready to Scan?</h2>
              <p className="text-gray-400 text-sm max-w-[250px] mx-auto">
                Position the fish clearly in the frame for the best AI identification.
              </p>
            </div>
            <Button 
              size="lg" 
              className="w-full rounded-full py-8 text-lg" 
              onClick={() => fileInputRef.current?.click()}
            >
              Open Camera
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted">
              <img src={image} alt="Captured fish" className="w-full h-full object-cover" />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full"
                onClick={() => setImage(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="rounded-full py-6" onClick={() => fileInputRef.current?.click()}>
                <RefreshCw className="mr-2 w-4 h-4" /> Retake
              </Button>
              <Button className="rounded-full py-6" onClick={uploadCatch} disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 w-4 h-4" /> Analyze</>}
              </Button>
            </div>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default CapturePage;
