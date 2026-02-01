# AI Marketing Assistant - Deployment Guide

## Pre-Deployment Checklist

### Environment Setup
- [ ] OpenAI API key obtained from [https://platform.openai.com](https://platform.openai.com)
- [ ] API key added to Supabase project secrets as `OPENAI_API_KEY`
- [ ] Supabase Edge Functions enabled
- [ ] Business profile migration deployed (`business_identity.sql`)
- [ ] Short links system deployed

### Code Review
- [ ] All TypeScript errors resolved
- [ ] Build passes: `npm run build`
- [ ] No console warnings
- [ ] Components render without errors

### Testing
- [ ] Floating button appears on all pages
- [ ] Chat panel opens/closes smoothly
- [ ] "Summarize my marketing data" command works
- [ ] Analytics data aggregates correctly
- [ ] OpenAI returns valid JSON
- [ ] Platform rankings display properly
- [ ] Error handling works gracefully

## Deployment Steps

### Step 1: Deploy Edge Functions

```bash
# Navigate to Supabase project
cd supabase

# Deploy collect-analytics function
supabase functions deploy collect-analytics --project-ref <YOUR_PROJECT_ID>

# Deploy marketing-analysis function
supabase functions deploy marketing-analysis --project-ref <YOUR_PROJECT_ID>
```

### Step 2: Configure Environment Variables

In Supabase Dashboard → Edge Functions → Settings:

```
OPENAI_API_KEY=sk-... (store securely in project secrets)
```

### Step 3: Deploy Frontend

```bash
# Build and deploy
npm run build

# If using Render.yaml (configured in project)
git push  # Will trigger automatic deployment

# Or manual deployment
npm run build
# Upload dist/ to your hosting provider
```

### Step 4: Verify Deployment

```bash
# Test collect-analytics endpoint
curl -X GET https://<your-instance>.supabase.co/functions/v1/collect-analytics \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json"

# Test marketing-analysis endpoint
curl -X POST https://<your-instance>.supabase.co/functions/v1/marketing-analysis \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Business",
    "businessNiche": "Marketing",
    "totalLinks": 5,
    "totalClicks": 25,
    "platformBreakdown": {
      "Instagram": {"clicks": 15, "links": 2, "ctr": 0.75},
      "TikTok": {"clicks": 10, "links": 3, "ctr": 0.33}
    },
    "timeRange": "Last 30 days",
    "topPerformers": [
      {"title": "Test", "url": "https://test.com", "clicks": 15, "platform": "Instagram"}
    ],
    "underperformers": [],
    "averageCtr": 0.5
  }'
```

## Post-Deployment Testing

### User Flow Test
1. Login to Lynkscope
2. Click floating AI button (bottom-right)
3. Type "Summarize my marketing data"
4. Wait for analysis (should take 2-5 seconds)
5. Review platform rankings
6. Click "Send this data to Cliplyst for content generation"
7. Verify no UI freezing or errors

### Performance Test
```bash
# Monitor response times in browser DevTools
# Network tab should show:
# - collect-analytics: ~300-500ms
# - marketing-analysis: ~2-5s total
```

### Error Recovery Test
1. Turn off internet → should show graceful error
2. Test with user having no links → should show helpful message
3. Test with invalid business profile → should use defaults

## Rollback Procedure

If issues arise:

### Quick Rollback
```bash
# Disable Edge Functions
supabase functions delete collect-analytics --project-ref <YOUR_PROJECT_ID>
supabase functions delete marketing-analysis --project-ref <YOUR_PROJECT_ID>

# Or revert to previous frontend build
git revert <commit-hash>
npm run build
# Redeploy
```

### Partial Rollback
If only frontend has issues:
```bash
# Keep Edge Functions running
# Deploy previous working build
git checkout <previous-commit> -- src/components/ai
npm run build
# Redeploy frontend
```

## Monitoring & Debugging

### Edge Function Logs
```bash
# View logs in Supabase Dashboard
# Functions → [function-name] → Logs

# Or via CLI
supabase functions logs collect-analytics --project-ref <YOUR_PROJECT_ID>
supabase functions logs marketing-analysis --project-ref <YOUR_PROJECT_ID>
```

### Common Issues & Solutions

#### 1. "ANTHROPIC_API_KEY not configured"
- **Problem**: Edge Function can't access API key
- **Solution**: 
  ```bash
  # Set secret in Supabase
  supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
  # Or in Dashboard: Project Settings → Secrets
  ```

#### 2. "Failed to fetch analytics"
- **Problem**: collect-analytics endpoint returning 401
- **Solution**:
  - Verify user is authenticated (check JWT token)
  - Ensure user has at least 1 link
  - Check Supabase RLS policies on links table

#### 3. "Claude API failed"
- **Problem**: marketing-analysis returning 500 error
- **Solution**:
  - Check API key is valid (test at https://platform.openai.com)
  - Verify model name is correct for your OpenAI plan (e.g. `gpt-4o-mini`)
  - Check rate limits haven't been exceeded
  - Review Edge Function logs for specific error

#### 4. UI freezes during analysis
- **Problem**: Chat panel becomes unresponsive
- **Solution**:
  - Ensure async/await is properly implemented
  - Check for missing try/catch blocks
  - Verify setTimeout is not blocking
  - Profile with React DevTools

#### 5. Platform rankings don't display
- **Problem**: AnalysisDisplay component not rendering
- **Solution**:
  - Verify API returns valid JSON structure
  - Check console for parsing errors
  - Ensure all required fields present in response

## Performance Optimization

### For Production

1. **Add caching** (Redis/Supabase)
   ```typescript
   // Cache analytics for 1 hour per user
   const cacheKey = `analytics:${userId}`;
   // Check cache before calling collect-analytics
   ```

2. **Implement rate limiting**
   ```typescript
   // Allow 1 analysis per user per 5 minutes
   // Prevent abuse of Claude API
   ```

3. **Add request timeout**
   ```typescript
   // Fail gracefully if Claude API takes >10s
   const timeout = setTimeout(() => {
     throw new Error('Analysis timed out');
   }, 10000);
   ```

4. **Monitor costs**
   - Claude API charges ~$0.003 per 1K input tokens
   - Average analysis: ~500 input tokens
   - **Cost per analysis**: ~$0.0015
   - Track usage in Supabase Vault

## Security Checklist

- [ ] API key stored in Supabase secrets (not in code)
- [ ] JWT validation enforced on all endpoints
- [ ] User data isolation verified (can't access other users' data)
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Rate limiting implemented
- [ ] Error messages don't expose sensitive data
- [ ] HTTPS enforced
- [ ] CORS headers properly configured

## Maintenance Tasks

### Weekly
- [ ] Monitor Edge Function error rates
- [ ] Check Claude API usage costs
- [ ] Review user feedback on AI insights

### Monthly
- [ ] Analyze performance metrics
- [ ] Update documentation if needed
- [ ] Review Claude API pricing changes
- [ ] Check for new features/models

### Quarterly
- [ ] Audit AI recommendations accuracy
- [ ] Optimize prompts based on user feedback
- [ ] Plan Phase 2 enhancements
- [ ] Update deployment procedures

## Feedback & Iteration

### Collecting User Feedback
- Add "Was this helpful?" buttons in chat
- Track which recommendations users implement
- Monitor platform ranking accuracy

### Iterating on AI Analysis
- Adjust Claude prompt based on user feedback
- Add new metrics to analysis
- Refine performance thresholds (what = excellent/good/fair/poor)
- Expand platform types and categories

## Future Considerations

### Planned Features
1. **Real-time Updates**: Stream analysis results as Claude processes
2. **Historical Trends**: Compare analyses over time
3. **Custom Time Periods**: Not just "last 30 days"
4. **Competitor Benchmarking**: Compare against industry averages
5. **A/B Testing Suggestions**: Recommend experiments

### Infrastructure Scaling
- Currently handles any user volume (stateless functions)
- Consider caching layer if analysis requests spike
- Monitor Claude API rate limits
- Implement request queuing if needed

## Support & Escalation

### If Users Report Issues
1. Check Edge Function logs for errors
2. Verify user authentication
3. Test with dev account to reproduce
4. Check Claude API status
5. Review Supabase status page
6. Escalate to infrastructure team if needed

### Contacting Support
- **Supabase**: https://supabase.com/support
- **Anthropic**: https://www.anthropic.com/support
- **Internal**: Tag @devops in Slack

---

## Deployment Checklist Summary

```
Pre-Deployment:
  ✅ Environment variables set
  ✅ API keys obtained
  ✅ Code reviewed and tested
  ✅ Build passes

Deployment:
  ✅ Edge Functions deployed
  ✅ Secrets configured
  ✅ Frontend built and deployed
  ✅ DNS updated if needed

Post-Deployment:
  ✅ Endpoints tested
  ✅ User flow verified
  ✅ Performance acceptable
  ✅ Error handling works
  ✅ Logs monitored
  ✅ Costs tracked

Go Live:
  ✅ Full feature testing
  ✅ Team trained
  ✅ Documentation updated
  ✅ Support ready
```

**Deployment Status**: Ready for Production  
**Estimated Deployment Time**: 30 minutes  
**Rollback Time**: 5 minutes  
**Support Contact**: On-call engineering team
