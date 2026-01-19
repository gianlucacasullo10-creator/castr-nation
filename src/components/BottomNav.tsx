import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, Camera, Award, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/clubs", icon: Trophy, label: "Clubs" },
  { path: "/capture", icon: Camera, label: "Capture", isMain: true },
  { path: "/leaderboards", icon: Award, label: "Ranks" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center -mt-6"
              >
                <div className="gradient-primary rounded-full p-4 shadow-lg">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
