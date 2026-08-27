import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, roadmapItems, voteRequests } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const rows = await db
      .select()
      .from(votes)
      .where(eq(votes.userId, userId));

    return NextResponse.json({ ok: true, data: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "查询失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, targetType, targetId } = body;

    if (!user_id || !targetType || !targetId) {
      return NextResponse.json(
        { ok: false, message: "缺少必要参数" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, user_id),
          eq(votes.targetType, targetType),
          eq(votes.targetId, targetId)
        )
      );

    if (existing) {
      await db
        .delete(votes)
        .where(eq(votes.id, existing.id));

      const table = targetType === "roadmap" ? roadmapItems : voteRequests;
      await db
        .update(table)
        .set({ votes: sql`${table.votes} - 1` })
        .where(eq(table.id, targetId));

      return NextResponse.json({ ok: true, voted: false });
    }

    await db.insert(votes).values({
      userId: user_id,
      targetType,
      targetId,
    });

    const table = targetType === "roadmap" ? roadmapItems : voteRequests;
    await db
      .update(table)
      .set({ votes: sql`${table.votes} + 1` })
      .where(eq(table.id, targetId));

    return NextResponse.json({ ok: true, voted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "投票失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
