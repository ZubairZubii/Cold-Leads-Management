import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { getFreshAccessToken } from "@/lib/token-store";
import { updateLeadFollowup } from "@/lib/sheets-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const encoded = searchParams.get("e");

  if (!encoded) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  try {
    const email = Buffer.from(encoded, "base64url").toString("utf-8");

    if (!email.includes("@")) {
      return new NextResponse("Invalid unsubscribe link.", { status: 400 });
    }

    const accessToken = await getFreshAccessToken();
    await updateLeadFollowup(accessToken, email, "unsubscribed", null);

    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Unsubscribed</title></head>
<body style="font-family:Arial,sans-serif; padding:60px 40px; text-align:center; color:#333;">
  <h2 style="margin:0 0 12px;">You've been unsubscribed.</h2>
  <p style="color:#666; margin:0;">You won't receive any more emails from DevTorque at ${email}.</p>
</body>
</html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch {
    return new NextResponse("Something went wrong. Please try again later.", {
      status: 500,
    });
  }
}
