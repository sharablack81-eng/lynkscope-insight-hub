import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LinkIcon,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  MousePointerClick,
  Users,
  Crown,
  Menu,
  X
} from "lucide-react";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const metrics = [
    {
      label: "Total Clicks",
      value: "12,547",
      change: "+23%",
      trend: "up",
      icon: MousePointerClick
    },
    {
      label: "Top Platform",
      value: "Instagram",
      change: "42% of traffic",
      trend: "neutral",
      icon: TrendingUp
    },
    {
      label: "Last 7 Days",
      value: "3,891",
      change: "+15%",
      trend: "up",
      icon: BarChart3
    }
  ];

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: LinkIcon, label: "Links", active: false },
    { icon: BarChart3, label: "Analytics", active: false },
    { icon: Settings, label: "Settings", active: false }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <LinkIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          {sidebarOpen && <span className="text-xl font-bold">LynkScope</span>}
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-sidebar-accent group ${
                item.active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground"
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  item.active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                }`}
              />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <Link to="/auth">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-destructive/10 text-destructive group">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-accent"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, User</h1>
              <p className="text-sm text-muted-foreground">Your Link Overview</p>
            </div>
          </div>
          
          <Button className="gradient-purple glow-purple hover:glow-purple-strong transition-all hover:scale-105">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-xl hover:scale-105 hover:glow-purple transition-all duration-300 animate-scale-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <metric.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      metric.trend === "up"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
                <div className="text-3xl font-bold">{metric.value}</div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="glass-card p-6 rounded-xl animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Performance Overview</h2>
                <p className="text-sm text-muted-foreground">Last 7 days activity</p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>

            <div className="h-64 flex items-end gap-3">
              {[65, 78, 82, 70, 88, 95, 100, 92, 85, 90, 97, 94, 89, 96].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:from-primary/80 hover:to-purple-400 cursor-pointer animate-scale-in"
                  style={{ height: `${height}%`, animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>

            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Pro Features Preview */}
          <div className="glass-card p-6 rounded-xl border-2 border-primary/30 relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Crown className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Unlock Premium Features</h3>
                  <p className="text-muted-foreground mb-4">
                    Get advanced analytics, custom domains, unlimited links, and more with LynkScope Pro.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      Advanced Analytics
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      Custom Domains
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      Priority Support
                    </span>
                  </div>
                  <Button className="gradient-purple glow-purple hover:glow-purple-strong transition-all hover:scale-105">
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
