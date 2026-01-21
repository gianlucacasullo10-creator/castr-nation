import { Home, Trophy, Camera, Users, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BottomNav = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-2 py-2 flex justify-between items-center z-50 max-w-md mx-auto">
      <Link to="/" className={`flex flex-col items-center flex-1 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Home size={20} />
        <span className="text-[10px] mt-1">Home</span>
      </Link>
      
      <Link to="/leaderboards" className={`flex flex-col items-center flex-1 ${isActive('/leaderboards') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Trophy size={20} />
        <span className="text-[10px] mt-1">Ranks</span>
      </Link>

      <div className="flex-1 flex justify-center -mt-8">
        <Link to="/capture" className="bg-primary text-white p-3 rounded-full shadow-lg border-4 border-background">
          <Camera size={24} />
        </Link>
      </div>

      <Link to="/clubs" className={`flex flex-col items-center flex-1 ${isActive('/clubs') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Users size={20} />
        <span className="text-[10px] mt-1">Clubs</span>
      </Link>

      <Link to={isLoggedIn ? "/profile" : "/auth"} className={`flex flex-col items-center flex-1 ${isActive('/profile') || isActive('/auth') ? 'text-primary' : 'text-muted-foreground'}`}>
        <User size={20} />
        <span className="text-[10px] mt-1">{isLoggedIn ? "Profile" : "Login"}</span>
      </Link>
    </nav>
  );
};
