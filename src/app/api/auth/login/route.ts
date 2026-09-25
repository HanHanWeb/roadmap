import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "请求格式错误" },
      { status: 400 }
    );
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { ok: false, message: "未配置管理员账号（请在环境变量中设置 ADMIN_EMAIL 和 ADMIN_PASSWORD）" },
      { status: 500 }
    );
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json(
      { ok: false, message: "邮箱或密码错误" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      id: "admin",
      name: "管理员",
      email: adminEmail,
      isAdmin: true,
    },
  });
  response.cookies.set(sessionCookie.name, createSessionToken(adminEmail), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionCookie.maxAgeSeconds,
    path: "/",
  });
  return response;
}
