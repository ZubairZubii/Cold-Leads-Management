# Lead Automation System - Setup & Usage Guide

Welcome to your AI-powered lead automation system! This guide will help you set up, use, and deploy the system.

## What This System Does

1. **Accepts daily lead uploads** in a standardized JSON format
2. **Qualifies leads** using Google Gemini AI based on titles and industry
3. **Sends personalized emails** from your Gmail account
4. **Tracks activity** in a Google Sheet automatically
5. **Sends follow-ups** automatically after 3 days and 1 week
6. **Works 100% on free tier** - Gmail API, Gemini API, Google Sheets

## Setup Instructions

### Already Configured

The system has been set up with your credentials:
- **Gmail:** zubair@devtorque.co
- **Gemini API:** Connected
- **Google Sheet:** Lead Tracking (1ax0P08vRwT0G3y3BSaoXBP0YWl24jmqxJRMWmk1LMYA)

### Environment Variables

All credentials are stored in `.env.local`:
```
GEMINI_API_KEY=Your Gemini API key
GOOGLE_SHEET_ID=Your sheet ID
GMAIL_USER_EMAIL=zubair@devtorque.co
GOOGLE_CLIENT_ID=Your OAuth client ID
GOOGLE_CLIENT_SECRET=Your OAuth client secret
GOOGLE_PROJECT_ID=Your Google project ID
```

## How to Use

### Step 1: Login

1. Go to http://localhost:3000 (or your deployed URL)
2. Click "Login with Google"
3. Authorize the application to access Gmail and Sheets
4. You'll be redirected to the dashboard

### Step 2: Format Your Leads

Prepare your leads in this exact JSON format:

```json
{
  "leads": [
    {
      "name": "Graham Wood",
      "first_name": "Graham",
      "email": "graham@shopik.io",
      "title": "CEO",
      "company": "Shopik",
      "industry": "IT Services",
      "location": "United States"
    },
    {
      "name": "Brian Murphy",
      "first_name": "Brian",
      "email": "brian@murphconsulting.com",
      "title": "Founder",
      "company": "Murph Consulting",
      "industry": "Automation Expert",
      "location": "New York"
    }
  ]
}
```

**Required Fields:**
- `name` - Full name
- `first_name` - First name (for personalization)
- `email` - Email address
- `title` - Job title
- `company` - Company name
- `industry` - Industry (see supported industries below)
- `location` - Location/City

**Supported Industries:**
- IT Services
- Automation Expert
- Voice Agents
- n8n
- Make
- Zapier
- No-Code
- Marketing & Advertising
- Technology

### Step 3: Upload & Process

1. Paste your JSON in the text area
2. Click "Process & Send Emails"
3. The system will:
   - Qualify each lead based on title and industry
   - Send personalized emails to qualified leads only
   - Log everything to your Google Sheet
   - Show results in real-time

### Step 4: Review Results

The dashboard shows:
- **Total Leads** - How many leads you uploaded
- **Qualified & Sent** - How many qualified and received emails
- **Not Qualified** - Leads that didn't meet criteria
- **Failed** - Any processing errors
- **Detailed Results** - Line-by-line breakdown

### Step 5: Automatic Follow-ups

The system automatically sends follow-ups:
- **Day 3:** Follow-up email reminding them
- **Day 7:** Final follow-up message
- **Tracking:** All activity logged in Google Sheet

## Email Template

The system sends personalized emails in this format:

**Subject:** `Graham, saving time with lead automation at Shopik`

**Body:**
```
Hi Graham,

I noticed Shopik is in the space, and I thought this could be interesting for you.

[Industry-specific pain point]

[Personalized hook based on their industry]

Would love to explore if this is relevant for you. Let me know if you're open to a quick 15min chat.

---
Zubair Malik
Founder @ DevTorque
Automation Expert | Voice Agents, n8n, Make, Zapier, No-Code
zubair@devtorque.co
```

**Day 3 Follow-up:**
- Friendly reminder
- Mentions previous message
- Same call to action

**Day 7 Follow-up:**
- Final message
- Professional close
- Respectful if no reply

## Google Sheet Tracking

Your Google Sheet is automatically populated with:
- **Name** - Lead name
- **Email** - Lead email
- **Title** - Job title
- **Company** - Company name
- **Industry** - Industry
- **Location** - Location
- **Qualification Score** - AI qualification score (0-100)
- **Status** - initial_sent, followup_3day_sent, followup_7day_sent, replied
- **Sent Date** - When initial email was sent
- **Last Activity** - Latest activity timestamp
- **Notes** - Reasoning and scores

## Daily Workflow

Here's your daily process:

1. **Morning:** Prepare 100 leads in the standardized JSON format
2. **Upload:** Paste JSON in dashboard and click "Process & Send Emails"
3. **Sit back:** System automatically:
   - Qualifies leads
   - Sends personalized emails
   - Logs to sheet
   - Schedules follow-ups
4. **Day 3:** Automatic follow-up emails sent
5. **Day 7:** Automatic final follow-up emails sent
6. **Track:** Check Google Sheet for replies and engagement

## Deployment to Vercel

### Step 1: Connect GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repo
4. Add environment variables:
   - `GEMINI_API_KEY`
   - `GOOGLE_SHEET_ID`
   - `GMAIL_USER_EMAIL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_PROJECT_ID`
5. Click "Deploy"

### Step 3: Set Up Cron Jobs

Vercel automatically runs the follow-up workflow daily at 9 AM (UTC) via `vercel.json`.

## Troubleshooting

### "Not authenticated. Please login first."

**Fix:** Click "Login with Google" and go through OAuth flow

### "Missing required fields"

**Fix:** Ensure all 7 fields (name, first_name, email, title, company, industry, location) are in your JSON

### "Invalid JSON format"

**Fix:** Check JSON syntax. Use a JSON validator at jsonlint.com

### Emails not sending

**Check:**
1. Gmail quota (Gemini free tier: ~100 calls/day)
2. Email syntax (must be valid)
3. Gmail API enabled in Google Cloud Console
4. Proper OAuth authorization

### Leads not qualified

**Why:**
- Title doesn't match decision-maker keywords (founder, CEO, CTO, VP, etc.)
- Industry not in supported list
- Score too low (<30)

**Fix:** Review qualification score in results, adjust if needed

## Support & Monitoring

### Check Email Log

All sent emails are logged with timestamps in Google Sheet

### Monitor API Usage

- **Gemini API:** ~1 call per lead (free tier limit: 10 calls/min)
- **Gmail API:** ~1 send per lead (free tier: 100/day)
- **Sheets API:** ~1 write per lead (unlimited)

### Debug Console

Check server logs for errors:
```bash
# Local development
pnpm dev

# Vercel logs
vercel logs --follow
```

## Best Practices

1. **Start small:** Test with 10 leads first
2. **Verify email quality:** Ensure emails are valid before uploading
3. **Vary industries:** Helps with qualification accuracy
4. **Check responses:** Monitor sheet for replies and engagement
5. **Maintain titles:** Use exact job titles when possible
6. **Daily consistency:** Upload same time each day for tracking

## Advanced Customization

### Change Follow-up Timing

Edit `/app/api/workflows/followup/route.ts`:
```typescript
// Change days for follow-up
const followupDays = [3, 7, 14]; // Add 2-week follow-up
```

### Add New Industries

Edit `/lib/gemini-service.ts`:
```typescript
const INDUSTRY_CONTENT = {
  "Your Industry": {
    painPoint: "Their problem",
    hook: "Your solution"
  }
};
```

### Modify Email Template

Edit `/lib/gmail-service.ts` `generateEmailHTML()` function

## API Endpoints

- `POST /api/auth/callback` - OAuth callback
- `POST /api/leads/process` - Process and send emails
- `POST /api/workflows/followup` - Send follow-up emails (auto-triggered)

## Security

- OAuth tokens stored in HTTP-only cookies
- No lead data stored in backend
- All processing via secure APIs
- HTTPS only on production

## FAQ

**Q: Can I use a different email?**
A: Yes, change `GMAIL_USER_EMAIL` and re-authorize OAuth

**Q: What's the daily lead limit?**
A: ~100 leads (limited by Gemini free tier API)

**Q: Do I need to manage follow-ups manually?**
A: No, they're completely automated after daily upload

**Q: Can I pause the automation?**
A: Just stop uploading leads

**Q: How long does processing take?**
A: ~2-3 seconds per lead

**Q: Are responses tracked automatically?**
A: Not yet - manual review of sheet recommended

## Next Steps

1. Test with 5-10 leads
2. Verify emails look good
3. Check Google Sheet is updating
4. Deploy to Vercel
5. Upload 100 leads daily
6. Monitor responses in sheet

---

For questions or issues, check the logs or contact support.

Happy automating! 🚀
