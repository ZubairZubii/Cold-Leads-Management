import fs from "fs";
import path from "path";
import { OAuth2Client } from "google-auth-library";

const TOKEN_FILE = path.join(process.cwd(), ".refresh-token");

export function saveRefreshToken(token: string): void {
  try {
    fs.writeFileSync(TOKEN_FILE, token, "utf-8");
  } catch (e) {
    console.warn("Could not write refresh token to disk:", e);
  }
}

export function getRefreshToken(): string | null {
  // Vercel production: set GOOGLE_REFRESH_TOKEN in Vercel env vars
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return process.env.GOOGLE_REFRESH_TOKEN;
  }
  // Local dev: reads from .refresh-token file
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, "utf-8").trim();
    }
  } catch {}
  return null;
}

export async function getFreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error(
      "No refresh token found. Re-authenticate via the dashboard, then copy the displayed token into GOOGLE_REFRESH_TOKEN in your Vercel env vars."
    );
  }

  const redirectUri = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/auth/callback`
    : "http://localhost:3000/api/auth/callback";

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error("Token refresh failed — no access_token returned.");
  }
  return credentials.access_token;
}
