import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Index from "./pages/Index";
import Leaderboards from "./pages/Leaderboards";
import Capture from "./pages/Capture";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Clubs from "./pages/Clubs"; // <--- MAKE SURE THIS IS HERE

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

useEffect(() => {
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'likes', // Assuming you have a likes table
      },
      (payload) => {
        // We'd check if the liked post belongs to the current user
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
}, []);

export default App;
