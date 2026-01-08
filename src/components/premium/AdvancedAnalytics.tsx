import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity, Users, Globe, Smartphone, Monitor, TabletSmartphone } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { WorldMap } from "./WorldMap";
import { fetchAllClicks, fetchUserLinks, aggregateAnalytics } from "@/lib/analytics";

const AdvancedAnalytics = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data using unified analytics module
  const { data: analyticsData } = useQuery({
    queryKey: ['advanced-analytics'],
    queryFn: async () => {
      const [clicks, links] = await Promise.all([
        fetchAllClicks(),
        fetchUserLinks()
      ]);
      return { clicks, links, aggregated: aggregateAnalytics(clicks, links) };
    },
    refetchInterval: autoRefresh ? 3000 : false
  });

  const liveData = {
    totalClicks: analyticsData?.aggregated.totalClicks || 0,
    activeUsers: analyticsData?.clicks.filter(c => {
      const clickTime = new Date(c.clicked_at).getTime();
      const now = Date.now();
      return now - clickTime < 300000; // Last 5 minutes
    }).length || 0,
    topLink: (() => {
      if (!analyticsData?.aggregated.topLinks.length) return "No clicks yet";
      return analyticsData.aggregated.topLinks[0]?.title || "N/A";
    })()
  };

  const geoData = analyticsData?.aggregated.continentBreakdown || [];
  const deviceData = analyticsData?.aggregated.deviceBreakdown || [];
  const browserData = analyticsData?.aggregated.browserBreakdown || [];

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
            {geoData.length > 0 ? (
              <div className="space-y-4">
                <WorldMap data={geoData} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {geoData.map((item) => (
                    <div key={item.continent} className="flex justify-between items-center p-3 bg-card/50 rounded-lg hover:bg-card transition-colors">
                      <span className="text-sm font-medium">{item.continent}</span>
                      <span className="text-sm text-primary font-semibold">{item.clicks}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <Globe className="w-12 h-12 text-primary/30 mx-auto" />
                  <p>No geographic data yet.</p>
                  <p className="text-sm">Clicks will be tracked automatically.</p>
                </div>
              </div>
            )}
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
