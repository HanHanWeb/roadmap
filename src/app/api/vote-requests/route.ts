import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { voteRequests, votes } from "@/lib/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { generateId } from "@/lib/db";


export async function GET() {
  try {
    const rows = await db
      .select()
      .from(voteRequests)
      .orderBy(desc(voteRequests.votes), asc(voteRequests.createdAt));
    return NextResponse.json({ ok: true, data: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "查询失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, user_id } = body;

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "标题不能为空" },
        { status: 400 }
      );
    }

    const id = generateId();
    await db.insert(voteRequests).values({
      id,
      title,
      description: description || "",
      userId: user_id || "",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, data: { id } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, votes: votesCount } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "缺少 ID" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (votesCount !== undefined) updates.votes = votesCount;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, message: "没有需要更新的字段" },
        { status: 400 }
      );
    }

    await db.update(voteRequests).set(updates).where(eq(voteRequests.id, id));

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "缺少 ID" },
        { status: 400 }
      );
    }

    await db
      .delete(votes)
      .where(
        and(eq(votes.targetType, "vote_request"), eq(votes.targetId, id))
      );
    await db.delete(voteRequests).where(eq(voteRequests.id, id));

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, target_id } = body;

    if (!user_id || !target_id) {
      return NextResponse.json(
        { ok: false, message: "参数不完整" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, user_id),
          eq(votes.targetType, "vote_request"),
          eq(votes.targetId, target_id)
        )
      );

    if (existing.length > 0) {
      await db
        .delete(votes)
        .where(
          and(
            eq(votes.userId, user_id),
            eq(votes.targetType, "vote_request"),
            eq(votes.targetId, target_id)
          )
        );

      await db
        .update(voteRequests)
        .set({ votes: sql`${voteRequests.votes} - 1` })
        .where(eq(voteRequests.id, target_id));

      return NextResponse.json({ ok: true, voted: false });
    } else {
      await db.insert(votes).values({
        userId: user_id,
        targetType: "vote_request",
        targetId: target_id,
        createdAt: new Date().toISOString(),
      });

      await db
        .update(voteRequests)
        .set({ votes: sql`${voteRequests.votes} + 1` })
        .where(eq(voteRequests.id, target_id));

      return NextResponse.json({ ok: true, voted: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "投票失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
