import { NextRequest, NextResponse } from "next/server";
import { qualifyLeadWithGemini } from "@/lib/gemini-service";
import { sendEmail, generateEmailHTML, EmailTemplate } from "@/lib/gmail-service";
import { addLeadRecord, initializeSheet } from "@/lib/sheets-service";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("gmail_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated. Please login first." },
        { status: 401 }
      );
    }

    const { leads } = await request.json();

    if (!Array.isArray(leads)) {
      return NextResponse.json(
        { error: "Leads must be an array" },
        { status: 400 }
      );
    }

    // Initialize sheet if needed
    await initializeSheet(token);

    const results: any[] = [];
    let successCount = 0;
    let failureCount = 0;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const [index, lead] of leads.entries()) {
      if (index > 0) await sleep(60_000);
      try {
        // Validate required fields
        if (!lead.email || !lead.name || !lead.title || !lead.company) {
          failureCount++;
          results.push({
            email: lead.email,
            status: "failed",
            error: "Missing required fields (email, name, title, company)",
          });
          continue;
        }

        console.log(`Processing lead: ${lead.name} (${lead.email})`);

        // Generate personalized email content via AI
        const content = await qualifyLeadWithGemini(lead);

        const firstName = lead.first_name || lead.name.split(" ")[0];
        const emailTemplate: EmailTemplate = {
          to: lead.email,
          firstName,
          company: lead.company,
          industry: lead.industry || "your",
          subject: `${firstName}, saving time with lead automation at ${lead.company}`,
          painPoint: content.painPoint,
          hook: content.hook,
          followup3Hook: content.followup3Hook,
          followup7Line: content.followup7Line,
          emailType: "initial",
        };

        const htmlBody = generateEmailHTML(emailTemplate);

        // Send email
        const messageId = await sendEmail(
          token,
          lead.email,
          emailTemplate.subject,
          htmlBody
        );

        console.log(`Email sent to ${lead.email}, message ID: ${messageId}`);

        // Log to sheet
        const now = new Date();
        await addLeadRecord(token, {
          name: lead.name,
          email: lead.email,
          title: lead.title,
          company: lead.company,
          industry: lead.industry || "Unknown",
          location: lead.location || "Unknown",
          qualificationScore: 100,
          status: "initial_sent",
          sentDate: now.toISOString(),
          followupDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: `Initial email sent - ${now.toLocaleString()}`,
          notes: `AI-personalized content. Follow-ups scheduled automatically.`,
        });

        successCount++;
        results.push({
          email: lead.email,
          status: "email_sent",
          messageId,
        });
      } catch (error) {
        failureCount++;
        console.error(`Error processing lead ${lead.email}:`, error);
        results.push({
          email: lead.email,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: leads.length,
        successCount,
        failureCount,
        qualified: successCount,
      },
      results,
    });
  } catch (error) {
    console.error("Process leads error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
