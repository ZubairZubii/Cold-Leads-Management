import Groq from "groq-sdk";

// Lazy-init: do NOT create at module level — Next.js evaluates modules during
// build and the Groq constructor would run before env vars are available.
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export interface QualificationResult {
  painPoint: string;
  hook: string;
  subject: string;
  personalizedLine: string;
  followup3Hook: string;
  followup7Line: string;
}

const clean = (s: string) =>
  s.replace(/\s*—\s*/g, ", ").replace(/\s*–\s*/g, ", ").trim();

// Used when Groq is down, quota exceeded, or returns any empty field.
// Industry-aware so emails never go out blank.
function buildFallback(lead: {
  name: string;
  company: string;
  industry: string;
  title: string;
  location: string;
}): QualificationResult {
  const ind = (lead.industry || "").toLowerCase();
  const co = lead.company;

  let painPoint = `${co} likely spends too much time on manual follow-ups, data entry, and client coordination that automation could handle instantly.`;
  let hook = `We build automated workflows for lead capture, follow-ups, and CRM sync so your team focuses on closing deals, not admin work.`;
  let followup3Hook = `A similar ${lead.industry || "business"} we worked with cut admin time by over 60% with one simple automation workflow.`;

  if (ind.includes("it") || ind.includes("tech") || ind.includes("software")) {
    painPoint = `IT consultancies like ${co} typically lose hours on manual client onboarding, ticket routing, and project status updates every week.`;
    hook = `We automate client onboarding, support ticket routing, and project updates so your team ships faster with less back-and-forth.`;
    followup3Hook = `We recently automated a client intake and escalation flow for an IT firm that saved their team 10+ hours every week.`;
  } else if (ind.includes("real estate") || ind.includes("property")) {
    painPoint = `Real estate businesses like ${co} often miss leads and lose deals because of slow manual follow-up and CRM data entry.`;
    hook = `We build instant lead capture, automated follow-up sequences, and CRM sync so no enquiry ever falls through the cracks.`;
    followup3Hook = `We helped a property firm automate their lead follow-up and cut response time from 2 days down to under 5 minutes.`;
  } else if (ind.includes("health") || ind.includes("medical") || ind.includes("clinic")) {
    painPoint = `Healthcare practices like ${co} waste significant staff hours on manual appointment reminders, patient follow-ups, and intake forms.`;
    hook = `We automate patient intake, appointment reminders, and follow-up sequences so your staff can focus on care, not paperwork.`;
    followup3Hook = `We set up an automated intake and reminder flow for a clinic that reduced their no-show rate by 40%.`;
  } else if (ind.includes("consult")) {
    painPoint = `Consultancies like ${co} often lose billable hours to manual proposal follow-ups, client reporting, and onboarding coordination.`;
    hook = `We automate proposal follow-ups, client reporting, and onboarding so your consultants spend time on strategy, not admin.`;
    followup3Hook = `We automated a consulting firm's proposal follow-up and onboarding workflow, saving their team 8+ hours every week.`;
  } else if (ind.includes("ecommerce") || ind.includes("retail")) {
    painPoint = `E-commerce businesses like ${co} often struggle with manual order follow-ups, abandoned cart recovery, and customer support routing.`;
    hook = `We automate order updates, cart recovery sequences, and support routing so every customer gets a fast, consistent response.`;
    followup3Hook = `We built an abandoned cart and post-purchase flow for a retailer that automatically recovered 15% of lost revenue.`;
  }

  return {
    painPoint,
    hook,
    subject: `Saving time with automation at ${co}`,
    personalizedLine: `I came across ${co} and spotted a few places where automation could save your team significant time every week.`,
    followup3Hook,
    followup7Line: `I genuinely think there is a workflow at ${co} we could automate to give your team real hours back every week.`,
  };
}

export async function qualifyLeadWithGemini(lead: {
  name: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  location: string;
}): Promise<QualificationResult> {
  try {
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a B2B outreach expert for DevTorque, a company that builds automation solutions — Voice Agents, n8n, Make, Zapier, and No-Code workflows — for businesses that want to save time, reduce manual work, and scale faster.

Generate hyper-personalized cold email content. Use the lead's title, company, industry, and location to craft something that feels researched and specific to their world. Be concrete — no generic statements. No em dashes. Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Generate personalized cold email content for this lead:

Name: ${lead.name}
Title: ${lead.title}
Company: ${lead.company}
Industry: ${lead.industry}
Location: ${lead.location}

Return JSON with exactly these 6 keys:
- painPoint: One punchy sentence about the specific daily operational pain this person faces. Be concrete, not generic. Example: "Real estate agents waste hours entering leads by hand while hot prospects go cold waiting for a callback."
- hook: One direct sentence on the exact workflow DevTorque builds for them. Example: "We automate your lead capture and follow-up sequences so every enquiry is routed and responded to within seconds."
- subject: Under 50 chars. Specific to them, feels handwritten. Example: "Quick question for Prestige Properties"
- personalizedLine: One natural opening sentence showing you know their specific business world. Example: "Came across Prestige Properties and noticed a few places where faster follow-up could mean more closed deals."
- followup3Hook: One sentence with a completely fresh angle — a different value prop they may not have considered. Example: "We recently built an AI voice agent for a similar firm that handles first-touch calls and books meetings automatically."
- followup7Line: One warm, low-pressure closing sentence referencing their business specifically. Example: "If you ever want to see what an automation flow could look like for Prestige Properties, I'm one reply away."`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(responseText);

    const fallback = buildFallback(lead);

    // Validate every field — if Groq returns empty, use fallback for that field only
    return {
      painPoint: clean(parsed.painPoint) || fallback.painPoint,
      hook: clean(parsed.hook) || fallback.hook,
      subject: clean(parsed.subject) || fallback.subject,
      personalizedLine: clean(parsed.personalizedLine) || fallback.personalizedLine,
      followup3Hook: clean(parsed.followup3Hook) || fallback.followup3Hook,
      followup7Line: clean(parsed.followup7Line) || fallback.followup7Line,
    };
  } catch (error) {
    // Groq is down, quota hit, or parse failed — fallback ensures email still sends correctly
    console.error("Groq failed, using industry fallback:", error);
    return buildFallback(lead);
  }
}
