import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";


export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ ok: true, message: "数据库表已初始化" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "初始化失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
