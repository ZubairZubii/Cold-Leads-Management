import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { qualifyLeadWithGemini } from "@/lib/gemini-service";
import { sendEmail, generateEmailHTML, EmailTemplate } from "@/lib/gmail-service";
import { addLeadRecord, initializeSheet } from "@/lib/sheets-service";
import { cookies } from "next/headers";

// Accepts ONE lead per request. The dashboard loops client-side with a
// 3-second delay between calls so Vercel never times out.
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

    const body = await request.json();
    const lead = body.lead;

    if (!lead || !lead.email || !lead.name || !lead.title || !lead.company) {
      return NextResponse.json(
        { error: "Missing required fields (email, name, title, company)" },
        { status: 400 }
      );
    }

    await initializeSheet(token);

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
    const messageId = await sendEmail(token, lead.email, emailTemplate.subject, htmlBody);

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
      notes: "AI-personalized content. Follow-ups scheduled automatically.",
    });

    return NextResponse.json({
      success: true,
      result: { email: lead.email, name: lead.name, status: "email_sent", messageId },
    });
  } catch (error) {
    console.error("Process lead error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
