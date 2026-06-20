import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { qualifyLeadWithGemini } from "@/lib/gemini-service";
import { generateEmailHTML, EmailTemplate } from "@/lib/gmail-service";

export async function POST(request: NextRequest) {
  try {
    const { lead } = await request.json();

    if (!lead || !lead.name || !lead.email || !lead.company) {
      return NextResponse.json(
        { error: "Lead must have name, email, and company" },
        { status: 400 }
      );
    }

    const content = await qualifyLeadWithGemini({
      name: lead.name,
      email: lead.email,
      title: lead.title || "Professional",
      company: lead.company,
      industry: lead.industry || "your",
      location: lead.location || "",
    });

    const firstName = lead.first_name || lead.name.split(" ")[0];
    const base: Omit<EmailTemplate, "emailType"> = {
      to: lead.email,
      firstName,
      company: lead.company,
      industry: lead.industry || "your",
      subject: `${firstName}, saving time with lead automation at ${lead.company}`,
      painPoint: content.painPoint,
      hook: content.hook,
      followup3Hook: content.followup3Hook,
      followup7Line: content.followup7Line,
    };

    return NextResponse.json({
      initial: generateEmailHTML({ ...base, emailType: "initial" }),
      followup3day: generateEmailHTML({ ...base, emailType: "followup_3day" }),
      followup7day: generateEmailHTML({ ...base, emailType: "followup_7day" }),
      content,
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview generation failed" },
      { status: 500 }
    );
  }
}
