import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, MousePointerClick, TrendingUp, Users, Globe, Smartphone, Monitor, TabletSmartphone } from "lucide-react";
import { Link } from "@/pages/Links";
import { fetchClicksForLink, type ClickData } from "@/lib/analytics";

interface AnalyticsDrawerProps {
  link: Link | null;
  onClose: () => void;
}

const AnalyticsDrawer = ({ link, onClose }: AnalyticsDrawerProps) => {
  const [clicks, setClicks] = useState<ClickData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (link?.id) {
      setLoading(true);
      fetchClicksForLink(link.id).then((data) => {
        setClicks(data);
        setLoading(false);
      });
    }
  }, [link?.id]);

  if (!link) return null;

  const totalClicks = clicks.length;
  
  // Calculate weekly trend
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekClicks = clicks.filter(c => new Date(c.clicked_at) >= weekAgo).length;
  
  const twoWeeksAgo = new Date(weekAgo);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
  const lastWeekClicks = clicks.filter(c => {
    const date = new Date(c.clicked_at);
    return date >= twoWeeksAgo && date < weekAgo;
  }).length;
  
  const weeklyChange = lastWeekClicks > 0 
    ? Math.round(((thisWeekClicks - lastWeekClicks) / lastWeekClicks) * 100) 
    : thisWeekClicks > 0 ? 100 : 0;

  // Calculate referrer breakdown
  const referrerCounts: Record<string, number> = {};
  clicks.forEach(click => {
    const referrer = click.referrer || "Direct";
    // Extract domain from referrer
    let domain = "Direct";
    if (referrer && referrer !== "Direct") {
      try {
        const url = new URL(referrer);
        domain = url.hostname;
      } catch {
        domain = referrer;
      }
    }
    referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
  });

  const referrerData = Object.entries(referrerCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate device breakdown
  const deviceCounts: Record<string, number> = {};
  clicks.forEach(click => {
    const device = click.device_type || "Unknown";
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });

  const deviceData = Object.entries(deviceCounts)
    .map(([device, count]) => ({
      device,
      count,
      color: device === 'Mobile' ? 'bg-primary' : device === 'Desktop' ? 'bg-purple-500' : 'bg-pink-500'
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate daily clicks for last 7 days
  const dailyClicks: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayClicks = clicks.filter(c => {
      const clickDate = new Date(c.clicked_at);
      return clickDate.toDateString() === date.toDateString();
    }).length;
    dailyClicks.push(dayClicks);
  }

  const maxDailyClicks = Math.max(...dailyClicks, 1);

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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <MousePointerClick className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Total Clicks</div>
                  <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                </div>

                <div className="glass-card p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">This Week</div>
                  <div className="text-2xl font-bold text-green-500">
                    {weeklyChange >= 0 ? '+' : ''}{weeklyChange}%
                  </div>
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Traffic Sources
                </h3>
                {referrerData.length > 0 ? (
                  <div className="space-y-3">
                    {referrerData.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="truncate max-w-[200px]">{item.source}</span>
                          <span className="font-semibold">{item.percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500 animate-scale-in"
                            style={{ 
                              width: `${item.percentage}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No traffic data yet</p>
                )}
              </div>

              {/* Weekly Trend */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Last 7 Days Trend
                </h3>
                <div className="h-48 flex items-end gap-2">
                  {dailyClicks.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:from-primary/80 hover:to-purple-400 cursor-pointer animate-scale-in"
                      style={{ 
                        height: maxDailyClicks > 0 ? `${(height / maxDailyClicks) * 100}%` : '0%',
                        minHeight: height > 0 ? '10px' : '0px',
                        animationDelay: `${i * 80}ms`
                      }}
                      title={`${height} clicks`}
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
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Device Distribution
                </h3>
                {deviceData.length > 0 ? (
                  <div className="space-y-3">
                    {deviceData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm flex items-center gap-2">
                            {item.device === 'Mobile' && <Smartphone className="w-4 h-4" />}
                            {item.device === 'Desktop' && <Monitor className="w-4 h-4" />}
                            {item.device === 'Tablet' && <TabletSmartphone className="w-4 h-4" />}
                            {item.device}
                          </span>
                        </div>
                        <span className="font-semibold">{item.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No device data yet</p>
                )}
              </div>
            </>
          )}
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
