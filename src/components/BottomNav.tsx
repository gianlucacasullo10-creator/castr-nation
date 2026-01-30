import { Home, Trophy, Camera, Users, User, LogIn, ShoppingBag, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BottomNav = ({ onCameraClick }: { onCameraClick?: () => void }) => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 flex justify-center pb-safe">
      <div className="w-full max-w-md flex justify-between items-center px-1 py-1 h-16">
        
        <Link to="/" className={`flex flex-col items-center justify-center flex-1 min-w-0 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Home size={18} />
          <span className="text-[9px] mt-1 truncate">Home</span>
        </Link>
        
        <Link to="/leaderboards" className={`flex flex-col items-center justify-center flex-1 min-w-0 ${isActive('/leaderboards') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Trophy size={18} />
          <span className="text-[9px] mt-1 truncate">Ranks</span>
        </Link>

        <Link to="/shop" className={`flex flex-col items-center justify-center flex-1 min-w-0 ${isActive('/shop') ? 'text-primary' : 'text-muted-foreground'}`}>
          <ShoppingBag size={18} />
          <span className="text-[9px] mt-1 truncate">Shop</span>
        </Link>

        {/* Camera Button - TRUE CENTER (4th position out of 7) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button 
            onClick={onCameraClick}
            className="bg-primary text-black p-3 rounded-full shadow-lg border-4 border-background active:scale-90 transition-transform"
          >
            <Camera size={22} />
          </button>
        </div>

        <Link to="/inventory" className={`flex flex-col items-center justify-center flex-1 min-w-0 ${isActive('/inventory') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Package size={18} />
          <span className="text-[9px] mt-1 truncate">Gear</span>
        </Link>

        <Link to="/clubs" className={`flex flex-col items-center justify-center flex-1 min-w-0 ${isActive('/clubs') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Users size={18} />
          <span className="text-[9px] mt-1 truncate">Clubs</span>
        </Link>

        {isLoggedIn !== null && (
          <Link 
            to={isLoggedIn ? "/profile" : "/auth"} 
            className={`flex flex-col items-center justify-center flex-1 min-w-0 ${(isActive('/profile') || isActive('/auth')) ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {isLoggedIn ? <User size={18} /> : <LogIn size={18} />}
            <span className="text-[9px] mt-1 truncate">{isLoggedIn ? "Profile" : "Login"}</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
