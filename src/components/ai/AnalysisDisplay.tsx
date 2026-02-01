import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

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
        </div>
      </div>
    </div>
  );
};
