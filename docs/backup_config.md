# AI Academy Pro — Environment & Configuration Audit

## Environment Variables (.env.local)

| Key | Purpose | Value (obfuscated) |
|-----|---------|-------------------|
| `DATABASE_URL` | AWS RDS PostgreSQL connection string | `postgresql://postgres:****@ai-academy-db.*****.eu-north-1.rds.amazonaws.com:5432/postgres?sslmode=require` |
| `AUTH_SECRET` | NextAuth JWT signing secret | `cd34b***...***fc5a` (64-char hex) |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | `676542535210-*****.apps.googleusercontent.com` |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | `GOCSPX-****` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Support WhatsApp number | `9535761292` |
| `GEMINI_API_KEY` | Google Gemini 1.5 Flash API key | `AIzaSy****` |
| `GOOGLE_CLOUD_VISION_API_KEY` | Google Cloud Vision OCR key | `AIzaSy****` |
| `MARKING_RUBRIC` | Pilot marking rubric string | `Pilot: partial credit...` |
| `DIGEST_CRON_TOKEN` | Scheduler auth for daily digest | `local-dev-****` |
| `DEV_MASTER_SIGNIN_EMAIL` | Dev-only fallback sign-in | `pilot-owner-a@local.test` |
| `FOUNDER_EMAIL` | Super Admin email for /admin access | `rajeshpandi.innovative@gmail.com` |
| `NEXT_PUBLIC_API_MODE` | Ghost Mode toggle (mock/live) | `mock` |

## Google Cloud IAM Roles in Use

| Service | IAM Role Required | Scope |
|---------|-------------------|-------|
| **Cloud Vision API** (OCR) | `roles/cloudvision.user` | Handwriting OCR, paper scan processing |
| **Generative Language API** (Gemini) | `roles/aiplatform.user` | Quiz generation, notes generation, Vedic chat, homework helper |
| **Cloud Vision API** (Image Analysis) | `roles/cloudvision.user` | Image-based question analysis in scan-paper |

## API Key vs Service Account

Currently using **API Keys** (not service account JSON):
- `GEMINI_API_KEY` — used for all Generative AI calls (Gemini 1.5 Flash)
- `GOOGLE_CLOUD_VISION_API_KEY` — used for OCR document processing

No service account JSON file is present in the repository. All Google Cloud authentication is via API keys embedded in environment variables.

## Critical Notes for Post-Restructuring

1. **DATABASE_URL** — If the RDS instance is replaced or resized, update the host endpoint
2. **AUTH_SECRET** — Must remain the same or all existing sessions will be invalidated
3. **AUTH_GOOGLE_ID/SECRET** — Tied to the Google Cloud Console OAuth consent screen; update redirect URIs if domain changes
4. **FOUNDER_EMAIL** — Controls who can access `/admin` routes; verify this matches the new Super Admin row in `platform_users`
5. **NEXT_PUBLIC_API_MODE** — Set to `live` for production; `mock` disables all billable API calls
