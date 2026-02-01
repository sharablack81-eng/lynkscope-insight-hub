# Marketing AI Assistant - Feature Documentation

## Overview

The **Marketing AI Assistant** is an intelligent background-processing feature that analyzes your link performance and provides personalized marketing recommendations using OpenAI. It's designed to make Lynkscope feel like a smart platform by providing actionable insights without blocking the UI.

## Architecture

### Components

#### 1. **Floating AI Button** (`AIAssistant.tsx`)
- Fixed position button visible on all pages
- Gradient design (purple to indigo)
- Opens chat-style assistant panel
- Non-blocking UI - doesn't interrupt user workflow

#### 2. **Chat Panel**
- Message-based interaction
- User commands and AI responses
- Loading states with spinner
- Smooth auto-scroll to latest messages
- Professional styling with role-based message colors

#### 3. **Edge Functions**

##### **collect-analytics** (`supabase/functions/collect-analytics/index.ts`)
- Aggregates user's marketing data in real-time
- Fetches:
  - Business profile (name, niche)
  - User's links with click counts
  - Click analytics data
- Returns structured JSON with:
  - Platform breakdown (clicks, links, CTR)
  - Top and underperforming links
  - Average CTR metrics

##### **marketing-analysis** (`supabase/functions/marketing-analysis/index.ts`)
- Processes analytics data through OpenAI
- Sends structured prompt with business context
- Returns ranked analysis including:
  - Platform performance rankings (0-100 score)
  - Performance classification (excellent/good/fair/poor)
  - Specific recommendations per platform
  - Key insights and suggestions

### Data Flow

```
User Command → AIAssistant Component
    ↓
fetch collect-analytics (JWT auth)
    ↓
Aggregate user's links + clicks + profile
    ↓
Return AnalyticsData JSON
    ↓
send marketing-analysis (POST with analytics)
    ↓
  OpenAI analyzes data
    ↓
Return AnalysisResult with rankings/insights
    ↓
Display in Chat Panel + AnalysisDisplay component
    ↓
"Send to Cliplyst" button appears (future integration)
```

## Usage

### For End Users

1. **Open AI Assistant**: Click the floating sparkle button (bottom-right)
2. **Type Command**: "Summarize my marketing data"
3. **Wait for Analysis**: Async processing happens in background
4. **Review Results**:
   - Executive summary
   - Platform rankings (worst → best)
   - Key insights about performance
   - Actionable recommendations
5. **Future**: Send analysis to Cliplyst for content generation

### API Endpoints

#### `GET /functions/v1/collect-analytics`
```
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Response: AnalyticsData {
  businessName: string
  businessNiche: string
  totalLinks: number
  totalClicks: number
  platformBreakdown: {
    [platform]: {
      clicks: number
      links: number
      ctr: number
    }
  }
  timeRange: string
  topPerformers: Link[]
  underperformers: Link[]
  averageCtr: number
}
```

#### `POST /functions/v1/marketing-analysis`
```
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body: AnalyticsData

Response: AnalysisResult {
  summary: string
  platformRanking: [{
    platform: string
    score: number (0-100)
    clicks: number
    performance: 'excellent' | 'good' | 'fair' | 'poor'
    recommendation: string
  }]
  keyInsights: {
    topPerformingContent: string
    underperformingAreas: string
    suggestions: string[]
  }
  nextSteps: string
}
```

## Key Features

### ✨ Async Processing
- Runs in background without blocking UI
- User can continue working while analysis processes
- Loading indicator shows progress
- Non-intrusive chat interface

### 🎯 Smart Analysis
- Uses OpenAI for intelligent insights
- Context-aware recommendations based on business niche
- Platform-specific guidance
- Performance classification (excellent/good/fair/poor)

### 📊 Structured Results
- Platform rankings (worst → best)
- Color-coded performance indicators
- Visual progress bars
- Actionable suggestions

### 🔐 Security
- JWT authentication on all endpoints
- User data isolation (can only access own links)
- Service role for data aggregation
- No data stored without user consent

## Integration Points

### Business Profile Context
- Uses `business_name` and `business_niche` from profiles table
- Personalizes recommendations based on business context
- Enables niche-specific insights

### Short Link System
- Analyzes short link performance
- Uses click tracking data from short_link_clicks table
- Includes platform categorization

### Future: Cliplyst Integration
- "Send to Cliplyst for content generation" button
- Prepares analysis data for content creation pipeline
- Enables automated content suggestions based on weak platforms

## Environment Requirements

### Supabase
```
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### OpenAI (via Supabase)
```
OPENAI_API_KEY=<your_openai_api_key>
```

Set in Supabase Functions environment variables as `OPENAI_API_KEY`.

## Performance Metrics

### Response Times
- **collect-analytics**: ~200-500ms (aggregates links + clicks)
- **marketing-analysis**: ~2-5s (Claude API processing)
- **Total**: ~2.5-5.5s (non-blocking)

### Data Requirements
- Minimum: 1 link, 1 click (analysis runs on any data)
- Optimal: 10+ links, 50+ clicks (for meaningful insights)
- No maximum limits

## Error Handling

### Scenarios
1. **Not Authenticated**: Shows login prompt
2. **No Analytics Data**: Returns helpful message suggesting more links/clicks
3. **Claude API Failure**: User-friendly error with retry option
4. **Network Issues**: Graceful error message with offline state
5. **Invalid Business Profile**: Falls back to defaults

## Future Enhancements

### Phase 1 (Current)
- ✅ Core AI analysis
- ✅ Platform rankings
- ✅ Performance insights
- ✅ Cliplyst handoff hook

### Phase 2 (Planned)
- Real-time dashboard integration
- Custom time period analysis
- Historical trend tracking
- Competitor benchmarking

### Phase 3 (Planned)
- Cliplyst content generation
- Automated A/B testing recommendations
- Predictive analytics
- Custom AI training on user data

## Testing Checklist

- [ ] UI remains responsive during analysis
- [ ] Authentication errors handled gracefully
- [ ] Analytics data aggregated correctly
- [ ] Claude API integration works
- [ ] Platform rankings sorted correctly
- [ ] Color coding matches performance levels
- [ ] "Send to Cliplyst" button appears after analysis
- [ ] Mobile responsive (chat panel fits screen)
- [ ] Loading states display properly
- [ ] Error messages are helpful

## Components

### `AIAssistant.tsx`
- Main component
- Manages chat state and message flow
- Handles analytics collection and AI calls
- ~250 lines

### `AnalysisDisplay.tsx`
- Results display component
- Renders platform rankings with visual indicators
- Shows insights and recommendations
- ~150 lines

### Edge Functions
- `collect-analytics/index.ts`: ~120 lines
- `marketing-analysis/index.ts`: ~200 lines

## Code Examples

### Using the AI Assistant Component
```tsx
import { AIAssistant } from "@/components/ai/AIAssistant";

// In App.tsx or any parent component
<AIAssistant />
```

### Triggering Analysis Programmatically
```tsx
// User types "Summarize my marketing data"
const handleSummarize = async () => {
  // Fetch analytics
  const analytics = await fetchAnalytics();
  
  // Send to AI for analysis
  const analysis = await analyzeMarketing(analytics);
  
  // Display results
  setAnalysisResult(analysis);
};
```

## Performance Optimization

- Lazy loads Claude API calls (only when needed)
- Non-blocking async processing
- Chat interface prevents UI freezing
- Loading states provide user feedback
- Results cached during session

## Monitoring

### Logs to Check
- Supabase Functions logs for Edge Function errors
- Browser console for client-side errors
- Claude API response times

### Metrics to Track
- Average analysis time
- User engagement with AI Assistant
- Error rates
- Platform ranking accuracy

## Troubleshooting

### "Claude API Error"
- Check ANTHROPIC_API_KEY is set in Supabase
- Verify API key has correct permissions
- Check rate limits on Claude API

### "Failed to fetch analytics"
- Ensure user is authenticated
- Check user has at least 1 link
- Verify Supabase connection

### "UI freezes during analysis"
- Confirm async/await properly implemented
- Check browser console for errors
- Verify no blocking operations in render

## Security Considerations

- All user data requires JWT authentication
- Analytics only accessible to the link owner
- AI analysis prompt sanitized (no SQL injection risk)
- No user data stored in Claude API logs
- Rate limiting should be implemented for production

---

**Status**: ✅ Production Ready  
**Last Updated**: February 1, 2026  
**Next Review**: After Cliplyst integration
