import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, X, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { checkAchievementsAfterCatch } from "@/utils/achievementTracker";
import AchievementNotification from "@/components/AchievementNotification";

interface ActiveTournament {
  id: string;
  name: string;
  species_filter: string;
}

const CatchUpload = ({ onComplete }: { onComplete: () => void }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [errorResult, setErrorResult] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<ActiveTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [userJoinedTournaments, setUserJoinedTournaments] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch active tournaments user has joined
  useEffect(() => {
    const fetchActiveTournaments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get tournaments user joined
        const { data: participantData } = await supabase
          .from('tournament_participants')
          .select('tournament_id')
          .eq('user_id', user.id);

        if (!participantData) return;
        
        const joinedIds = participantData.map(p => p.tournament_id);
        setUserJoinedTournaments(joinedIds);

        // Get active tournaments
        const now = new Date().toISOString();
        const { data: tournaments } = await supabase
          .from('tournaments')
          .select('id, name, species_filter')
          .lte('start_date', now)
          .gte('end_date', now)
          .in('id', joinedIds);

        if (tournaments) {
          setActiveTournaments(tournaments);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      }
    };

    fetchActiveTournaments();
  }, []);

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
    if (!selectedImage || isCompleted) return;
    setIsAnalyzing(true);
    setScanStatus("Establishing Secure Link...");
    setErrorResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      setScanStatus("Verifying Photo Authenticity...");
      
      // Relaxed verification: Check for EXIF data but don't be too strict
      const hasValidExif = await checkImageExif(selectedImage);
      
      // Allow photo if:
      // 1. It has valid EXIF data, OR
      // 2. It's a reasonably sized photo (likely from camera, not a tiny screenshot)
      const isReasonableSize = selectedImage.size > 100000; // > 100KB
      
      if (!hasValidExif && !isReasonableSize) {
        throw new Error("Photo verification failed! Please take a NEW photo directly with your camera app - no screenshots or downloaded images.");
      }
      
      if (!hasValidExif && isReasonableSize) {
        console.log('⚠️ Photo missing EXIF but size is reasonable, allowing through');
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
          userId: user.id
        }
      });

      if (aiError) {
        console.error('Edge function error:', aiError);
        const errorMessage = aiError.message || 'AI Analysis failed';
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error);
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
      
      // Get user location from localStorage
      const savedLocation = localStorage.getItem('userLocation');
      const userLocation = savedLocation ? JSON.parse(savedLocation) : null;
      
      const { data: catchData, error: insertError } = await supabase
        .from('catches')
        .insert([{
          user_id: user.id,
          species: data.species,
          points: data.points,
          image_url: fileName,
          image_hash: data.image_hash,
          ai_verified: true,
          location_city: userLocation?.city || null,
          location_province: userLocation?.province || 'Ontario',
          location_lat: userLocation?.lat || null,
          location_lon: userLocation?.lon || null,
          location_name: userLocation ? `${userLocation.city}, ${userLocation.province}` : 'Ontario'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save catch: ${insertError.message}`);
      }

      // If tournament selected, submit to tournament
      if (selectedTournament && catchData) {
        setScanStatus("Submitting to Tournament...");
        
        const { error: tournamentError } = await supabase
          .from('tournament_catches')
          .insert({
            tournament_id: selectedTournament,
            user_id: user.id,
            catch_id: catchData.id,
            size_score: data.points // Use AI points as size score for now
          });

        if (tournamentError) {
          console.error('Tournament submission error:', tournamentError);
          // Don't fail the whole upload, just notify
          toast({
            title: "Tournament Submission Failed",
            description: "Your catch was saved but couldn't be submitted to the tournament.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Submitted to Tournament! 🏆",
            description: "Your catch is pending review."
          });
        }
      }

      // ✅ CHECK AND UNLOCK ACHIEVEMENTS
      setScanStatus("Checking Achievements...");
      const newAchievements = await checkAchievementsAfterCatch(user.id);
      if (newAchievements && newAchievements.length > 0) {
        setUnlockedAchievements(newAchievements);
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
    setSelectedTournament(null);
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
                {selectedTournament && (
                  <Badge className="bg-black/20 text-black border-none font-black text-xs px-3 py-1 mt-2">
                    <Trophy size={12} className="mr-1" /> TOURNAMENT ENTRY
                  </Badge>
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

          {/* Tournament Selection (only show if there are active tournaments and no result yet) */}
          {!aiResult && !errorResult && activeTournaments.length > 0 && (
            <div className="bg-muted/30 rounded-2xl p-4 border border-muted">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-primary" />
                <p className="text-xs font-black uppercase text-primary">Submit to Tournament</p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedTournament(null)}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-colors ${
                    selectedTournament === null 
                      ? 'bg-primary text-black' 
                      : 'bg-muted hover:bg-muted/70'
                  }`}
                >
                  Regular Post (No Tournament)
                </button>
                {activeTournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => setSelectedTournament(tournament.id)}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-colors ${
                      selectedTournament === tournament.id 
                        ? 'bg-primary text-black' 
                        : 'bg-muted hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tournament.name}</span>
                      {selectedTournament === tournament.id && (
                        <CheckCircle2 size={14} />
                      )}
                    </div>
                    <p className="text-[10px] opacity-70 mt-1">
                      {tournament.species_filter} only
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

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

      {/* Achievement Notifications */}
      {unlockedAchievements.map((achievement, index) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onClose={() => {
            setUnlockedAchievements(prev => prev.filter(a => a.id !== achievement.id));
          }}
        />
      ))}
    </div>
  );
};

export default CatchUpload;
