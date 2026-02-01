import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/collect-analytics`, {
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketing-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing marketing data:', error);
      throw error;
    }
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

      // Add loading message
      const loadingMessage: Message = {
        id: 'loading-' + Date.now(),
        role: 'assistant',
        content: 'Analyzing your marketing performance... This may take a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Analyze the data
      const analysis = await analyzeMarketing(analyticsData);
      setAnalysisResult(analysis);

      // Store user data for Cliplyst integration
      const userDataForCliplyst = {
        user_id: (await supabase.auth.getUser()).data.user?.id || 'unknown',
        business_name: analyticsData.businessName,
        niche: analyticsData.businessNiche,
        total_links: analyticsData.totalLinks,
        total_clicks: analyticsData.totalClicks,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('lynkscope_user_analysis', JSON.stringify(userDataForCliplyst));

      // Replace loading message with analysis summary
      const summaryMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed your marketing data for "${analyticsData.businessName}". Here's what I found:\n\n${analysis.summary}`,
        timestamp: new Date(),
      };

      setMessages(prev => {
        // Remove loading message
        const filtered = prev.filter(m => m.id !== 'loading-' + Date.now());
        return [...filtered, summaryMessage];
      });
    } catch (error) {
      console.error('Error in analysis process:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error analyzing your data. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToCliplyst = () => {
    if (!analysisResult) {
      toast.error("No analysis data available");
      return;
    }

    // This is a placeholder for future Cliplyst integration
    const cliplystData = JSON.stringify(analysisResult, null, 2);
    console.log("Cliplyst payload:", cliplystData);

    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '✨ Analysis data ready to send to Cliplyst! This feature will be available soon to automatically generate optimized content for your underperforming platforms.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    toast.success("Analysis data prepared for Cliplyst");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check for summarize command
    if (input.toLowerCase().includes("summarize")) {
      await handleSummarize();
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
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] bg-white shadow-2xl rounded-lg flex flex-col z-40">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
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
                      ? 'bg-purple-100 text-purple-900'
                      : 'bg-gray-100 text-gray-900'
                  } whitespace-pre-wrap text-sm`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  <span className="text-sm text-gray-600">Analyzing...</span>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSendToCliplyst}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  size="sm"
                >
                  Send this data to Cliplyst for content generation
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type 'Summarize my marketing data'..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-purple-500 hover:bg-purple-600"
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
