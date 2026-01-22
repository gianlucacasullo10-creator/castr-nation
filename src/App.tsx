import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import BottomNav from "./components/BottomNav";
import Index from "./pages/Index";
import Capture from "./pages/Capture";
import Leaderboards from "./pages/Leaderboards";
import Profile from "./pages/Profile";
import Clubs from "./pages/Clubs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { toast } = useToast();

  useEffect(() => {
    // REAL-TIME NOTIFICATIONS ENGINE
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes', 
        },
        (payload) => {
          toast({
            title: "🔥 SOMEONE LIKED YOUR TROPHY",
            description: "Your catch is gaining heat on the feed!",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background pb-20">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/capture" element={<Capture />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
