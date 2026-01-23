import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
// Using dynamic imports or ensuring paths match your file tree
import Feed from "../components/Feed"; 
import CreatePost from "../components/CreatePost";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogIn, 
  LayoutDashboard, 
  PlusCircle, 
  Trophy, 
  Search,
  Zap
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCreatePostClick = () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to post your catch!",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setShowCreatePost(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="pt-8 px-6 flex justify-between items-center sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/5 pb-4">
        <div className="text-left">
          <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
            Castr
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Zap size={10} className="text-primary fill-primary" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Pike Agartha Phase I
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!session ? (
            <Button 
              onClick={() => navigate("/auth")}
              className="rounded-full bg-primary text-black font-black italic uppercase text-[10px] px-5 h-9 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105 transition-all"
            >
              <LogIn size={14} className="mr-2" /> Join
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => navigate("/profile")}
              className="rounded-full border-primary/20 text-primary font-black italic uppercase text-[10px] px-5 h-9"
            >
              <LayoutDashboard size={14} className="mr-2" /> Hub
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        <Tabs defaultValue="all" className="w-full mb-6" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-muted/50 rounded-2xl p-1 border border-white/5">
              <TabsTrigger value="all" className="rounded-xl font-black italic uppercase text-[10px] px-4">Global</TabsTrigger>
              <TabsTrigger value="following" className="rounded-xl font-black italic uppercase text-[10px] px-4">Regional</TabsTrigger>
            </TabsList>
            
            <Button 
              onClick={handleCreatePostClick}
              size="icon" 
              className="rounded-2xl bg-primary text-black shadow-lg shadow-primary/20 h-10 w-10"
            >
              <PlusCircle size={20} />
            </Button>
          </div>

          <TabsContent value="all" className="mt-0">
            <Feed filter="all" />
          </TabsContent>
          <TabsContent value="following" className="mt-0">
             {!session ? (
               <Card className="p-12 border-dashed border-2 border-muted bg-transparent text-center rounded-[32px] overflow-hidden">
                 <Search className="mx-auto mb-4 text-muted-foreground opacity-20" size={40} />
                 <p className="font-black italic uppercase text-xs text-muted-foreground mb-4">Regional feed is for members only</p>
                 <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-xl font-black italic uppercase text-[10px]">
                   Sign In to View
                 </Button>
               </Card>
             ) : (
               <Feed filter="regional" />
             )}
          </TabsContent>
        </Tabs>
      </main>

      {showCreatePost && (
        <div className="fixed inset-0 z-[100] bg-background animate-in slide-in-from-bottom duration-300">
          <div className="p-4 flex justify-between items-center border-b">
             <h2 className="text-xl font-black italic uppercase">New Catch</h2>
             <Button variant="ghost" onClick={() => setShowCreatePost(false)} className="font-black uppercase text-xs">Close</Button>
          </div>
          <div className="p-4">
            <CreatePost onSuccess={() => setShowCreatePost(false)} />
          </div>
        </div>
      )}

      {!session && (
        <div className="fixed bottom-24 left-4 right-4 z-40">
          <div className="bg-primary p-4 rounded-[24px] shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-black rounded-full p-2">
                <Trophy size={16} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-black font-black italic uppercase text-[10px] leading-tight">Claim your Titles</p>
                <p className="text-black/60 font-bold text-[8px] uppercase">Join Pike Agartha Today</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/auth")}
              size="sm" 
              className="bg-black text-primary rounded-xl font-black italic uppercase text-[9px] h-8 px-4"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
