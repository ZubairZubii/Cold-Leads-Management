import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLeadsDueForFollowup, updateLeadFollowup } from "@/lib/sheets-service";
import { qualifyLeadWithGemini } from "@/lib/gemini-service";
import { sendEmail, generateEmailHTML, hasLeadReplied } from "@/lib/gmail-service";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("gmail_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated. Please login first." },
      { status: 401 }
    );
  }

  try {
    const dueLeads = await getLeadsDueForFollowup(token);

    if (dueLeads.length === 0) {
      return NextResponse.json({
        sent: 0,
        errors: 0,
        total: 0,
        results: [],
        message: "No leads are due for a follow-up right now.",
      });
    }

    // No 60s delay here — this is a manual trigger used for testing/review
    let sent = 0;
    let errors = 0;
    const results: {
      email: string;
      company: string;
      type: string;
      status: string;
      error?: string;
    }[] = [];

    for (const { lead, emailType } of dueLeads) {
      try {
        // Skip if lead has already replied — don't send follow-ups to people who responded
        const replied = await hasLeadReplied(token, lead.email);
        if (replied) {
          await updateLeadFollowup(token, lead.email, "replied", null);
          results.push({
            email: lead.email,
            company: lead.company,
            type: emailType === "followup_3day" ? "3-Day Follow-up" : "7-Day Follow-up",
            status: "skipped - lead replied",
          });
          continue;
        }

        const content = await qualifyLeadWithGemini({
          name: lead.name,
          email: lead.email,
          title: lead.title,
          company: lead.company,
          industry: lead.industry,
          location: lead.location,
        });

        const firstName = lead.name.split(" ")[0];
        const subject =
          emailType === "followup_3day"
            ? `Re: ${firstName}, saving time with lead automation at ${lead.company}`
            : `${firstName}, last note from DevTorque`;

        const htmlBody = generateEmailHTML({
          to: lead.email,
          firstName,
          company: lead.company,
          industry: lead.industry || "your",
          subject,
          painPoint: content.painPoint,
          hook: content.hook,
          followup3Hook: content.followup3Hook,
          followup7Line: content.followup7Line,
          emailType,
        });

        await sendEmail(token, lead.email, subject, htmlBody);

        const newStatus =
          emailType === "followup_3day" ? "followup_3day_sent" : "followup_7day_sent";
        const nextFollowupDate =
          emailType === "followup_3day"
            ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        await updateLeadFollowup(token, lead.email, newStatus, nextFollowupDate);

        sent++;
        results.push({
          email: lead.email,
          company: lead.company,
          type: emailType === "followup_3day" ? "3-Day Follow-up" : "7-Day Follow-up",
          status: "sent",
        });
      } catch (e) {
        errors++;
        results.push({
          email: lead.email,
          company: lead.company,
          type: emailType === "followup_3day" ? "3-Day Follow-up" : "7-Day Follow-up",
          status: "error",
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ sent, errors, total: dueLeads.length, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run follow-ups" },
      { status: 500 }
    );
  }
}
