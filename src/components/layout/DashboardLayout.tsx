import { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LinkIcon,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Wrench,
  TrendingUp,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { status, daysRemaining, isLoading: subscriptionLoading } = useSubscription();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const mainMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: LinkIcon, label: "Links", path: "/links" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];

  const premiumMenuItems = [
    { icon: TrendingUp, label: "Advanced Analytics", path: "/advanced-analytics" },
    { icon: Zap, label: "Automation", path: "/automation" },
    { icon: Wrench, label: "Tools", path: "/tools" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col fixed h-full z-20`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <LinkIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          {sidebarOpen && <span className="text-xl font-bold">LynkScope</span>}
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 flex flex-col">
          <div className="space-y-2">
            {mainMenuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={index} to={item.path}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-sidebar-accent group ${
                      isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                      }`}
                    />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Premium Features */}
          <div className="space-y-2">
            {premiumMenuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={index} to={item.path}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-sidebar-accent group ${
                      isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                      }`}
                    />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Settings at bottom */}
          <div className="space-y-2">
            <Link to="/settings">
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-sidebar-accent group ${
                  location.pathname === "/settings" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground"
                }`}
              >
                <Settings
                  className={`w-5 h-5 flex-shrink-0 ${
                    location.pathname === "/settings" ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  }`}
                />
                {sidebarOpen && <span className="font-medium">Settings</span>}
              </button>
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-destructive/10 text-destructive group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}>
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-accent"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Trial countdown */}
          {!subscriptionLoading && status === 'trial' && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
              daysRemaining <= 2 
                ? 'bg-destructive/10 border-destructive/30 animate-pulse' 
                : 'bg-primary/10 border-primary/20'
            }`}>
              <Clock className={`w-4 h-4 ${daysRemaining <= 2 ? 'text-destructive' : 'text-primary'}`} />
              <span className={`text-sm font-medium ${daysRemaining <= 2 ? 'text-destructive' : 'text-primary'}`}>
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left in trial
              </span>
              {daysRemaining <= 2 && (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="ml-2 h-6 text-xs px-2"
                  onClick={() => navigate('/settings')}
                >
                  Upgrade Now
                </Button>
              )}
            </div>
          )}
          {!subscriptionLoading && status === 'active' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="text-sm font-medium text-green-500">Pro</span>
            </div>
          )}
        </header>

        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
