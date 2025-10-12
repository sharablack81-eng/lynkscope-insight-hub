import { Button } from "@/components/ui/button";
import { X, MousePointerClick, TrendingUp, Users } from "lucide-react";
import { Link } from "@/pages/Links";

interface AnalyticsDrawerProps {
  link: Link | null;
  onClose: () => void;
}

const AnalyticsDrawer = ({ link, onClose }: AnalyticsDrawerProps) => {
  if (!link) return null;

  // Placeholder analytics data
  const platformBreakdown = [
    { platform: "Direct", percentage: 45, color: "bg-primary" },
    { platform: "Social", percentage: 35, color: "bg-purple-500" },
    { platform: "Email", percentage: 20, color: "bg-pink-500" }
  ];

  const weeklyData = [72, 85, 78, 90, 88, 95, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full md:w-[500px] h-[90vh] md:h-full md:max-h-[90vh] bg-card border-l border-border flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{link.title}</h2>
            <p className="text-sm text-muted-foreground">Link Analytics</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-1">Total Clicks</div>
              <div className="text-2xl font-bold">{link.clicks.toLocaleString()}</div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-1">This Week</div>
              <div className="text-2xl font-bold text-green-500">+18%</div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Traffic Sources
            </h3>
            <div className="space-y-3">
              {platformBreakdown.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>{item.platform}</span>
                    <span className="font-semibold">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500 animate-scale-in`}
                      style={{ 
                        width: `${item.percentage}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Last 7 Days Trend
            </h3>
            <div className="h-48 flex items-end gap-2">
              {weeklyData.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:from-primary/80 hover:to-purple-400 cursor-pointer animate-scale-in"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${i * 80}ms`
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs text-muted-foreground">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-bold mb-4">Device Distribution</h3>
            <div className="space-y-3">
              {[
                { device: "Mobile", count: Math.floor(link.clicks * 0.65), color: "bg-primary" },
                { device: "Desktop", count: Math.floor(link.clicks * 0.28), color: "bg-purple-500" },
                { device: "Tablet", count: Math.floor(link.clicks * 0.07), color: "bg-pink-500" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.device}</span>
                  </div>
                  <span className="font-semibold">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDrawer;
