import { gmail, gmail_v1 } from "@googleapis/gmail";
import { OAuth2Client } from "google-auth-library";

let authClient: OAuth2Client | null = null;
let gmailService: gmail_v1.Gmail | null = null;

export function initializeGmail(accessToken: string): gmail_v1.Gmail {
  const oauth2Client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });

  oauth2Client.setCredentials({ access_token: accessToken });

  gmailService = gmail({ version: "v1", auth: oauth2Client as any });
  authClient = oauth2Client;

  return gmailService;
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string,
  inReplyTo?: string
): Promise<string> {
  const gmailClient = initializeGmail(accessToken);

  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Plain text fallback (helps avoid spam filters)
  const plainText = htmlBody
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s{2,}/g, "\n")
    .trim();

  // Base64-encode each MIME part (76-char line wrap per RFC 2045)
  // Using base64 instead of quoted-printable avoids Outlook misrendering anchor tags
  const encodeB64 = (s: string) => {
    const b64 = Buffer.from(s, "utf-8").toString("base64");
    return b64.match(/.{1,76}/g)?.join("\r\n") ?? b64;
  };

  const emailParts = [
    `From: Zubair Ali <zubair@devtorque.co>`,
    `To: ${to}`,
    `Reply-To: zubair@devtorque.co`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodeB64(plainText),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodeB64(htmlBody),
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  const base64Email = Buffer.from(emailParts)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const message: gmail_v1.Schema$Message = {
    raw: base64Email,
  };

  if (inReplyTo) {
    message.threadId = inReplyTo;
  }

  const result = await gmailClient.users.messages.send({
    userId: "me",
    requestBody: message,
  });

  return result.data.id || "";
}

export interface EmailTemplate {
  to: string;
  firstName: string;
  company: string;
  industry: string;
  subject: string;
  painPoint: string;
  hook: string;
  followup3Hook?: string;
  followup7Line?: string;
  emailType: "initial" | "followup_3day" | "followup_7day";
}

const CALENDLY = `https://calendly.com/devtorque-ai/30min`;

function unsubscribeFooter(email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://devtorque.co";
  const encoded = Buffer.from(email, "utf-8").toString("base64url");
  return `<p style="margin:28px 0 0; font-size:11px; color:#bbbbbb; font-family:Arial,Helvetica,sans-serif; line-height:1.6;">
    You're receiving this because we thought automation could help your business.<br>
    <a href="${appUrl}/api/leads/unsubscribe?e=${encoded}" target="_blank" style="color:#bbbbbb; text-decoration:underline; font-family:Arial,Helvetica,sans-serif;">Unsubscribe</a>
  </p>`;
}

const SIGNATURE = `
  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; border-top:1px solid #e0e0e0; padding-top:12px; font-family:Arial, Helvetica, sans-serif;">
    <tr>
      <td style="font-size:14px; line-height:1.6; color:#1a1a1a;">
        <strong style="font-size:14px; color:#1a1a1a;">Zubair Ali</strong><br>
        <span style="font-size:13px; color:#555555;">Founder, DevTorque</span><br><br>
        <a href="https://www.devtorque.co" target="_blank" style="font-size:13px; color:#1a73e8; text-decoration:underline; font-family:Arial, Helvetica, sans-serif;">devtorque.co</a>
        <span style="color:#999999; font-size:13px;">&nbsp;|&nbsp;</span>
        <a href="https://www.matavoice.com" target="_blank" style="font-size:13px; color:#1a73e8; text-decoration:underline; font-family:Arial, Helvetica, sans-serif;">matavoice.com</a>
        <span style="color:#999999; font-size:13px;">&nbsp;|&nbsp;</span>
        <a href="https://calendly.com/devtorque-ai/30min" target="_blank" style="font-size:13px; color:#1a73e8; text-decoration:underline; font-family:Arial, Helvetica, sans-serif;">Book a call</a>
        <br>
        <a href="https://www.softr.io/partners/devtorque" target="_blank" style="font-size:12px; color:#888888; text-decoration:underline; font-family:Arial, Helvetica, sans-serif;">Softr Partner</a>
        <span style="color:#cccccc; font-size:12px;">&nbsp;&middot;&nbsp;</span>
        <a href="https://pk.linkedin.com/company/devtorque" target="_blank" style="font-size:12px; color:#888888; text-decoration:underline; font-family:Arial, Helvetica, sans-serif;">LinkedIn</a>
        <span style="color:#cccccc; font-size:12px;">&nbsp;&middot;&nbsp;</span>
        <a href="https://www.upwork.com/freelancers/~01950fe394447f580b" target="_blank" style="font-size:12px; color:#888888; text-decoration:underline; font-family:Arial, Helvetica, sans-serif;">Upwork</a>
      </td>
    </tr>
  </table>
`;

export function generateEmailHTML(template: EmailTemplate): string {
  let body = "";

  if (template.emailType === "initial") {
    body = `
  <p style="margin:0 0 16px;">Hi ${template.firstName},</p>

  <p style="margin:0 0 16px;">Came across ${template.company} and spent a few minutes on what you're building in the ${template.industry} space, solid work.</p>

  <p style="margin:0 0 16px;">I'll be quick.</p>

  <p style="margin:0 0 16px;">${template.painPoint}</p>

  <p style="margin:0 0 16px;">${template.hook}</p>

  <p style="margin:16px 0 10px; border-top:1px solid #f0f0f0; padding-top:14px;"><strong>How I help:</strong></p>
  <ul style="margin:0 0 16px; padding-left:20px;">
    <li style="margin:0 0 6px;"><strong>Lead Capture & Automation</strong> - Inbound forms, auto-routing, instant responses</li>
    <li style="margin:0 0 6px;"><strong>Follow-up Sequences</strong> - Automated emails and SMS that close deals</li>
    <li style="margin:0 0 6px;"><strong>CRM Integration</strong> - Salesforce, HubSpot, GoHighLevel, Pipedrive, Asana, all synced and automated</li>
    <li style="margin:0 0 6px;"><strong>Call Booking</strong> - Automated scheduling, reminders, no back-and-forth</li>
    <li style="margin:0 0 6px;"><strong>Full-Stack Development</strong> - Custom web apps, client portals, and internal tools built around your workflow</li>
  </ul>

  <p style="margin:0 0 12px;"><strong>Tech Stack:</strong> Next.js, React, Node.js, Zapier, Make, Salesforce, HubSpot, GoHighLevel, Pipedrive, Asana, Slack, Gmail, Calendly, Softr.io, Retell, VAPI. We build full-stack web apps, AI voice agents, and no-code automation workflows end-to-end.</p>

  <p style="margin:0 0 16px;">I'm not pitching a generic tool, I'd want to see exactly where ${template.company} is losing time or leads, then map out a system built around your workflow.</p>

  <p style="margin:0 0 16px;">Worth a 15-minute call this week?</p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background-color:#1a73e8; border-radius:6px; padding:13px 36px;">
              <a href="${CALENDLY}" target="_blank" style="color:#ffffff; font-weight:700; text-decoration:none; font-size:15px; font-family:Arial,Helvetica,sans-serif; display:inline-block; letter-spacing:0.3px;">Book a Free Strategy Call</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 16px;">Either way, happy to send over a short example of what this looks like for a company like yours.</p>

  ${SIGNATURE}
  ${unsubscribeFooter(template.to)}
    `;
  } else if (template.emailType === "followup_3day") {
    body = `
  <p style="margin:0 0 16px;">Hi ${template.firstName},</p>

  <p style="margin:0 0 16px;">Just circling back, wanted to make sure this didn't get buried.</p>

  <p style="margin:0 0 16px;">${template.followup3Hook || template.hook}</p>

  <p style="margin:0 0 12px;"><strong>A few things we can set up for ${template.company}:</strong></p>
  <ul style="margin:0 0 16px; padding-left:20px;">
    <li style="margin:0 0 6px;"><strong>Automated lead capture</strong> - No more manual data entry or missed enquiries</li>
    <li style="margin:0 0 6px;"><strong>Smart follow-up sequences</strong> - Emails and SMS that run on autopilot</li>
    <li style="margin:0 0 6px;"><strong>CRM sync</strong> - HubSpot, Salesforce, GoHighLevel, Pipedrive, all updated automatically</li>
  </ul>

  <p style="margin:0 0 16px;">Open to a quick 15-minute call?</p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background-color:#1a73e8; border-radius:6px; padding:13px 36px;">
              <a href="${CALENDLY}" target="_blank" style="color:#ffffff; font-weight:700; text-decoration:none; font-size:15px; font-family:Arial,Helvetica,sans-serif; display:inline-block; letter-spacing:0.3px;">Book a Free Strategy Call</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 16px;">If timing isn't right, no worries, just let me know and I'll stop reaching out.</p>

  ${SIGNATURE}
  ${unsubscribeFooter(template.to)}
    `;
  } else if (template.emailType === "followup_7day") {
    body = `
  <p style="margin:0 0 16px;">Hi ${template.firstName},</p>

  <p style="margin:0 0 16px;">Last note from me, promise.</p>

  <p style="margin:0 0 16px;">${template.followup7Line || `I genuinely think there's an automation opportunity at ${template.company} that could save your team real time every week.`}</p>

  <p style="margin:0 0 16px;">If you ever want to explore what that could look like, I'm one reply away. No pressure, no pitch, just a quick conversation.</p>

  <p style="margin:0 0 16px;">Either way, best of luck with everything at ${template.company}.</p>

  ${SIGNATURE}
  ${unsubscribeFooter(template.to)}
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#ffffff; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<!-- Outer wrapper: 100% width, centers content in all clients -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;">
  <tr>
    <td align="center" style="padding:0;">
      <!-- Inner content table: fixed 600px, centered in all clients -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;">
        <tr>
          <td style="padding:20px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.7; color:#1a1a1a;">
            ${body}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function hasLeadReplied(accessToken: string, leadEmail: string): Promise<boolean> {
  try {
    const gmailClient = initializeGmail(accessToken);
    const result = await gmailClient.users.messages.list({
      userId: "me",
      q: `from:${leadEmail}`,
      maxResults: 1,
    });
    return (result.data.messages?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function getProfile(accessToken: string): Promise<{
  email: string;
  name: string;
}> {
  const gmailClient = initializeGmail(accessToken);

  const profile = await gmailClient.users.getProfile({ userId: "me" });

  return {
    email: profile.data.emailAddress || "",
    name: profile.data.emailAddress || "",
  };
}
