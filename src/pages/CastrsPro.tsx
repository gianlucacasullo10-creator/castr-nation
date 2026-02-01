import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Crown, 
  Zap, 
  Gift, 
  Sparkles, 
  TrendingUp,
  CheckCircle2,
  X
} from "lucide-react";

const CastrsPro = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setIsProcessing(true);
    
    // TODO: Connect to payment platform (RevenueCat, Stripe, etc.)
    // For now, just show a placeholder
    
    setTimeout(() => {
      toast({
        title: "Coming Soon!",
        description: "CASTRS Pro subscriptions will be available soon. Stay tuned!",
      });
      setIsProcessing(false);
    }, 1000);
  };

  const proFeatures = [
    {
      icon: <Zap className="text-yellow-500" size={24} />,
      title: "No Ads",
      description: "Clean, uninterrupted fishing experience"
    },
    {
      icon: <TrendingUp className="text-green-500" size={24} />,
      title: "2x Case Odds",
      description: "Double your chances for legendary gear"
    },
    {
      icon: <Gift className="text-purple-500" size={24} />,
      title: "Weekly Legendary Drop",
      description: "Guaranteed legendary item every week"
    },
    {
      icon: <Crown className="text-yellow-500" size={24} />,
      title: "Pro Badge",
      description: "Exclusive ⭐ badge on your profile"
    },
    {
      icon: <Sparkles className="text-cyan-500" size={24} />,
      title: "Custom Themes",
      description: "Personalize your profile colors"
    },
    {
      icon: <CheckCircle2 className="text-primary" size={24} />,
      title: "500 Bonus Points/Month",
      description: "Free points credited monthly"
    },
  ];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase">
          CASTRS Pro
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <X size={24} />
        </Button>
      </div>

      {/* Hero Card */}
      <Card className="relative overflow-hidden border-none rounded-[32px] bg-gradient-to-br from-yellow-500/20 via-primary/20 to-purple-500/20 p-8 border-2 border-primary/30">
        <div className="absolute top-0 right-0 opacity-10">
          <Crown size={200} />
        </div>
        
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-black/20 px-6 py-2 rounded-full">
            <Crown className="text-yellow-500" size={20} />
            <span className="text-sm font-black uppercase text-white">Premium Membership</span>
          </div>
          
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">
            Level Up Your Game
          </h2>
          
          <p className="text-foreground/80 font-medium">
            Get exclusive perks, better odds, and premium features
          </p>

          <div className="pt-4">
            <div className="text-5xl font-black text-primary mb-2">$4.99</div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Per Month
            </div>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase text-muted-foreground px-2">
          Pro Features
        </h3>
        
        {proFeatures.map((feature, index) => (
          <Card 
            key={index}
            className="p-4 rounded-2xl border-2 border-muted hover:border-primary/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 bg-muted/50 p-3 rounded-xl">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black uppercase mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison */}
      <Card className="p-6 rounded-[32px] border-2 border-muted space-y-4">
        <h3 className="text-sm font-black uppercase text-center mb-4">
          Free vs Pro
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Free</p>
            <div className="space-y-2">
              <div className="text-xs">Standard odds</div>
              <div className="text-xs">With ads</div>
              <div className="text-xs">No bonuses</div>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">Pro ⭐</p>
            <div className="space-y-2">
              <div className="text-xs font-black">2x better odds</div>
              <div className="text-xs font-black">Ad-free</div>
              <div className="text-xs font-black">500 pts/month</div>
            </div>
          </div>
        </div>
      </Card>

      {/* CTA Buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-500 to-primary hover:from-yellow-600 hover:to-primary/90 text-black font-black uppercase text-sm shadow-[0_8px_30px_rgba(34,211,238,0.4)]"
        >
          {isProcessing ? (
            "Processing..."
          ) : (
            <>
              <Crown className="mr-2" size={20} />
              Upgrade to Pro
            </>
          )}
        </Button>

        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="w-full h-12 rounded-2xl font-bold uppercase text-xs"
        >
          Maybe Later
        </Button>
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-muted-foreground pt-4">
        Cancel anytime. All core features remain free forever.
      </p>
    </div>
  );
};

export default CastrsPro;
