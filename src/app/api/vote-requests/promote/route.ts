import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/db";
import { roadmapItems, voteRequests, votes } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { isAdminRequest } from "@/lib/auth";

// 原子化「转为任务」：提议票数随迁到新任务，并清理提议的投票记录
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "需要管理员登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, message: "缺少必要参数" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [req] = await tx
        .select()
        .from(voteRequests)
        .where(eq(voteRequests.id, id));

      if (!req) return null;

      const now = new Date().toISOString();
      const newItemId = generateId();
      await tx.insert(roadmapItems).values({
        id: newItemId,
        title: req.title,
        description: req.description || "",
        status,
        votes: req.votes,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });
      await tx
        .delete(votes)
        .where(
          and(eq(votes.targetType, "vote_request"), eq(votes.targetId, id))
        );
      await tx.delete(voteRequests).where(eq(voteRequests.id, id));

      return { id: newItemId };
    });

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "提议不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "转为任务失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
