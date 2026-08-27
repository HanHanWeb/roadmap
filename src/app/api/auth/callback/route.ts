import { NextRequest, NextResponse } from "next/server";
import { CASDOOR_CONFIG } from "@/lib/casdoor";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { ok: false, message: "缺少 code 参数" },
      { status: 400 }
    );
  }

  try {
    const { serverUrl, clientId, clientSecret } = CASDOOR_CONFIG;
    const redirectUri = `${request.nextUrl.origin}/`;

    const tokenBody: Record<string, string> = {
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    };
    if (clientSecret) {
      tokenBody.client_secret = clientSecret;
    }

    const tokenResponse = await fetch(
      `${serverUrl}/api/login/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenBody),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          ok: false,
          message: "获取 access_token 失败",
          detail: tokenData,
        },
        { status: 401 }
      );
    }

    const userResponse = await fetch(`${serverUrl}/api/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    return NextResponse.json({
      ok: true,
      user: {
        id: userData.sub || userData.id || "",
        name: userData.name || userData.preferred_username || "",
        email: userData.email || "",
        avatar: userData.picture || "",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "认证失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
