import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { initRevenueCat } from "@/lib/revenuecat";
import { initAdMob } from "@/lib/admob";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./components/SplashScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import CatchUpload from "./components/CatchUpload";

// Lazy load all pages — only the current route's JS is downloaded on first load
const Index = lazy(() => import("./pages/Index"));
const Capture = lazy(() => import("./pages/Capture"));
const Leaderboards = lazy(() => import("./pages/Leaderboards"));
const Profile = lazy(() => import("./pages/Profile"));
const Clubs = lazy(() => import("./pages/Clubs"));
const Shop = lazy(() => import("./pages/Shop"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Auth = lazy(() => import("./pages/Auth"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Achievements = lazy(() => import("./pages/Achievements"));
const CastrsPro = lazy(() => import("./pages/CastrsPro"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const AdminReview = lazy(() => import("@/pages/AdminReview"));
const Support = lazy(() => import("./pages/Support"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

// Prefetch all page chunks in the background after initial render so subsequent
// tab navigations are instant (chunks are already in browser cache / service worker).
function prefetchPages() {
  const pages = [
    () => import("./pages/Index"),
    () => import("./pages/Leaderboards"),
    () => import("./pages/Shop"),
    () => import("./pages/Inventory"),
    () => import("./pages/Clubs"),
    () => import("./pages/Profile"),
    () => import("./pages/Achievements"),
    () => import("./pages/Capture"),
    () => import("./pages/CastrsPro"),
    () => import("./pages/Tournaments"),
    () => import("./pages/Auth"),
    () => import("./pages/PublicProfile"),
  ];
  // Stagger slightly so the initial render isn't competing for bandwidth
  pages.forEach((load, i) => setTimeout(load, i * 100));
}

const queryClient = new QueryClient();

async function checkWeeklyLegendaryDrop(accessToken: string) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/grant-weekly-legendary`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (json.granted) {
      console.log("Weekly legendary drop granted:", json.item);
    }
  } catch (err) {
    console.warn("Weekly legendary check failed:", err);
  }
}

const App = () => {
  const { toast } = useToast();
  const [globalShowUpload, setGlobalShowUpload] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem("hasSeenSplash");
  });

  const handleSplashComplete = () => {
    localStorage.setItem("hasSeenSplash", "1");
    setShowSplash(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Init RevenueCat with the authenticated user ID
          initRevenueCat(session.user.id);

          supabase
            .from("profiles")
            .select("is_pro")
            .eq("id", session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile?.is_pro && session.access_token) {
                checkWeeklyLegendaryDrop(session.access_token);
              }
            });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Kick off background prefetch of all page chunks after mount
  useEffect(() => { prefetchPages(); }, []);

  // Initialize AdMob (and trigger ATT prompt) on first app launch,
  // regardless of login state — required by App Store guidelines.
  useEffect(() => { initAdMob(); }, []);

  // Handle deep links for OAuth callbacks (e.g. Google sign-in on native)
  useEffect(() => {
    CapApp.addListener("appUrlOpen", async ({ url }) => {
      if (!url.startsWith("com.castrs.app://login-callback")) return;
      await Browser.close();

      // Implicit flow: tokens arrive in the hash fragment
      const hash = url.split("#")[1] ?? "";
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        return;
      }

      // PKCE flow: code arrives as a query param
      const query = url.split("?")[1] ?? "";
      const code = new URLSearchParams(query).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    });
  }, []);

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
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
          <div className="min-h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="page-transition">
              <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/castrs-pro" element={<CastrsPro />} />
                  <Route path="/tournaments" element={<Tournaments />} />
                  <Route path="/admin/review" element={<AdminReview />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>

            {globalShowUpload && (
              <CatchUpload
                key="catch-upload"
                onComplete={() => {
                  setGlobalShowUpload(false);
                  // Soft refresh — no WebView reload
                  window.dispatchEvent(new Event('feedRefresh'));
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
