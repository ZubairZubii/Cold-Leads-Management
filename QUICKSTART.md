# Lead Automation System - Quick Start (5 Minutes)

## What You Have

A complete AI-powered lead automation system that:
- Qualifies leads using Google Gemini AI
- Sends personalized emails from your Gmail
- Automatically sends follow-ups (day 3 & day 7)
- Tracks everything in a Google Sheet
- **100% FREE** (uses free tier APIs)

## Your Daily Workflow (30 seconds per day)

### 1. Prepare Leads (You do this)
Format your 100 leads as JSON:

```json
{
  "leads": [
    {
      "name": "John Doe",
      "first_name": "John",
      "email": "john@company.com",
      "title": "CEO",
      "company": "Company Inc",
      "industry": "IT Services",
      "location": "New York"
    }
  ]
}
```

### 2. Upload to Dashboard (You do this - 30 seconds)
1. Go to your dashboard
2. Paste JSON
3. Click "Process & Send Emails"
4. Done! ✅

### 3. System Handles Everything
- ✅ Qualifies leads with AI
- ✅ Sends personalized emails
- ✅ Logs to Google Sheet
- ✅ Schedules follow-ups automatically
- ✅ Sends follow-up day 3
- ✅ Sends follow-up day 7

## The Email Your Leads Receive

**Subject:** `John, saving time with lead automation at Company Inc`

**Body:**
```
Hi John,

I noticed Company Inc is in the space, and I thought this could be interesting for you.

[Pain point specific to IT Services]

I help IT services companies capture and qualify inbound leads instantly, so you close deals before the competition even responds.

Would love to explore if this is relevant for you. Let me know if you're open to a quick 15min chat.

---
Zubair Malik
Founder @ DevTorque
Automation Expert | Voice Agents, n8n, Make, Zapier, No-Code
zubair@devtorque.co
```

## Supported Industries (Use These)

1. IT Services
2. Automation Expert
3. Voice Agents
4. n8n
5. Make
6. Zapier
7. No-Code
8. Marketing & Advertising
9. Technology

## What Gets Logged to Google Sheet

Every lead that gets emailed is automatically logged with:
- Name, email, title, company
- Industry, location
- Qualification score
- Status (initial_sent, followup_3day_sent, etc.)
- Dates & timestamps
- Notes

## JSON Format (Copy This Template)

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

## How Qualification Works

A lead qualifies if they have:
1. ✅ Decision-maker title (Founder, CEO, CTO, VP, President, Director, etc.)
2. ✅ Valid email address
3. ✅ Industry that matches our offering

**Not qualified if:**
- ❌ Title is too junior (Intern, Coordinator, Support, etc.)
- ❌ Email looks invalid
- ❌ Doesn't match any supported industry

## What Happens Day by Day

**Day 1 (You upload leads)**
- Upload 100 leads
- Qualified leads get initial emails
- System logs to sheet

**Day 3**
- System automatically sends follow-up email 1
- Still no action from you

**Day 7**
- System automatically sends follow-up email 2
- Still no action from you

**Meanwhile**
- You keep uploading 100 leads daily
- Each batch runs through the same process
- You have 100s of emails going out daily
- All tracked in one sheet

## Setup Checklist

- [x] Gmail connected
- [x] Gemini API configured
- [x] Google Sheet created
- [x] OAuth credentials set up
- [x] Dashboard ready
- [x] Email template personalized

## To Deploy (Production)

1. Push code to GitHub
2. Go to vercel.com
3. Import repo
4. Add 6 environment variables
5. Click Deploy
6. Done - your system is live

Automatic cron jobs will handle follow-ups!

## Troubleshooting

**Leads not qualifying:**
- Check title (must be decision-maker)
- Check industry (must be in supported list)

**Emails not sending:**
- Verify Gmail auth
- Check email format
- See detailed error in results

**Nothing happening:**
- Click "Login with Google"
- Authorize app access
- Try again

## FAQ

**Q: Can I upload more/less than 100 leads?**
A: Yes, any number. 100 is just a suggested daily volume.

**Q: What if a lead replies?**
A: Manual process - check sheet, reply directly, update notes.

**Q: Can I change the email template?**
A: Yes, edit SETUP.md section "Advanced Customization"

**Q: How much does this cost?**
A: Nothing! 100% free tier.

**Q: Can I use different email?**
A: Yes, change GMAIL_USER_EMAIL and reauth.

**Q: What's the best time to upload?**
A: Morning (8-9 AM) so emails go out fresh.

## Key Files

- `SETUP.md` - Full documentation
- `/components/LeadAutomationDashboard.tsx` - Main UI
- `/lib/gemini-service.ts` - AI qualification
- `/lib/gmail-service.ts` - Email sending
- `/lib/sheets-service.ts` - Google Sheets tracking
- `/app/api/leads/process/route.ts` - Lead processing
- `/app/api/workflows/followup/route.ts` - Auto follow-ups

## Next Steps

1. **Test:** Upload 5 test leads (make sure title = CEO/Founder)
2. **Verify:** Check Gmail shows emails sent
3. **Track:** Check Google Sheet auto-populated
4. **Scale:** Upload 100 leads daily

That's it! You're ready to automate your lead outreach.

---

**Your system is ready to go. Start uploading leads today!**
