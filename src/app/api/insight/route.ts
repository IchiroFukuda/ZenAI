import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { thoughtId, userId } = await req.json();
    if (!thoughtId || !userId) {
      return NextResponse.json({ error: "thoughtIdとuserIdは必須です" }, { status: 400 });
    }

    // 該当thoughtの全ログを取得
    const { data: logs, error } = await supabaseAdmin
      .from("logs")
      .select("message")
      .eq("thought_id", thoughtId)
      .order("created_at", { ascending: true });
    if (error || !logs || logs.length === 0) {
      return NextResponse.json({ error: "ログが見つかりません" }, { status: 404 });
    }

    // ログをまとめてプロンプトを作成
    const logText = logs.map((l: any, i: number) => `${i + 1}. ${l.message}`).join("\n");
    const prompt = `あなたはZenAI。ユーザーの一連の発言を静かに観察し、心の動きや本質的な問い、気づきをそっと与える存在です。

以下はユーザーの記録です:
${logText}

この記録全体を俯瞰し、ユーザーに新たな気づきや視点を与えるような一言を、200文字以内で静かに、抽象的に、詩的につぶやいてください。

出力形式:
気づき: ...`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });
    const content = res.choices[0]?.message?.content ?? "";
    const insightMatch = content.match(/気づき:\s*(.*)/);
    const insight = insightMatch?.[1] ?? "";

    // insightsテーブルに保存
    const { data: saved, error: saveError } = await supabaseAdmin
      .from("insights")
      .insert([{ thought_id: thoughtId, user_id: userId, insight }])
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: "保存に失敗しました", detail: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ insight });
  } catch (error) {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
} 
