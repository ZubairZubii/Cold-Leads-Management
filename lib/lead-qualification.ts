import { ParsedLead } from './csv-parser';

export interface QualifiedLead {
  id: number;
  name: string;
  first_name: string;
  title: string;
  company: string;
  email: string;
  location: string;
  industry: string;
  status: string;
  catch_all_risk: string;
  pain_point: string;
  hook: string;
}

// Decision maker titles that indicate qualified leads
const DECISION_MAKER_KEYWORDS = [
  'founder',
  'ceo',
  'cto',
  'cfo',
  'coo',
  'chief',
  'president',
  'owner',
  'co-founder',
  'co founder',
  'executive',
  'vp ',
  'vice president',
  'c-suite',
  'c suite',
];

export function isQualifiedLead(lead: ParsedLead): boolean {
  // Must have an email
  if (!lead.email) {
    return false;
  }

  // Must not be catch-all risk (if status is known)
  if (lead.catchAllStatus === 'Catch-all') {
    return false;
  }

  // Check if title contains decision maker keywords
  const titleLower = lead.title.toLowerCase();
  const isDecisionMaker = DECISION_MAKER_KEYWORDS.some(keyword =>
    titleLower.includes(keyword)
  );

  if (!isDecisionMaker) {
    return false;
  }

  return true;
}

export function getLocation(lead: ParsedLead): string {
  const parts = [lead.city, lead.state].filter(Boolean);
  if (parts.length === 0 && lead.country) {
    return lead.country;
  }
  return parts.join(', ');
}

export function getCatchAllRisk(lead: ParsedLead): string {
  return lead.catchAllStatus === 'Catch-all' ? 'yes' : 'no';
}

export function qualifyLeads(
  leads: ParsedLead[],
  painPointHookMap: Record<string, { pain_point: string; hook: string }>
): QualifiedLead[] {
  const qualifiedLeads: QualifiedLead[] = [];
  let id = 1;

  for (const lead of leads) {
    if (isQualifiedLead(lead)) {
      // Get pain point and hook from industry mapping
      const industryKey = lead.industry.toLowerCase();
      let painPointHook = painPointHookMap[industryKey];

      // Try exact match first, then fallback to a default or partial match
      if (!painPointHook) {
        // Find best match by checking for keywords in industry
        for (const [key, value] of Object.entries(painPointHookMap)) {
          if (industryKey.includes(key) || key.includes(industryKey)) {
            painPointHook = value;
            break;
          }
        }
      }

      // Use default if no match found
      if (!painPointHook) {
        painPointHook = painPointHookMap['default'] || {
          pain_point: 'You are losing revenue and efficiency to manual processes.',
          hook: 'I help businesses automate critical workflows to save time and money.',
        };
      }

      const qualifiedLead: QualifiedLead = {
        id: id++,
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        first_name: lead.firstName,
        title: lead.title,
        company: lead.company,
        email: lead.email,
        location: getLocation(lead),
        industry: lead.industry,
        status: 'Qualified',
        catch_all_risk: getCatchAllRisk(lead),
        pain_point: painPointHook.pain_point,
        hook: painPointHook.hook,
      };

      qualifiedLeads.push(qualifiedLead);
    }
  }

  return qualifiedLeads;
}
