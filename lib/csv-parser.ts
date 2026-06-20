export interface ParsedLead {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  emailStatus: string;
  catchAllStatus: string;
  seniority: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  linkedinUrl: string;
  website: string;
}

export function parseApolloCSV(csvContent: string): ParsedLead[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const leads: ParsedLead[] = [];

  // Map header names to indices
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  // Process each row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      
      const lead: ParsedLead = {
        firstName: values[headerMap['First Name']]?.trim() || '',
        lastName: values[headerMap['Last Name']]?.trim() || '',
        title: values[headerMap['Title']]?.trim() || '',
        company: values[headerMap['Company Name']]?.trim() || '',
        email: values[headerMap['Email']]?.trim() || '',
        emailStatus: values[headerMap['Email Status']]?.trim() || '',
        catchAllStatus: values[headerMap['Primary Email Catch-all Status']]?.trim() || '',
        seniority: values[headerMap['Seniority']]?.trim() || '',
        industry: values[headerMap['Industry']]?.trim() || '',
        city: values[headerMap['City']]?.trim() || '',
        state: values[headerMap['State']]?.trim() || '',
        country: values[headerMap['Country']]?.trim() || '',
        linkedinUrl: values[headerMap['Person Linkedin Url']]?.trim() || '',
        website: values[headerMap['Website']]?.trim() || '',
      };

      if (lead.firstName && lead.email) {
        leads.push(lead);
      }
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  return leads;
}

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
