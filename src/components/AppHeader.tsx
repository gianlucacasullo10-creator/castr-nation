import castrsLogo from "@/assets/castrs-logo.png";
import { Bell, Menu } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
}

export function AppHeader({
  title,
  showLogo = true,
  showNotifications = true,
  notificationCount = 0,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left - Menu or Logo */}
        <div className="flex items-center gap-3">
          {showLogo ? (
            <img 
              src={castrsLogo} 
              alt="CASTRS" 
              className="h-8 object-contain"
            />
          ) : (
            <h1 className="font-bold text-lg">{title}</h1>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {showNotifications && (
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
