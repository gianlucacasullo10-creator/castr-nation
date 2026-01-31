import { useEffect, useState } from "react";
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
import Shop from "./pages/Shop";
import Inventory from "./pages/Inventory";
import Auth from "./pages/Auth";
import PublicProfile from "./pages/PublicProfile"; 
import NotFound from "./pages/NotFound";
import CatchUpload from "./components/CatchUpload";
import Achievements from "./pages/Achievements";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => {
  const { toast } = useToast();
  const [globalShowUpload, setGlobalShowUpload] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'likes' },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: likedCatch } = await supabase
            .from('catches')
            .select('user_id, species')
            .eq('id', payload.new.catch_id)
            .single();

          if (likedCatch && likedCatch.user_id === user.id && payload.new.user_id !== user.id) {
            toast({
              title: "🔥 TROPHY LIKED!",
              description: `Someone liked your ${likedCatch.species}!`,
              className: "bg-red-500 text-white font-black italic border-none",
            });
          }
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/capture" element={<Capture />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<PublicProfile />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/achievements" element={<Achievements />} />
            </Routes>

            {globalShowUpload && (
              <CatchUpload 
                key={Date.now()}
                onComplete={() => {
                  setGlobalShowUpload(false);
                  // Reload to show new catch in feed
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 500);
                }} 
              />
            )}

            <BottomNav onCameraClick={() => setGlobalShowUpload(true)} />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
