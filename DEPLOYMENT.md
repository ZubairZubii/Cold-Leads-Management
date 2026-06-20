# Deployment Checklist

Complete this checklist to deploy your Lead Automation System to production.

## Pre-Deployment (Local Testing)

- [ ] Run `pnpm dev`
- [ ] Access http://localhost:3000
- [ ] Click "Login with Google"
- [ ] Authorize the app
- [ ] Upload SAMPLE_LEADS.json
- [ ] Verify emails appear in Gmail sent folder
- [ ] Check Google Sheet is populated
- [ ] Confirm results show in dashboard

## Git Setup

- [ ] Initialize git: `git init`
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit: Lead automation system"`
- [ ] Create GitHub repo
- [ ] Add remote: `git remote add origin https://github.com/YOUR_USER/REPO.git`
- [ ] Push: `git push -u origin main`

## Vercel Deployment

### Step 1: Connect to Vercel

- [ ] Go to https://vercel.com
- [ ] Click "Add New..." → "Project"
- [ ] Select "Import Git Repository"
- [ ] Paste your GitHub repo URL
- [ ] Click "Import"

### Step 2: Configure Environment Variables

In Vercel project settings, add these environment variables:

```
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_SHEET_ID=your_google_sheet_id
NEXT_PUBLIC_SHEET_ID=your_google_sheet_id
GOOGLE_REFRESH_TOKEN=get_this_after_first_login
CRON_SECRET=generate_a_random_secret_string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Steps:**
1. [ ] Go to Project Settings
2. [ ] Click "Environment Variables"
3. [ ] Add each variable above
4. [ ] Value: Paste the value
5. [ ] Click "Save"

### Step 3: Deploy

- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Verify deployment successful (should see live URL)

## Post-Deployment Verification

- [ ] Visit your Vercel URL
- [ ] Click "Login with Google"
- [ ] Upload test leads
- [ ] Verify emails sent from Gmail
- [ ] Check Google Sheet updated
- [ ] Review dashboard results

## Configure Cron Jobs

Vercel automatically reads `vercel.json` for cron configuration.

**Verify cron is set:**
1. [ ] Go to Vercel project settings
2. [ ] Look for "Cron Jobs" section
3. [ ] Should show daily job at 9 AM UTC
4. [ ] Status should be "Active"

**Test cron manually:**
```bash
# In your local terminal
curl -X POST "https://YOUR_VERCEL_URL/api/workflows/followup" \
  -H "Content-Type: application/json" \
  -d '{
    "daysAgo": 3,
    "followupType": "3day"
  }'
```

## Domain Setup (Optional)

If you want a custom domain:

1. [ ] Go to Vercel project settings
2. [ ] Click "Domains"
3. [ ] Add your domain (e.g., leads.yourdomain.com)
4. [ ] Follow DNS instructions
5. [ ] Wait for verification (usually 24 hours)

## Monitoring Setup

### Enable Vercel Analytics

- [ ] Go to project settings
- [ ] Enable "Analytics"
- [ ] Track page performance

### Set Up Error Monitoring

- [ ] Go to project settings
- [ ] Click "Integrations"
- [ ] Add Sentry for error tracking
- [ ] Get Sentry DSN
- [ ] Add to environment variables if needed

### View Logs

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# View project logs
vercel logs --follow

# View specific project
vercel logs --project=YOUR_PROJECT_ID
```

## Production Checklist

- [ ] SSL certificate enabled (automatic on Vercel)
- [ ] HTTPS working
- [ ] OAuth redirect URL updated in Google Cloud:
  - Go to Google Cloud Console
  - OAuth 2.0 Credentials
  - Add: `https://YOUR_VERCEL_URL/api/auth/callback`
  - Save
- [ ] Email templates tested
- [ ] First lead batch ready to upload
- [ ] Google Sheet accessible
- [ ] Team notified of system ready

## Daily Operations

### Every Morning

- [ ] Prepare JSON with 100 leads
- [ ] Upload to dashboard: `https://YOUR_VERCEL_URL`
- [ ] Verify email count in results
- [ ] Spot check Google Sheet
- [ ] Done! ✅

### Weekly

- [ ] Check Google Sheet for responses
- [ ] Review qualification scores
- [ ] Monitor email deliverability
- [ ] Check Vercel analytics

### Monthly

- [ ] Review API usage (Gemini, Gmail)
- [ ] Adjust qualification criteria if needed
- [ ] Review email performance
- [ ] Plan optimizations

## Troubleshooting Deployment

### Build Fails

- [ ] Check Node version (should be 18+)
- [ ] Verify all dependencies in package.json
- [ ] Run `pnpm install` locally, test build
- [ ] Check for environment variable issues

### OAuth Not Working

- [ ] Verify redirect URL in Google Cloud Console
- [ ] Matches exactly: `https://YOUR_VERCEL_URL/api/auth/callback`
- [ ] OAuth credentials correct in env vars
- [ ] Browser cookies not blocked

### Emails Not Sending

- [ ] Check Gemini API limit not exceeded
- [ ] Verify Gmail API enabled in Google Cloud
- [ ] Check email format in JSON
- [ ] Review error logs in Vercel

### Cron Jobs Not Running

- [ ] Verify `vercel.json` exists in root
- [ ] Check cron schedule syntax
- [ ] Redeploy after adding/changing `vercel.json`
- [ ] Check Vercel logs for errors

## Rollback Procedure

If something goes wrong:

```bash
# View deployment history
vercel deployments

# Rollback to previous deployment
vercel rollback
```

## Success Metrics

After deployment, track these:

- [ ] Daily lead uploads: 100+
- [ ] Email send rate: 40-60% (qualification rate)
- [ ] Follow-up emails: Automated day 3 & 7
- [ ] Response rate: Monitor in Google Sheet
- [ ] System uptime: Should be 99.9%+

## Scaling Up

When you're ready to scale:

### Increase API Limits

**Gemini API:**
1. Go to Google Cloud Console
2. Click "Quotas & System Limits"
3. Request increase (currently 10 calls/min)
4. Upgrade to paid tier if needed

**Gmail API:**
1. Upgrade to Google Workspace
2. Get higher API quota
3. Can send 1000+ emails/day

### Database Option (Future)

When ready to add persistence:
- [ ] Set up Neon PostgreSQL
- [ ] Create leads table
- [ ] Save processing history
- [ ] Track campaign performance

## Security Checklist

- [ ] No secrets in code (all in env vars)
- [ ] OAuth tokens stored securely
- [ ] HTTPS only (automatic on Vercel)
- [ ] Environment variables not logged
- [ ] Regular backups of Google Sheet
- [ ] Audit logs enabled

## Final Verification

- [ ] Dashboard loads
- [ ] Login works
- [ ] JSON upload works
- [ ] Emails send
- [ ] Sheet updates
- [ ] Follow-ups schedule
- [ ] Errors handled gracefully
- [ ] No console errors

## Congratulations! 🎉

Your production lead automation system is deployed and running!

**What's happening now:**
- Leads being qualified automatically
- Emails being sent from your Gmail
- Activity tracked in Google Sheet
- Follow-ups scheduling for day 3 & 7
- System running 24/7

**Next:** Start uploading 100 leads daily and watch your outreach scale!

---

**Need help?** Check the logs with `vercel logs --follow`
