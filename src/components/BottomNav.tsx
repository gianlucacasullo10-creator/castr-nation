import { Home, Trophy, Camera, Users, User, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BottomNav = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Initial check
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    checkUser();

    // 2. Real-time listener for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-1 py-2 flex justify-around items-center z-50 max-w-screen-xl mx-auto">
      <Link to="/" className={`flex flex-col items-center flex-1 transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Home size={20} />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </Link>
      
      <Link to="/leaderboards" className={`flex flex-col items-center flex-1 transition-colors ${isActive('/leaderboards') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Trophy size={20} />
        <span className="text-[10px] mt-1 font-medium">Ranks</span>
      </Link>

      <div className="flex-1 flex justify-center -mt-8">
        <Link to="/capture" className="bg-primary text-white p-3 rounded-full shadow-lg border-4 border-background hover:scale-105 active:scale-95 transition-all">
          <Camera size={24} />
        </Link>
      </div>

      <Link to="/clubs" className={`flex flex-col items-center flex-1 transition-colors ${isActive('/clubs') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Users size={20} />
        <span className="text-[10px] mt-1 font-medium">Clubs</span>
      </Link>

      {/* Logic: If null (loading), show nothing. If logged in, show Profile. If not, show Login. */}
      {isLoggedIn !== null && (
        <Link 
          to={isLoggedIn ? "/profile" : "/auth"} 
          className={`flex flex-col items-center flex-1 transition-colors ${(isActive('/profile') || isActive('/auth')) ? 'text-primary' : 'text-muted-foreground'}`}
        >
          {isLoggedIn ? <User size={20} /> : <LogIn size={20} />}
          <span className="text-[10px] mt-1 font-medium">{isLoggedIn ? "Profile" : "Login"}</span>
        </Link>
      )}
    </nav>
  );
};
