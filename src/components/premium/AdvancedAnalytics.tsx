import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity, Users, Globe, Smartphone, Monitor, TabletSmartphone } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AdvancedAnalytics = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch link clicks data
  const { data: clicksData } = useQuery({
    queryKey: ['link-clicks-analytics'],
    queryFn: async () => {
      const { data: links } = await supabase
        .from('links')
        .select('id, title');
      
      const { data: clicks } = await supabase
        .from('link_clicks')
        .select('link_id, browser, device_type, clicked_at');
      
      return { links: links || [], clicks: clicks || [] };
    },
    refetchInterval: autoRefresh ? 3000 : false
  });

  const liveData = {
    totalClicks: clicksData?.clicks.length || 0,
    activeUsers: clicksData?.clicks.filter(c => {
      const clickTime = new Date(c.clicked_at).getTime();
      const now = Date.now();
      return now - clickTime < 300000; // Last 5 minutes
    }).length || 0,
    topLink: (() => {
      if (!clicksData?.clicks.length) return "No clicks yet";
      const linkCounts: Record<string, number> = {};
      clicksData.clicks.forEach(c => {
        linkCounts[c.link_id] = (linkCounts[c.link_id] || 0) + 1;
      });
      const topLinkId = Object.entries(linkCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      return clicksData.links.find(l => l.id === topLinkId)?.title || "N/A";
    })()
  };

  const geoData = [
    { country: "Geographic data coming soon", clicks: 0 }
  ];

  // Process device data
  const deviceData = (() => {
    if (!clicksData?.clicks.length) return [];
    
    const devices = clicksData.clicks.reduce((acc, click) => {
      const type = click.device_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(devices).reduce((a, b) => a + b, 0);
    const colors: Record<string, string> = {
      'Desktop': '#8B5CF6',
      'Mobile': '#A78BFA',
      'Tablet': '#C4B5FD',
      'Unknown': '#6B7280'
    };

    return Object.entries(devices).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: colors[name] || '#6B7280'
    }));
  })();

  // Process browser data
  const browserData = (() => {
    if (!clicksData?.clicks.length) return [];
    
    const browsers = clicksData.clicks.reduce((acc, click) => {
      const browser = click.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(browsers)
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks);
  })();

  return (
    <div className="space-y-6">
      {/* Live Tracking Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="premium-card border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary animate-pulse" />
                Live Tracking
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
                  Auto-refresh
                </Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="premium-card p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Total Clicks</div>
                <div className="text-3xl font-bold">{liveData.totalClicks.toLocaleString()}</div>
              </div>
              <div className="premium-card p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Users
                </div>
                <div className="text-3xl font-bold text-primary">{liveData.activeUsers}</div>
              </div>
              <div className="premium-card p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Top Performing</div>
                <div className="text-2xl font-bold">{liveData.topLink}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Geographic Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Geographic Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Map Placeholder */}
              <div className="relative h-64 bg-gradient-to-br from-card to-muted rounded-xl overflow-hidden border border-primary/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-primary/30" />
                </div>
                {/* Simulated location dots */}
                {geoData.map((location, i) => (
                  <motion.div
                    key={location.country}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="absolute w-3 h-3 rounded-full bg-primary glow-purple-strong cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + (i % 3) * 20}%`,
                    }}
                    title={`${location.country}: ${location.clicks} clicks`}
                  />
                ))}
              </div>

              {/* Location List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {geoData.map((location, i) => (
                  <motion.div
                    key={location.country}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card transition-colors"
                  >
                    <span className="font-medium">{location.country}</span>
                    <span className="text-primary font-semibold">{location.clicks} clicks</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Device & Browser Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="premium-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Device Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ payload }) => {
                        if (!payload?.[0]) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-primary/30 rounded-lg p-2 text-sm">
                            <div>{data.name}: {data.count} clicks ({data.value}%)</div>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-4">
                    {deviceData.map((device) => (
                      <div key={device.name} className="flex items-center gap-2">
                        {device.name === 'Mobile' && <Smartphone className="w-4 h-4 text-primary" />}
                        {device.name === 'Desktop' && <Monitor className="w-4 h-4 text-primary/70" />}
                        {device.name === 'Tablet' && <TabletSmartphone className="w-4 h-4 text-primary/50" />}
                        <span className="text-sm">{device.name}: {device.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No device data yet. Start tracking clicks to see analytics.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="premium-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Browser Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {browserData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={browserData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888" 
                      fontSize={12}
                    />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--primary) / 0.3)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="clicks" 
                      fill="#8B5CF6" 
                      radius={[8, 8, 0, 0]}
                      animationBegin={0}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No browser data yet. Start tracking clicks to see analytics.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
