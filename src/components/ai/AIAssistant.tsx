 import { useState, useRef, useEffect } from "react";
 import { Send, Loader, X, Sparkles } from "lucide-react";
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
   const [messages, setMessages] = useState<Message[]>([{id:'1',role:'assistant',content:'Hi! I\'m your Marketing AI Assistant. Try "Summarize my marketing data".',timestamp:new Date()}]);
   const [input, setInput] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
   const [lastAnalyticsData, setLastAnalyticsData] = useState<AnalyticsData | null>(null);
   const [awaitingSeoResponse, setAwaitingSeoResponse] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
   useEffect(() => { scrollToBottom(); }, [messages]);

   const fetchAnalytics = async (): Promise<AnalyticsData | null> => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) { toast.error("Please log in"); return null; }
       const response = await fetch(`${BACKEND_URL}/functions/v1/collect-analytics`, {
         method: 'GET',
         headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
       });
       if (!response.ok) throw new Error('Failed to fetch analytics');
       return await response.json();
     } catch (error) { console.error(error); toast.error("Failed to load data"); return null; }
   };

   const analyzeMarketing = async (analyticsData: AnalyticsData) => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) throw new Error('Not authenticated');
       const response = await fetch(`${BACKEND_URL}/functions/v1/marketing-analysis`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify(analyticsData),
       });
       if (!response.ok) throw new Error('Analysis failed');
       return await response.json();
     } catch (error) { console.error(error); throw error; }
   };

   const syncToCliplyst = async (analyticsData: AnalyticsData, analysis: AnalysisResult, userId: string): Promise<boolean> => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) return false;
       const payload: CliplystSyncPayload = {
         user_id: userId,
         business_name: analyticsData.businessName,
         niche: analyticsData.businessNiche,
         total_clicks: analyticsData.totalClicks,
         top_platform: analyticsData.topPlatform,
         underperforming_platforms: [],
         platform_click_breakdown: { youtube: 0, tiktok: 0, instagram: 0, twitter: 0, other: 0 },
         weak_platforms: [],
         top_opportunities: analysis.keyInsights.suggestions.slice(0, 3),
         auto_schedule: false,
         posting_frequency: 'daily',
       };
       const response = await fetch(`${BACKEND_URL}/functions/v1/cliplyst-sync`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
       });
       return !response.ok ? false : true;
     } catch (error) { console.error(error); return false; }
   };

   const generateSeoCaptions = async (analyticsData: AnalyticsData, analysis: AnalysisResult): Promise<string> => {
     const niche = analyticsData.businessNiche || 'General';
     const captions = [`🚀 ${niche} content`, `✨ Upgrade your ${niche} game`];
     return `🎯 **Captions for ${niche}**\n${captions.map((c,i) => `${i+1}. ${c}`).join('\n')}\n\n**Hashtags:** #Trending #MustSee`;
   };

   const handleSummarize = async () => {
     setMessages(prev => [...prev, {id:Date.now().toString(),role:'user',content:'Summarize my marketing data',timestamp:new Date()}]);
     setIsLoading(true);
     try {
       const analyticsData = await fetchAnalytics();
       if (!analyticsData) throw new Error("No data");
       const analysis = await analyzeMarketing(analyticsData);
       setAnalysisResult(analysis);
       const summaryMsg: Message = {
         id: Date.now().toString(),
         role: 'assistant',
         content: `Analyzed "${analyticsData.businessName}": ${analyticsData.totalClicks} clicks, Top: ${analyticsData.topPlatform}`,
         timestamp: new Date(),
       };
       (summaryMsg as any).analysis = analysis;
       setMessages(prev => [...prev, summaryMsg]);
     } catch (error) { 
       toast.error("Analysis failed");
       setMessages(prev => [...prev, {id:Date.now().toString(),role:'assistant',content:'Error analyzing data',timestamp:new Date()}]);
     } finally {
       setIsLoading(false);
     }
   };

   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!input.trim()) return;
     if (input.toLowerCase().includes("summarize")) {
       handleSummarize();
     } else {
       setMessages(prev => [...prev, {id:Date.now().toString(),role:'user',content:input,timestamp:new Date()}]);
       setInput("");
     }
   };

   return (
     <>
       <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full p-4" aria-label="AI">
         {isOpen ? <X size={24} /> : <Sparkles size={24} />}
       </button>
       {isOpen && (
         <Card className="fixed bottom-24 right-6 w-96 h-[500px] flex flex-col z-40">
           <div className="bg-primary text-white p-4">
             <h3>Marketing AI Assistant</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.map(msg => (
               <div key={msg.id}>
                 <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-xs px-4 py-2 rounded ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                     {msg.content}
                   </div>
                 </div>
                 {(msg as any).analysis && <AnalysisDisplay analysis={(msg as any).analysis} />}
               </div>
             ))}
             {isLoading && <div className="text-gray-500">Analyzing...</div>}
             <div ref={messagesEndRef} />
           </div>
           <form onSubmit={handleSubmit} className="p-4 border-t">
             <div className="flex gap-2">
               <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type..." className="flex-1" disabled={isLoading} />
               <Button type="submit" disabled={isLoading}><Send size={18} /></Button>
             </div>
           </form>
         </Card>
       )}
     </>
   );
 };