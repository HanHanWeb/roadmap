import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roadmapItems, votes } from "@/lib/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { generateId } from "@/lib/db";


export async function GET() {
  try {
    const rows = await db
      .select()
      .from(roadmapItems)
      .orderBy(asc(roadmapItems.sortOrder), asc(roadmapItems.createdAt));
    return NextResponse.json({ ok: true, data: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "查询失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, projectId } = body;

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "标题不能为空" },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(roadmapItems).values({
      id,
      title,
      description: description || "",
      status: status || "backlog",
      projectId: projectId || null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
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
    const { id, title, description, status, reorder } = body;

    // 处理排序
    if (reorder) {
      const { items } = body as { items: { id: string; sort_order: number }[] };
      if (items && items.length > 0) {
        await db.transaction(async (tx) => {
          for (const item of items) {
            await tx
              .update(roadmapItems)
              .set({ sortOrder: item.sort_order })
              .where(eq(roadmapItems.id, item.id));
          }
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "缺少 ID" },
        { status: 400 }
      );
    }

    const setFields: Record<string, string | number | null> = {};
    if (title !== undefined) setFields.title = title;
    if (description !== undefined) setFields.description = description;
    if (status !== undefined) setFields.status = status;
    if (body.projectId !== undefined) setFields.projectId = body.projectId || null;

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json(
        { ok: false, message: "没有需要更新的字段" },
        { status: 400 }
      );
    }

    setFields.updatedAt = new Date().toISOString();
    await db.update(roadmapItems).set(setFields).where(eq(roadmapItems.id, id));

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

    // 删除关联的投票
    await db
      .delete(votes)
      .where(and(eq(votes.targetType, "roadmap"), eq(votes.targetId, id)));
    // 删除路线图项目
    await db.delete(roadmapItems).where(eq(roadmapItems.id, id));
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { ok: false, message: "缺少必要参数" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // 检查是否已投票
      const [existingVote] = await tx
        .select()
        .from(votes)
        .where(
          and(
            eq(votes.userId, userId),
            eq(votes.targetType, "roadmap"),
            eq(votes.targetId, id)
          )
        );

      if (existingVote) {
        // 已投票 → 取消投票
        await tx
          .delete(votes)
          .where(
            and(
              eq(votes.userId, userId),
              eq(votes.targetType, "roadmap"),
              eq(votes.targetId, id)
            )
          );
        await tx
          .update(roadmapItems)
          .set({ votes: sql`${roadmapItems.votes} - 1` })
          .where(eq(roadmapItems.id, id));
        return { voted: false };
      } else {
        // 未投票 → 投票
        await tx.insert(votes).values({
          userId,
          targetType: "roadmap",
          targetId: id,
          createdAt: new Date().toISOString(),
        });
        await tx
          .update(roadmapItems)
          .set({ votes: sql`${roadmapItems.votes} + 1` })
          .where(eq(roadmapItems.id, id));
        return { voted: true };
      }
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "投票失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
