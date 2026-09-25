import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "需要管理员登录" }, { status: 401 });
  }
  if (!rateLimit(`polish:${getClientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, message: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const { description } = await request.json();

    if (!description || !description.trim()) {
      return NextResponse.json(
        { ok: false, message: "描述不能为空" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1";
    const model = process.env.OPENAI_MODEL || "deepseek-v4-flash";

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "未配置 AI API Key" },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是一名专业的路线图项目描述润色员。你的任务是润色用户提交的功能描述，使其语言更加专业、清晰、规范，同时保留原意。要求：1）不改变用户的核心意图；2）使用简洁专业的表达；3）修正语法和措辞问题；4）直接输出润色后的描述文本，不要添加任何前缀、解释或引号。",
          },
          {
            role: "user",
            content: description,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: `AI 服务请求失败: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const polished = data.choices?.[0]?.message?.content?.trim();

    if (!polished) {
      return NextResponse.json(
        { ok: false, message: "AI 未返回有效内容" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: polished });
  } catch {
    return NextResponse.json({ ok: false, message: "润色失败" }, { status: 500 });
  }
}
