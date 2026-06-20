import { sheets, sheets_v4 } from "@googleapis/sheets";
import { OAuth2Client } from "google-auth-library";

export interface LeadRecord {
  name: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  qualificationScore: number;
  status: "initial_sent" | "followup_3day_sent" | "followup_7day_sent" | "replied" | "unsubscribed";
  sentDate: string;
  followupDate: string;
  lastActivity: string;
  notes: string;
}

// Sheet column layout (A-L):
// A: Name | B: Email | C: Title | D: Company | E: Industry | F: Location
// G: Score | H: Status | I: Sent Date | J: Follow-up Date | K: Last Activity | L: Notes

function initializeSheets(accessToken: string): sheets_v4.Sheets {
  const oauth2Client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });
  oauth2Client.setCredentials({ access_token: accessToken });
  return sheets({ version: "v4", auth: oauth2Client as any });
}

const HEADERS = [
  "Name", "Email", "Title", "Company", "Industry", "Location",
  "Score", "Status", "Sent Date", "Follow-up Date", "Last Activity", "Notes",
];

export async function initializeSheet(accessToken: string): Promise<void> {
  const sheetsClient = initializeSheets(accessToken);
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const response = await sheetsClient.spreadsheets.get({ spreadsheetId });
  const sheetExists = response.data.sheets?.some(
    (s) => s.properties?.title === "Leads"
  );

  if (!sheetExists) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Leads" } } }],
      },
    });
  }

  // Always write correct headers — fixes sheets created with the old schema
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId,
    range: "Leads!A1:L1",
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS] },
  });
}

export async function addLeadRecord(
  accessToken: string,
  lead: LeadRecord
): Promise<void> {
  const sheetsClient = initializeSheets(accessToken);
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range: "Leads!A:L",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        lead.name,
        lead.email,
        lead.title,
        lead.company,
        lead.industry,
        lead.location,
        lead.qualificationScore,
        lead.status,
        lead.sentDate,
        lead.followupDate,
        lead.lastActivity,
        lead.notes,
      ]],
    },
  });
}

export async function updateLeadStatus(
  accessToken: string,
  email: string,
  status: string,
  notes?: string
): Promise<void> {
  const sheetsClient = initializeSheets(accessToken);
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const result = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: "Leads!A:L",
  });

  const rows = result.data.values || [];
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === email) { rowIndex = i; break; }
  }
  if (rowIndex === -1) return;

  const rowNum = rowIndex + 1;
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId,
    range: `Leads!H${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });

  if (notes) {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `Leads!L${rowNum}`,
      valueInputOption: "RAW",
      requestBody: { values: [[notes]] },
    });
  }
}

export async function getLeadsDueForFollowup(accessToken: string): Promise<{
  lead: LeadRecord;
  emailType: "followup_3day" | "followup_7day";
}[]> {
  const sheetsClient = initializeSheets(accessToken);
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const result = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: "Leads!A:L",
  });

  const rows = result.data.values || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due: { lead: LeadRecord; emailType: "followup_3day" | "followup_7day" }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) continue;

    const status = (row[7] || "") as string;
    const followupDateStr = row[9];

    if (!followupDateStr) continue;

    const followupDate = new Date(followupDateStr);
    if (isNaN(followupDate.getTime())) continue;
    followupDate.setHours(0, 0, 0, 0);

    if (followupDate > today) continue;

    let emailType: "followup_3day" | "followup_7day" | null = null;
    if (status === "initial_sent") emailType = "followup_3day";
    else if (status === "followup_3day_sent") emailType = "followup_7day";

    if (!emailType) continue;

    due.push({
      emailType,
      lead: {
        name: row[0],
        email: row[1],
        title: row[2] || "",
        company: row[3] || "",
        industry: row[4] || "",
        location: row[5] || "",
        qualificationScore: parseInt(row[6]) || 0,
        status: status as LeadRecord["status"],
        sentDate: row[8] || "",
        followupDate: row[9] || "",
        lastActivity: row[10] || "",
        notes: row[11] || "",
      },
    });
  }

  return due;
}

export async function updateLeadFollowup(
  accessToken: string,
  email: string,
  newStatus: string,
  nextFollowupDate: string | null
): Promise<void> {
  const sheetsClient = initializeSheets(accessToken);
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const result = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: "Leads!A:L",
  });

  const rows = result.data.values || [];
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === email) { rowIndex = i; break; }
  }
  if (rowIndex === -1) return;

  const rowNum = rowIndex + 1;
  const activityLabels: Record<string, string> = {
    followup_3day_sent: "3-day follow-up sent",
    followup_7day_sent: "7-day follow-up sent",
    replied: "Lead replied - follow-ups stopped",
    unsubscribed: "Unsubscribed via email link",
  };
  const activityLabel = activityLabels[newStatus] || newStatus;
  const now = new Date().toLocaleString();

  // Update H (status), J (followupDate), K (lastActivity) in one batchUpdate
  await sheetsClient.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `Leads!H${rowNum}`, values: [[newStatus]] },
        { range: `Leads!J${rowNum}`, values: [[nextFollowupDate || ""]] },
        { range: `Leads!K${rowNum}`, values: [[`${activityLabel} - ${now}`]] },
      ],
    },
  });
}
