import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message, thoughtId, userId } = await req.json();
    
    // 過去の思考履歴を取得
    let thoughtHistory = "";
    if (userId && thoughtId) {
      try {
        const { data: logs, error } = await supabase
          .from("logs")
          .select("message, gpt_thought")
          .eq("thought_id", thoughtId)
          .order("created_at", { ascending: true });
        
        if (error) {
          console.error("🔍 API: 思考履歴取得エラー", error);
        } else {
          if (logs && logs.length > 0) {
            thoughtHistory = "これまでの思考履歴:\n";
            logs.forEach((log, index) => {
              thoughtHistory += `${index + 1}. ユーザー: ${log.message}\n`;
              if (log.gpt_thought) {
                thoughtHistory += `   AIの裏思考: ${log.gpt_thought}\n`;
              }
            });
            thoughtHistory += "\n";
          }
        }
      } catch (error) {
        console.error("🔍 API: 思考履歴取得で例外発生", error);
      }
    }

    const prompt = `${thoughtHistory}ユーザーのメッセージ:「${message}」

このメッセージについて、以下の形式で分析してください：

1. 分析: このメッセージの内容や背景について分析してください
2. 要約: このメッセージを1文で要約してください
3. タグ: このメッセージに関連する日本語のタグを3つ、カンマ区切りで出力してください

出力形式:
分析: ...
要約: ...
タグ: ...`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });
    
    const content = res.choices[0]?.message?.content ?? "";
    
    const thoughtMatch = content.match(/分析:\s*(.*)/);
    const summaryMatch = content.match(/要約:\s*(.*)/);
    const tagsMatch = content.match(/タグ:\s*(.*)/);
    
    const gptThought = thoughtMatch?.[1] ?? "";
    const summary = summaryMatch?.[1] ?? "";
    const tags = tagsMatch?.[1] ?? "";
    
    return NextResponse.json({ gptThought, summary, tags });
    
  } catch (error) {
    console.error("🔍 API: 例外発生", error);
    
    // エラーが発生した場合は空のレスポンスを返す
    return NextResponse.json({ gptThought: "", summary: "", tags: "" });
  }
} 
