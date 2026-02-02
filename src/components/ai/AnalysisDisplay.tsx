import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertCircle, Zap, Send } from "lucide-react";
import { useState } from "react";
import { sendToCliplyst, isCliplystConfigured, type CliplystPayload } from "@/lib/cliplystConnectorService";

interface PlatformRanking {
  platform: string;
  score: number;
  clicks: number;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
}

interface AnalysisResult {
  summary: string;
  platformRanking: PlatformRanking[];
  keyInsights: {
    topPerformingContent: string;
    underperformingAreas: string;
    suggestions: string[];
  };
  nextSteps: string;
}

const getPerformanceColor = (performance: string): string => {
  switch (performance) {
    case 'excellent':
      return 'bg-green-50 border-green-200';
    case 'good':
      return 'bg-blue-50 border-blue-200';
    case 'fair':
      return 'bg-yellow-50 border-yellow-200';
    case 'poor':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getPerformanceTextColor = (performance: string): string => {
  switch (performance) {
    case 'excellent':
      return 'text-green-700';
    case 'good':
      return 'text-blue-700';
    case 'fair':
      return 'text-yellow-700';
    case 'poor':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
};

export const AnalysisDisplay = ({ analysis }: { analysis: AnalysisResult }) => {
  const [sendingToCliplyst, setSendingToCliplyst] = useState(false);
  const [cliplystStatus, setCliplystStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [cliplystMessage, setCliplystMessage] = useState('');
  const [expandedInsights, setExpandedInsights] = useState(false);

  const weakPlatforms = analysis.platformRanking
    .filter(p => p.performance === 'poor' || p.performance === 'fair')
    .map(p => p.platform);

  const topOpportunities = analysis.platformRanking
    .filter(p => p.performance === 'excellent' || p.performance === 'good')
    .map(p => p.platform);

  const handleSendToCliplyst = async () => {
    setSendingToCliplyst(true);
    setCliplystStatus('sending');
    setCliplystMessage('Sending strategy to Cliplyst...');

    try {
      // Get user data from localStorage (set by AIAssistant component)
      const userDataStr = localStorage.getItem('lynkscope_user_analysis');
      if (!userDataStr) {
        throw new Error('User analysis data not found');
      }

      const userData = JSON.parse(userDataStr);
      const payload: CliplystPayload = {
        user_id: userData.user_id || 'unknown',
        company_name: userData.business_name || userData.company_name || 'Unnamed Business',
        niche: userData.niche || 'General',
        weak_platforms: weakPlatforms,
        top_opportunities: topOpportunities,
        auto_schedule: true,
        posting_frequency: 'daily', // Default to daily, can be customized later
      };

      const result = await sendToCliplyst(payload);

      if (result.success) {
        setCliplystStatus('success');
        setCliplystMessage(
          result.automation_id
            ? `✓ Content automation started! ID: ${result.automation_id}`
            : `✓ ${result.message}`
        );
      } else {
        setCliplystStatus('error');
        setCliplystMessage(`✗ ${result.error || result.message}`);
      }
    } catch (error) {
      setCliplystStatus('error');
      setCliplystMessage(`✗ ${error instanceof Error ? error.message : 'Failed to send to Cliplyst'}`);
    } finally {
      setSendingToCliplyst(false);
    }
  };

  return (
    <div className="space-y-3 max-w-sm">
      {/* Summary */}
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
        <p className="text-xs text-gray-800 leading-relaxed">{analysis.summary}</p>
      </Card>

      {/* Platform Rankings - Compact */}
      <div>
        <h4 className="font-semibold text-xs mb-2 text-gray-800">Platform Rankings</h4>
        <div className="space-y-1">
          {analysis.platformRanking.slice(0, 3).map((platform, idx) => (
            <Card
              key={platform.platform}
              className={`p-2 border-l-4 border-l-purple-500 ${getPerformanceColor(platform.performance)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs truncate">{platform.platform}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${getPerformanceTextColor(platform.performance)} bg-white`}>
                      {getScoreLabel(platform.score)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-gray-800">{platform.score}/100</div>
                </div>
              </div>
              <div className="mt-1 bg-gray-200 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    platform.performance === 'excellent'
                      ? 'bg-green-500'
                      : platform.performance === 'good'
                      ? 'bg-blue-500'
                      : platform.performance === 'fair'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${platform.score}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Insights - Collapsible */}
      <Button
        onClick={() => setExpandedInsights(!expandedInsights)}
        variant="outline"
        size="sm"
        className="w-full text-xs h-8"
      >
        {expandedInsights ? 'Hide' : 'Show'} Detailed Insights
      </Button>

      {expandedInsights && (
        <div className="space-y-2">
          {/* Top Performing */}
          <Card className="p-2 bg-green-50 border border-green-200">
            <div className="flex items-start gap-1.5">
              <TrendingUp size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-900">Top Content</p>
                <p className="text-xs text-green-800 mt-0.5 line-clamp-2">{analysis.keyInsights.topPerformingContent}</p>
              </div>
            </div>
          </Card>

          {/* Underperforming */}
          <Card className="p-2 bg-red-50 border border-red-200">
            <div className="flex items-start gap-1.5">
              <TrendingDown size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-900">Needs Work</p>
                <p className="text-xs text-red-800 mt-0.5 line-clamp-2">{analysis.keyInsights.underperformingAreas}</p>
              </div>
            </div>
          </Card>

          {/* Top Suggestion */}
          {analysis.keyInsights.suggestions.length > 0 && (
            <Card className="p-2 bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-1.5">
                <AlertCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-900">Action</p>
                  <p className="text-xs text-blue-800 mt-0.5">{analysis.keyInsights.suggestions[0]}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Cliplyst Integration - Compact */}
      {isCliplystConfigured() && (
        <Card className="p-2 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-orange-600" />
              <p className="text-xs font-semibold text-orange-900">Auto Content Ready</p>
            </div>

            {cliplystStatus !== 'idle' && (
              <div
                className={`text-xs p-1.5 rounded border ${
                  cliplystStatus === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : cliplystStatus === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                {cliplystMessage}
              </div>
            )}

            <Button
              onClick={handleSendToCliplyst}
              disabled={sendingToCliplyst || cliplystStatus === 'success'}
              size="sm"
              className={`w-full h-7 text-xs gap-1 ${
                cliplystStatus === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <Send size={12} />
              {cliplystStatus === 'success'
                ? 'Started'
                : sendingToCliplyst
                ? 'Sending...'
                : 'Generate Content'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
