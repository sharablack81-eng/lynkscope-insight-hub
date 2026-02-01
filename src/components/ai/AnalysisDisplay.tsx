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
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
        <p className="text-sm text-gray-800 leading-relaxed">{analysis.summary}</p>
      </Card>

      {/* Platform Rankings */}
      <div>
        <h4 className="font-semibold text-sm mb-3 text-gray-800">Platform Performance Rankings</h4>
        <div className="space-y-2">
          {analysis.platformRanking.map((platform, idx) => (
            <Card
              key={platform.platform}
              className={`p-3 border-l-4 border-l-purple-500 ${getPerformanceColor(platform.performance)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{idx + 1}. {platform.platform}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getPerformanceTextColor(platform.performance)} bg-white`}>
                      {getScoreLabel(platform.score)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{platform.recommendation}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-lg font-bold text-gray-800">{platform.score}</span>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                  <p className="text-xs text-gray-500">{platform.clicks} clicks</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="mt-2 bg-gray-200 h-1.5 rounded-full overflow-hidden">
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

      {/* Key Insights */}
      <div>
        <h4 className="font-semibold text-sm mb-3 text-gray-800">Key Insights</h4>

        <div className="space-y-3">
          {/* Top Performing */}
          <Card className="p-3 bg-green-50 border border-green-200">
            <div className="flex items-start gap-2">
              <TrendingUp size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-900">Top Performing Content</p>
                <p className="text-xs text-green-800 mt-1">{analysis.keyInsights.topPerformingContent}</p>
              </div>
            </div>
          </Card>

          {/* Underperforming */}
          <Card className="p-3 bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <TrendingDown size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-900">Underperforming Areas</p>
                <p className="text-xs text-red-800 mt-1">{analysis.keyInsights.underperformingAreas}</p>
              </div>
            </div>
          </Card>

          {/* Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-900">Recommended Actions</p>
            </div>
            <ul className="space-y-1">
              {analysis.keyInsights.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-xs text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <Card className="p-3 bg-indigo-50 border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-900">Next Steps</p>
            <p className="text-xs text-indigo-800 mt-1">{analysis.nextSteps}</p>
          </Card>

          {/* Cliplyst Integration */}
          {isCliplystConfigured() && (
            <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-orange-600" />
                  <p className="text-sm font-semibold text-orange-900">Ready for Automated Content</p>
                </div>
                <p className="text-xs text-orange-800">
                  Send this strategy to Cliplyst to automatically generate and schedule content for your weak platforms.
                </p>

                {/* Cliplyst Status Message */}
                {cliplystStatus !== 'idle' && (
                  <div
                    className={`text-xs p-2 rounded border ${
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
                  className={`w-full h-9 text-sm font-semibold gap-2 ${
                    cliplystStatus === 'success'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <Send size={16} />
                  {cliplystStatus === 'success'
                    ? 'Content Automation Started'
                    : sendingToCliplyst
                    ? 'Sending...'
                    : 'Generate Content with Cliplyst'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
