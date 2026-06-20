export const PAIN_POINT_HOOK_MAP: Record<string, { pain_point: string; hook: string }> = {
  'marketing & advertising': {
    pain_point:
      'Agencies like yours lose hours every week to lead intake, follow-ups, and booking calls — admin work that quietly eats into billable time and lets warm leads go cold.',
    hook: 'I help marketing & advertising agencies automate inbound lead capture, follow-up sequences, and call booking — so your team chases work, not paperwork.',
  },
  'information technology & services': {
    pain_point:
      'IT services firms struggle to respond to inbound leads fast enough — by the time you follow up, prospects have already talked to three competitors.',
    hook: 'I help IT services companies capture and qualify inbound leads instantly, so you close deals before the competition even responds.',
  },
  'legal services': {
    pain_point:
      'Law firms lose cases and revenue because intake is slow, case leads get lost in email, and warm prospects go to competitors who respond first.',
    hook: 'I help law firms automate legal intake, instantly qualify high-value cases, and follow up with hot leads before your competitors even know they exist.',
  },
  'real estate': {
    pain_point:
      'Real estate teams waste hours managing seller inquiries, buyer follow-ups, and scheduling calls — critical work that keeps you from actually selling homes.',
    hook: 'I help real estate teams automate lead capture, qualification, and showing scheduling — so your agents spend time closing deals, not chasing leads.',
  },
  'saas': {
    pain_point:
      'Your outbound motion is broken. Every qualified prospect gets 5 cold emails and 3 voicemails before anyone actually tries to understand their problems.',
    hook: 'I help SaaS teams personalize outreach at scale and book qualified demos — turning cold leads into paying customers.',
  },
  'consulting': {
    pain_point:
      'Consulting firms lose deals because prospects fall through the cracks between initial contact and the first consultation call.',
    hook: 'I help consulting firms systematize lead qualification and move prospects to first calls faster.',
  },
  'healthcare': {
    pain_point:
      'Healthcare organizations struggle to manage patient inquiries, provider referrals, and appointment scheduling across multiple channels.',
    hook: 'I help healthcare organizations streamline patient intake, qualify referrals, and book appointments automatically.',
  },
  'financial services': {
    pain_point:
      'Financial advisors spend too much time on administrative tasks and not enough time on client relationships and revenue-generating activities.',
    hook: 'I help financial advisors automate client intake, qualification, and follow-ups so you focus on growing assets under management.',
  },
  'education': {
    pain_point:
      'Schools and educational programs lose enrollment opportunities because prospective student inquiries are slow to respond and often get lost.',
    hook: 'I help educational institutions automate student inquiries, qualify prospects, and convert them into enrollments faster.',
  },
  'default': {
    pain_point: 'You are losing revenue and efficiency to manual processes that waste team time and let opportunities slip away.',
    hook: 'I help businesses automate critical workflows to save time, money, and win deals faster than your competition.',
  },
};

export function getPainPointAndHook(
  industry: string
): { pain_point: string; hook: string } {
  const industryLower = industry.toLowerCase();

  // Try exact match
  if (PAIN_POINT_HOOK_MAP[industryLower]) {
    return PAIN_POINT_HOOK_MAP[industryLower];
  }

  // Try partial match
  for (const [key, value] of Object.entries(PAIN_POINT_HOOK_MAP)) {
    if (key !== 'default' && industryLower.includes(key)) {
      return value;
    }
  }

  // Return default
  return PAIN_POINT_HOOK_MAP['default'];
}
