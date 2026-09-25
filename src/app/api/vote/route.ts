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

    if (targetType !== "roadmap" && targetType !== "vote_request") {
      return NextResponse.json(
        { ok: false, message: "无效的投票类型" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const table = targetType === "roadmap" ? roadmapItems : voteRequests;
      const [target] = await tx
        .select()
        .from(table)
        .where(eq(table.id, targetId));

      if (!target) return null;

      const [existing] = await tx
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
        await tx.delete(votes).where(eq(votes.id, existing.id));
        await tx
          .update(table)
          .set({ votes: sql`max(0, ${table.votes} - 1)` })
          .where(eq(table.id, targetId));
        return { voted: false };
      }

      await tx.insert(votes).values({
        userId: user_id,
        targetType,
        targetId,
        createdAt: new Date().toISOString(),
      });
      await tx
        .update(table)
        .set({ votes: sql`${table.votes} + 1` })
        .where(eq(table.id, targetId));
      return { voted: true };
    });

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "投票目标不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "投票失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
