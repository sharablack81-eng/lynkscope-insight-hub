import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, BACKEND_URL } from "@/lib/backend";
import { AnalysisDisplay } from "./AnalysisDisplay";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  showSeoPrompt?: boolean;
}

interface AnalyticsData {
  businessName: string;
  businessNiche: string;
  totalLinks: number;
  totalClicks: number;
  platformBreakdown: Record<string, { clicks: number; links: number; ctr: number }>;
  timeRange: string;
  topPerformers: Array<{ title: string; url: string; clicks: number; platform: string }>;
  underperformers: Array<{ title: string; url: string; clicks: number; platform: string }>;
  averageCtr: number;
  topPlatform: string;
  topPlatformPercentage: number;
}

interface AnalysisResult {
  summary: string;
  platformRanking: Array<{
    platform: string;
    score: number;
    clicks: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    recommendation: string;
  }>;
  keyInsights: {
    topPerformingContent: string;
    underperformingAreas: string;
    suggestions: string[];
  };
  nextSteps: string;
}

interface CliplystSyncPayload {
  user_id: string;
  business_name: string;
  niche: string;
  total_clicks: number;
  top_platform: string;
  underperforming_platforms: string[];
  platform_click_breakdown: {
    youtube: number;
    tiktok: number;
    instagram: number;
    twitter: number;
    other: number;
  };
  weak_platforms: string[];
  top_opportunities: string[];
  auto_schedule: boolean;
  posting_frequency: string;
}

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your Marketing AI Assistant. Type "Summarize my marketing data" to analyze your link performance and get personalized recommendations.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [lastAnalyticsData, setLastAnalyticsData] = useState<AnalyticsData | null>(null);
  const [awaitingSeoResponse, setAwaitingSeoResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAnalytics = async (): Promise<AnalyticsData | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to use the AI Assistant");
        return null;
      }

      const response = await fetch(`${BACKEND_URL}/functions/v1/collect-analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load your marketing data");
      return null;
    }
  };

  const analyzeMarketing = async (analyticsData: AnalyticsData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${BACKEND_URL}/functions/v1/marketing-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Analysis failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing marketing data:', error);
      throw error;
    }
  };

  // Sync marketing intelligence to Cliplyst
  const syncToCliplyst = async (
    analyticsData: AnalyticsData,
    analysis: AnalysisResult,
    userId: string
  ): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[Cliplyst Sync] No session, skipping sync');
        return false;
      }

      // Build platform click breakdown from analytics data
      const platformBreakdown = analyticsData.platformBreakdown;
      const clickBreakdown = {
        youtube: platformBreakdown['YouTube']?.clicks || 0,
        tiktok: platformBreakdown['TikTok']?.clicks || 0,
        instagram: platformBreakdown['Instagram']?.clicks || 0,
        twitter: platformBreakdown['Twitter']?.clicks || 0,
        other: platformBreakdown['Other']?.clicks || 0,
      };

      // Find top platform and underperformers from analysis
      const sortedPlatforms = [...analysis.platformRanking].sort((a, b) => b.clicks - a.clicks);
      const topPlatform = analyticsData.topPlatform || sortedPlatforms[0]?.platform || 'Unknown';
      const underperformingPlatforms = sortedPlatforms
        .filter(p => p.performance === 'poor' || p.performance === 'fair')
        .map(p => p.platform);

      // Build opportunities from suggestions
      const topOpportunities = analysis.keyInsights.suggestions.slice(0, 3);

      const payload: CliplystSyncPayload = {
        user_id: userId,
        business_name: analyticsData.businessName,
        niche: analyticsData.businessNiche,
        total_clicks: analyticsData.totalClicks,
        top_platform: topPlatform,
        underperforming_platforms: underperformingPlatforms,
        platform_click_breakdown: clickBreakdown,
        weak_platforms: underperformingPlatforms,
        top_opportunities: topOpportunities,
        auto_schedule: false,
        posting_frequency: 'daily',
      };

      console.log('[Cliplyst Sync] Sending marketing intelligence:', payload);

      const response = await fetch(`${BACKEND_URL}/functions/v1/cliplyst-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('[Cliplyst Sync] Sync failed:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('[Cliplyst Sync] Result:', result);

      return result.synced === true;
    } catch (error) {
      // Silently fail - don't interrupt the user experience
      console.error('[Cliplyst Sync] Error:', error);
      return false;
    }
  };

  // Generate SEO captions and hashtags
  const generateSeoCaptions = async (analyticsData: AnalyticsData, analysis: AnalysisResult): Promise<string> => {
    const niche = analyticsData.businessNiche || 'General';
    const topPlatform = analyticsData.topPlatform || 'Social Media';
    const underperformers = analysis.platformRanking
      .filter(p => p.performance === 'poor' || p.performance === 'fair')
      .map(p => p.platform);
    
    // Generate platform-specific captions
    const captions: string[] = [];
    const hashtags: string[] = [];
    
    // Niche-based hashtags
    const nicheHashtags: Record<string, string[]> = {
      'Fashion': ['#OOTD', '#FashionInspo', '#StyleGuide', '#Trending'],
      'Tech': ['#TechTips', '#Innovation', '#FutureTech', '#Gadgets'],
      'Fitness': ['#FitnessMotivation', '#WorkoutTips', '#HealthyLifestyle', '#GymLife'],
      'Food': ['#Foodie', '#RecipeOfTheDay', '#Delicious', '#Cooking'],
      'Business': ['#Entrepreneur', '#BusinessTips', '#Success', '#Growth'],
      'General': ['#Viral', '#Trending', '#MustSee', '#CheckThisOut'],
    };
    
    const selectedHashtags = nicheHashtags[niche] || nicheHashtags['General'];
    hashtags.push(...selectedHashtags);
    
    // Platform-specific captions
    if (topPlatform === 'TikTok' || underperformers.includes('TikTok')) {
      captions.push(`🔥 POV: You just discovered something amazing in ${niche.toLowerCase()}...`);
      captions.push(`Wait for it... 👀 This ${niche.toLowerCase()} hack changed everything!`);
      hashtags.push('#TikTokMadeMeBuyIt', '#ForYouPage', '#FYP');
    }
    
    if (topPlatform === 'Instagram' || underperformers.includes('Instagram')) {
      captions.push(`✨ The ${niche.toLowerCase()} content you've been waiting for is here.`);
      captions.push(`Double tap if you agree! 💯 Comment your thoughts below 👇`);
      hashtags.push('#InstaDaily', '#ExplorePage', '#ReelsViral');
    }
    
    if (topPlatform === 'YouTube' || underperformers.includes('YouTube')) {
      captions.push(`📺 NEW VIDEO: Everything you need to know about ${niche.toLowerCase()} [WATCH NOW]`);
      captions.push(`Subscribe for more ${niche.toLowerCase()} content! 🔔`);
      hashtags.push('#YouTubeShorts', '#Subscribe', '#NewVideo');
    }
    
    if (topPlatform === 'Twitter' || underperformers.includes('Twitter')) {
      captions.push(`🧵 A thread on ${niche.toLowerCase()} trends you can't miss:`);
      captions.push(`Hot take: ${niche} is evolving faster than ever. Here's why 👇`);
      hashtags.push('#Threads', '#Trending');
    }
    
    // Default captions if none matched
    if (captions.length === 0) {
      captions.push(`🚀 Level up your ${niche.toLowerCase()} game with this!`);
      captions.push(`The secret to success in ${niche.toLowerCase()}? Consistency + value.`);
      captions.push(`Tag someone who needs to see this! 👥`);
    }
    
    // Build response
    let response = `🎯 **Niche-Optimized Captions for ${niche}**\n\n`;
    response += `**Top Platform Focus:** ${topPlatform}\n`;
    if (underperformers.length > 0) {
      response += `**Boost Needed:** ${underperformers.join(', ')}\n\n`;
    } else {
      response += '\n';
    }
    
    response += `**📝 Caption Ideas:**\n`;
    captions.forEach((caption, i) => {
      response += `${i + 1}. ${caption}\n`;
    });
    
    response += `\n**#️⃣ SEO Hashtags:**\n`;
    response += hashtags.join(' ') + '\n';
    
    response += `\n**💡 Pro Tips:**\n`;
    response += `• Post during peak hours (typically 12-3 PM and 7-9 PM)\n`;
    response += `• Engage with comments within the first hour\n`;
    response += `• Use trending audio on TikTok/Reels for extra reach`;
    
    return response;
  };

  const handleSummarize = async () => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: "Summarize my marketing data",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Fetch analytics data
      const analyticsData = await fetchAnalytics();
      if (!analyticsData) {
        throw new Error("No analytics data available");
      }

      // Store for SEO generation later
      setLastAnalyticsData(analyticsData);

      // Add loading message
      const loadingId = 'loading-' + Date.now();
      const loadingMessage: Message = {
        id: loadingId,
        role: 'assistant',
        content: 'Analyzing your marketing performance... This may take a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Analyze the data
      const analysis = await analyzeMarketing(analyticsData);
      setAnalysisResult(analysis);

      // Get user ID for Cliplyst sync
      const userId = (await supabase.auth.getUser()).data.user?.id || 'unknown';

      // Store user data for Cliplyst integration (legacy localStorage backup)
      const userDataForCliplyst = {
        user_id: userId,
        business_name: analyticsData.businessName,
        niche: analyticsData.businessNiche,
        total_links: analyticsData.totalLinks,
        total_clicks: analyticsData.totalClicks,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('lynkscope_user_analysis', JSON.stringify(userDataForCliplyst));

      // 🚀 Automatically sync marketing intelligence to Cliplyst
      const syncSuccess = await syncToCliplyst(analyticsData, analysis, userId);

      // Build the summary with analytics matching dashboard
      const syncMessage = syncSuccess 
        ? "\n\n✨ Analysis data sent to Cliplyst for content optimization."
        : "";

      // Replace loading message with analysis summary
      const summaryMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed your marketing data for "${analyticsData.businessName}".\n\n📊 **Quick Stats:**\n• Total Clicks: ${analyticsData.totalClicks.toLocaleString()}\n• Total Links: ${analyticsData.totalLinks}\n• Top Platform: ${analyticsData.topPlatform} (${analyticsData.topPlatformPercentage}% of traffic)\n\n${analysis.summary}${syncMessage}`,
        timestamp: new Date(),
      };

      setMessages(prev => {
        // Remove loading message
        const filtered = prev.filter(m => m.id !== loadingId);
        return [...filtered, summaryMessage];
      });

      // Add follow-up SEO prompt after a brief delay
      setTimeout(() => {
        const seoPromptMessage: Message = {
          id: (Date.now() + 100).toString(),
          role: 'assistant',
          content: '💡 Would you like me to generate niche-optimized captions and hashtags for SEO?\n\nType **"Yes"** and I\'ll create platform-specific content based on your performance data.',
          timestamp: new Date(),
          showSeoPrompt: true,
        };
        setMessages(prev => [...prev, seoPromptMessage]);
        setAwaitingSeoResponse(true);
      }, 1000);

    } catch (error) {
      console.error('Error in analysis process:', error);
      
      let errorDetails = 'Please try again in a few moments.';
      if (error instanceof Error) {
        if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
          errorDetails = 'Too many requests to OpenAI. Please wait a moment and try again.';
        } else if (error.message.includes('OPENAI_API_KEY') || error.message.includes('not configured')) {
          errorDetails = 'The AI analysis service is not properly configured. Please contact support.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorDetails = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('No analytics data')) {
          errorDetails = 'No marketing data available. Please create some links and track them first.';
        } else if (error.message.includes('timeout')) {
          errorDetails = 'Request timed out. Please try again.';
        } else {
          errorDetails = error.message || errorDetails;
        }
      }

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error analyzing your data: ${errorDetails}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeoGeneration = async () => {
    if (!lastAnalyticsData || !analysisResult) {
      toast.error("Please run the analysis first");
      return;
    }

    setIsLoading(true);

    try {
      const seoContent = await generateSeoCaptions(lastAnalyticsData, analysisResult);
      
      const seoMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: seoContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, seoMessage]);
      setAwaitingSeoResponse(false);
    } catch (error) {
      console.error('Error generating SEO content:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating captions. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input.toLowerCase().trim();

    // Check if awaiting SEO response
    if (awaitingSeoResponse && (userInput === 'yes' || userInput === 'y' || userInput.includes('yes'))) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      await handleSeoGeneration();
      return;
    }

    // Check for summarize command
    if (userInput.includes("summarize")) {
      await handleSummarize();
    } else if (userInput.includes("caption") || userInput.includes("hashtag") || userInput.includes("seo")) {
      // Direct request for captions
      if (lastAnalyticsData && analysisResult) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: input,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        await handleSeoGeneration();
      } else {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: input,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'To generate captions and hashtags, I first need to analyze your data. Please type "Summarize my marketing data" to get started!',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } else {
      // Generic response for other inputs
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInput("");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I can help you analyze your marketing data! Try typing "Summarize my marketing data" to get started with your personalized analysis.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] bg-card shadow-2xl rounded-lg flex flex-col z-40 border border-border">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={20} />
              <h3 className="font-semibold">Marketing AI Assistant</h3>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary/20 text-foreground'
                      : 'bg-muted text-foreground'
                  } whitespace-pre-wrap text-sm`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader size={16} className="animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analyzing...</span>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="mt-4 pt-4 border-t border-border w-full">
                <AnalysisDisplay analysis={analysisResult} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={awaitingSeoResponse ? "Type 'Yes' for captions..." : "Type 'Summarize my marketing data'..."}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send size={18} />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
};
