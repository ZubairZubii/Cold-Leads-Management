import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { saveRefreshToken } from "@/lib/token-store";

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/auth/callback`
);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const refreshTokenSaved = !!tokens.refresh_token;
    if (tokens.refresh_token) {
      saveRefreshToken(tokens.refresh_token);
    }

    const redirectUrl = new URL(`${request.nextUrl.origin}/`);
    redirectUrl.searchParams.set("token", tokens.access_token || "");
    if (refreshTokenSaved) {
      redirectUrl.searchParams.set("cron", "ready");
    }
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set("rt", tokens.refresh_token);
    }

    const response = NextResponse.redirect(redirectUrl.toString());

    response.cookies.set({
      name: "gmail_token",
      value: tokens.access_token || "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Auth error:", msg);
    return NextResponse.json({ error: "Auth failed", detail: msg }, { status: 500 });
  }
}
