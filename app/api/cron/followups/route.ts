import { NextRequest, NextResponse } from "next/server";
import { getFreshAccessToken } from "@/lib/token-store";
import { getLeadsDueForFollowup, updateLeadFollowup } from "@/lib/sheets-service";
import { qualifyLeadWithGemini } from "@/lib/gemini-service";
import { sendEmail, generateEmailHTML, hasLeadReplied } from "@/lib/gmail-service";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = await getFreshAccessToken();
    const dueLeads = await getLeadsDueForFollowup(accessToken);

    console.log(`Cron: found ${dueLeads.length} leads due for follow-up`);

    let sent = 0;
    let errors = 0;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const [index, { lead, emailType }] of dueLeads.entries()) {
      if (index > 0) await sleep(60_000);
      try {
        // Skip if lead has already replied — don't follow up on people who responded
        const replied = await hasLeadReplied(accessToken, lead.email);
        if (replied) {
          await updateLeadFollowup(accessToken, lead.email, "replied", null);
          console.log(`Cron: ${lead.email} already replied, marked and skipped`);
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

        await sendEmail(accessToken, lead.email, subject, htmlBody);

        const newStatus =
          emailType === "followup_3day"
            ? "followup_3day_sent"
            : "followup_7day_sent";

        const nextFollowupDate =
          emailType === "followup_3day"
            ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        await updateLeadFollowup(
          accessToken,
          lead.email,
          newStatus,
          nextFollowupDate
        );

        console.log(`Cron: sent ${emailType} to ${lead.email}`);
        sent++;
      } catch (e) {
        console.error(`Cron: failed for ${lead.email}:`, e);
        errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      errors,
      total: dueLeads.length,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
