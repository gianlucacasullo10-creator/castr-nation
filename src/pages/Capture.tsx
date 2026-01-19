import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Camera, Upload, Image, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const CapturePage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    species: string;
    estimatedWeight: string;
    estimatedLength: string;
    confidence: number;
    points: number;
    isValid: boolean;
  } | null>(null);

  const handleImageSelect = () => {
    // Simulate image selection
    setSelectedImage("/placeholder.svg");
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        species: "Largemouth Bass",
        estimatedWeight: "~4.2 lbs",
        estimatedLength: "~18 inches",
        confidence: 94,
        points: 145,
        isValid: true,
      });
    }, 2000);
  };

  const resetCapture = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="app-container bg-background">
      <AppHeader title="Capture" showLogo={false} showNotifications={false} />
      
      <main className="flex-1 safe-bottom flex flex-col">
        <div className="flex-1 p-4 flex flex-col">
          {!selectedImage ? (
            // Initial capture options
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center mb-4">
                <h2 className="font-bold text-xl mb-2">Log Your Catch</h2>
                <p className="text-muted-foreground text-sm">
                  Take a photo or upload one to get AI verification
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <button
                  onClick={handleImageSelect}
                  className="aspect-square bg-card rounded-2xl shadow-card flex flex-col items-center justify-center gap-3 hover:bg-muted transition-colors"
                >
                  <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                    <Camera className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <span className="font-medium text-sm">Take Photo</span>
                </button>
                
                <button
                  onClick={handleImageSelect}
                  className="aspect-square bg-card rounded-2xl shadow-card flex flex-col items-center justify-center gap-3 hover:bg-muted transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <span className="font-medium text-sm">Upload</span>
                </button>
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-xl max-w-sm">
                <h3 className="font-semibold text-sm mb-2">AI Verification</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Detects fish species automatically</li>
                  <li>• Estimates size and weight</li>
                  <li>• Validates authenticity of catch</li>
                  <li>• Awards points based on value</li>
                </ul>
              </div>
            </div>
          ) : (
            // Image analysis view
            <div className="flex-1 flex flex-col">
              {/* Image Preview */}
              <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden mb-4">
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-16 h-16 text-muted-foreground/50" />
                </div>
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-medium">Analyzing your catch...</p>
                  </div>
                )}
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="animate-slide-up">
                  <div className={`p-4 rounded-xl mb-4 ${
                    analysisResult.isValid 
                      ? "bg-success/10 border border-success/30" 
                      : "bg-destructive/10 border border-destructive/30"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {analysisResult.isValid ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span className="font-semibold text-success">Verified Catch!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-destructive" />
                          <span className="font-semibold text-destructive">Could not verify</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.confidence}% confidence
                    </p>
                  </div>

                  <div className="bg-card rounded-xl shadow-card p-4 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Species</p>
                      <p className="font-bold text-lg">{analysisResult.species}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Weight</p>
                        <p className="font-semibold">{analysisResult.estimatedWeight}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Length</p>
                        <p className="font-semibold">{analysisResult.estimatedLength}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fish Points</span>
                        <span className="fish-points text-base">
                          +{analysisResult.points} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={resetCapture}
                      className="flex-1 py-3 bg-muted rounded-xl font-medium hover:bg-muted/80 transition-colors"
                    >
                      Retake
                    </button>
                    <button className="flex-1 py-3 gradient-primary text-primary-foreground rounded-xl font-medium">
                      Post Catch
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default CapturePage;
