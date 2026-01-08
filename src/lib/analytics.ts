import { supabase } from "@/integrations/supabase/client";

/**
 * Unified analytics aggregation module.
 * Single source of truth: smart_link_clicks table
 * 
 * This module provides consistent analytics queries used across:
 * - Dashboard
 * - AnalyticsOverview
 * - AdvancedAnalytics
 * - PDF/CSV Exports
 * - AnalyticsDrawer
 */

export interface ClickData {
  id: string;
  clicked_at: string;
  link_id: string | null;
  merchant_id: string | null;
  destination_url: string;
  browser: string | null;
  device_type: string | null;
  country: string | null;
  continent: string | null;
  referrer: string | null;
  ip_address: string | null;
}

export interface LinkData {
  id: string;
  title: string;
  url: string;
  short_code: string;
  platform: string;
  created_at: string;
  user_id: string;
}

export interface AggregatedAnalytics {
  totalClicks: number;
  clicksLast7Days: number;
  clicksLast30Days: number;
  topPlatform: string;
  topPlatformPercentage: number;
  platformBreakdown: { name: string; value: number; color: string }[];
  deviceBreakdown: { name: string; value: number; count: number; color: string }[];
  browserBreakdown: { name: string; clicks: number }[];
  continentBreakdown: { continent: string; clicks: number }[];
  dailyClicks: { date: string; clicks: number }[];
  topLinks: { id: string; title: string; clicks: number; platform: string }[];
}

const platformColors: Record<string, string> = {
  'TikTok': '#00F2EA',
  'Instagram': '#E1306C',
  'YouTube': '#FF0000',
  'Twitter': '#1DA1F2',
  'Other': '#888888'
};

const deviceColors: Record<string, string> = {
  'Desktop': '#8B5CF6',
  'Mobile': '#A78BFA',
  'Tablet': '#C4B5FD',
  'Unknown': '#6B7280'
};

/**
 * Fetch all clicks from smart_link_clicks table (single source of truth)
 */
export async function fetchAllClicks(): Promise<ClickData[]> {
  const { data, error } = await supabase
    .from('smart_link_clicks')
    .select('*')
    .order('clicked_at', { ascending: false });

  if (error) {
    console.error('Error fetching clicks:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch clicks within a date range
 */
export async function fetchClicksInRange(startDate: Date): Promise<ClickData[]> {
  const { data, error } = await supabase
    .from('smart_link_clicks')
    .select('*')
    .gte('clicked_at', startDate.toISOString())
    .order('clicked_at', { ascending: false });

  if (error) {
    console.error('Error fetching clicks in range:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all links for the current user
 */
export async function fetchUserLinks(): Promise<LinkData[]> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching links:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch clicks for a specific link
 */
export async function fetchClicksForLink(linkId: string): Promise<ClickData[]> {
  const { data, error } = await supabase
    .from('smart_link_clicks')
    .select('*')
    .eq('link_id', linkId)
    .order('clicked_at', { ascending: false });

  if (error) {
    console.error('Error fetching clicks for link:', error);
    return [];
  }

  return data || [];
}

/**
 * Get click count for a specific link
 */
export async function getClickCountForLink(linkId: string): Promise<number> {
  const { count, error } = await supabase
    .from('smart_link_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId);

  if (error) {
    console.error('Error getting click count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Aggregate analytics from clicks and links data
 */
export function aggregateAnalytics(clicks: ClickData[], links: LinkData[]): AggregatedAnalytics {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total clicks
  const totalClicks = clicks.length;

  // Clicks in last 7 days
  const clicksLast7Days = clicks.filter(c => new Date(c.clicked_at) >= sevenDaysAgo).length;
  
  // Clicks in last 30 days
  const clicksLast30Days = clicks.filter(c => new Date(c.clicked_at) >= thirtyDaysAgo).length;

  // Platform breakdown
  const platformCounts: Record<string, number> = {};
  for (const link of links) {
    const linkClicks = clicks.filter(c => c.link_id === link.id).length;
    platformCounts[link.platform] = (platformCounts[link.platform] || 0) + linkClicks;
  }

  const platformBreakdown = Object.entries(platformCounts).map(([name, value]) => ({
    name,
    value,
    color: platformColors[name] || '#888888'
  }));

  // Top platform
  const topPlatformEntry = platformBreakdown.length > 0 
    ? platformBreakdown.reduce((a, b) => a.value > b.value ? a : b)
    : null;
  const topPlatform = topPlatformEntry?.name || "N/A";
  const topPlatformPercentage = totalClicks > 0 && topPlatformEntry
    ? Math.round((topPlatformEntry.value / totalClicks) * 100)
    : 0;

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  for (const click of clicks) {
    const device = click.device_type || 'Unknown';
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  }

  const deviceBreakdown = Object.entries(deviceCounts).map(([name, count]) => ({
    name,
    count,
    value: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
    color: deviceColors[name] || '#6B7280'
  }));

  // Browser breakdown
  const browserCounts: Record<string, number> = {};
  for (const click of clicks) {
    const browser = click.browser || 'Unknown';
    browserCounts[browser] = (browserCounts[browser] || 0) + 1;
  }

  const browserBreakdown = Object.entries(browserCounts)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Continent breakdown
  const continentCounts: Record<string, number> = {};
  for (const click of clicks) {
    const continent = click.continent || 'Unknown';
    continentCounts[continent] = (continentCounts[continent] || 0) + 1;
  }

  const continentBreakdown = Object.entries(continentCounts)
    .map(([continent, clicks]) => ({ continent, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Daily clicks for last 7 days
  const dailyClicks: { date: string; clicks: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayClicks = clicks.filter(c => {
      const clickDate = new Date(c.clicked_at);
      return clickDate.toDateString() === date.toDateString();
    }).length;
    
    dailyClicks.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      clicks: dayClicks
    });
  }

  // Top performing links
  const linksWithClicks = links.map(link => ({
    id: link.id,
    title: link.title,
    clicks: clicks.filter(c => c.link_id === link.id).length,
    platform: link.platform
  })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  return {
    totalClicks,
    clicksLast7Days,
    clicksLast30Days,
    topPlatform,
    topPlatformPercentage,
    platformBreakdown,
    deviceBreakdown,
    browserBreakdown,
    continentBreakdown,
    dailyClicks,
    topLinks: linksWithClicks
  };
}

/**
 * Complete analytics fetch and aggregation in one call
 */
export async function getAggregatedAnalytics(): Promise<AggregatedAnalytics> {
  const [clicks, links] = await Promise.all([
    fetchAllClicks(),
    fetchUserLinks()
  ]);

  return aggregateAnalytics(clicks, links);
}

/**
 * Get analytics for a specific date range
 */
export async function getAnalyticsForRange(days: number): Promise<AggregatedAnalytics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [clicks, links] = await Promise.all([
    fetchClicksInRange(startDate),
    fetchUserLinks()
  ]);

  return aggregateAnalytics(clicks, links);
}
