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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background pb-20"> {/* pb-20 prevents content from hiding behind nav */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
          <BottomNav /> {/* This must be OUTSIDE <Routes> to show on every page */}
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
