import { Home, Trophy, Camera, Users, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-3 flex justify-between items-center z-50">
      <Link to="/" className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Home size={24} />
        <span className="text-xs mt-1">Home</span>
      </Link>
      <Link to="/leaderboards" className={`flex flex-col items-center ${isActive('/leaderboards') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Trophy size={24} />
        <span className="text-xs mt-1">Ranks</span>
      </Link>
      <Link to="/capture" className="bg-primary text-white p-4 rounded-full -mt-10 shadow-lg hover:bg-primary/90 transition-colors">
        <Camera size={28} />
      </Link>
      <Link to="/clubs" className={`flex flex-col items-center ${isActive('/clubs') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Users size={24} />
        <span className="text-xs mt-1">Clubs</span>
      </Link>
      {/* This is your new Login/Profile button */}
      <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile') || isActive('/auth') ? 'text-primary' : 'text-muted-foreground'}`}>
        <User size={24} />
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </nav>
  );
};
