import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, roadmapItems } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { generateId } from "@/lib/db";


export async function GET() {
  try {
    const rows = await db.select().from(projects).orderBy(asc(projects.createdAt));
    return NextResponse.json({ ok: true, data: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "获取失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "缺少项目名称" },
        { status: 400 }
      );
    }

    const id = generateId();
    await db.insert(projects).values({
      id,
      name,
      color: color || "#3f9bfb",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, data: { id, name, color: color || "#3f9bfb" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "缺少 ID" },
        { status: 400 }
      );
    }

    const setFields: Record<string, string> = {};
    if (name !== undefined) setFields.name = name;
    if (color !== undefined) setFields.color = color;

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json(
        { ok: false, message: "没有需要更新的字段" },
        { status: 400 }
      );
    }

    await db.update(projects).set(setFields).where(eq(projects.id, id));

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

    // 先清空关联的 roadmap_items 的 project_id
    await db.update(roadmapItems).set({ projectId: null }).where(eq(roadmapItems.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
