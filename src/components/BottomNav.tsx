import { Home, Trophy, Camera, Users, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-2 py-2 flex justify-around items-center z-50 max-w-md mx-auto">
      <Link to="/" className={`flex flex-col items-center min-w-[64px] ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Home size={20} />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </Link>
      
      <Link to="/leaderboards" className={`flex flex-col items-center min-w-[64px] ${isActive('/leaderboards') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Trophy size={20} />
        <span className="text-[10px] mt-1 font-medium">Ranks</span>
      </Link>

      <div className="flex justify-center -mt-8 px-2">
        <Link to="/capture" className="bg-primary text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform">
          <Camera size={24} />
        </Link>
      </div>

      <Link to="/clubs" className={`flex flex-col items-center min-w-[64px] ${isActive('/clubs') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Users size={20} />
        <span className="text-[10px] mt-1 font-medium">Clubs</span>
      </Link>

      <Link to="/auth" className={`flex flex-col items-center min-w-[64px] ${isActive('/auth') ? 'text-primary' : 'text-muted-foreground'}`}>
        <LogIn size={20} />
        <span className="text-[10px] mt-1 font-medium">Login</span>
      </Link>
    </nav>
  );
};
