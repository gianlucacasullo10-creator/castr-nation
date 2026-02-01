import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Enter email and password", variant: "destructive" });
      return;
    }
    
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Check your email for the confirmation link." });
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Enter email and password", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Stacked Logo */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <div className="flex flex-col items-center justify-center bg-primary rounded-3xl px-8 py-6 shadow-2xl">
              <span className="text-4xl font-black italic tracking-tighter text-black leading-none">CA</span>
              <span className="text-4xl font-black italic tracking-tighter text-black leading-none">ST</span>
              <span className="text-4xl font-black italic tracking-tighter text-black leading-none">RS</span>
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-4">
            Social Fishing Network
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-xl">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <Input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="h-12 rounded-2xl border-2 border-muted focus:border-primary font-medium"
              required 
              disabled={loading}
            />
            <Input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="h-12 rounded-2xl border-2 border-muted focus:border-primary font-medium"
              required 
              disabled={loading}
            />
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-sm shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail("");
                  setPassword("");
                }}
                disabled={loading}
                className="text-sm font-bold text-primary hover:underline disabled:opacity-50"
              >
                {isSignUp 
                  ? "Already have an account? Sign In" 
                  : "Don't have an account? Sign Up"
                }
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Auth;
