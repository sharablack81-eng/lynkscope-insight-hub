# Cliplyst Module Setup

Cliplyst is a fully integrated content studio module inside Lynkscope. It provides video upload, AI trend discovery, caption/hashtag generation, and content scheduling.

## Database Tables

All tables are prefixed with `cliplyst_` and live in the `public` schema.

| Table | Purpose |
|-------|---------|
| `cliplyst_platforms` | Reference table of supported social platforms (seeded) |
| `cliplyst_videos` | Source videos uploaded by users |
| `cliplyst_clips` | Generated clips from source videos |
| `cliplyst_trends` | AI-discovered trending topics by niche |
| `cliplyst_captions` | AI-generated captions with hashtags and SEO scores |
| `cliplyst_schedules` | Buffer-style scheduled posts |

## RLS Policies

All user-facing tables enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE.

- `cliplyst_platforms` — READ-ONLY for all authenticated users (reference data)
- Storage bucket `cliplyst-media` — users can only manage files in their own folder (`{user_id}/...`)

## Edge Functions

| Function | Purpose |
|----------|---------|
| `cliplyst-fetch-trends` | AI-powered trend scraping by niche and platform |
| `cliplyst-generate-captions` | AI caption + hashtag generation with SEO scoring |
| `cliplyst-session` | Legacy iframe session management (kept for backward compat) |
| `cliplyst-sync` | Marketing intelligence transfer |

## Triggers & Functions

- `cliplyst_update_updated_at()` — trigger function for auto-updating `updated_at` on videos, clips, and schedules
- `cliplyst_calculate_trend_score(engagement, velocity, relevance)` — weighted score formula

## Storage

- **Bucket**: `cliplyst-media` (private, 20MB limit)
- **Allowed types**: video/mp4, video/webm, video/quicktime, image/jpeg, image/png, image/webp
- Files stored as `{user_id}/{timestamp}_{filename}`

## Frontend Structure

```
src/modules/cliplyst/
├── components/
│   ├── CliplystUpload.tsx      # Video upload form + list
│   ├── CliplystTrends.tsx      # Trend discovery + selection
│   ├── CliplystCaptions.tsx    # Caption generator + list
│   └── CliplystScheduler.tsx   # Post scheduling
├── hooks/
│   ├── useCliplystVideos.ts
│   ├── useCliplystTrends.ts
│   ├── useCliplystCaptions.ts
│   └── useCliplystSchedules.ts
└── pages/
    └── CliplystDashboard.tsx   # Tab-based dashboard
```

## Routes

- `/cliplyst` — Main Cliplyst dashboard (protected, inside DashboardLayout)

## Environment Variables

Cliplyst uses existing Lynkscope environment variables:
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — for edge functions
- `LOVABLE_API_KEY` — for AI caption/trend generation (auto-configured)

Legacy variables (kept for backward compatibility):
- `JWT_SECRET` — used by cliplyst-session
- `LYNKSCOPE_INTERNAL_KEY` — internal auth between services
- `CLIPLYST_API_URL` — external Cliplyst render app URL

## Seeded Data

The `cliplyst_platforms` table is pre-populated with:
- TikTok (180s, 9:16)
- Instagram Reels (90s, 9:16)
- YouTube Shorts (60s, 9:16)
- YouTube (600s, 16:9)
- Facebook Reels (90s, 9:16)
- X / Twitter (140s, 16:9)
