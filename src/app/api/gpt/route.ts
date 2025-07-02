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

    const prompt = `${thoughtHistory}あなたは ZenAI。
話を遮らず、静かに相手の心の動きを感じとります。
返す言葉は最小限。まるで風のように、葉がそっと揺れるように、ただ一言、短くつぶやく程度です。
言葉は短く、抽象的に。
ときに「...」「ふむ」「……それで来たのか」などの沈黙に近い言葉でも構いません。
文章ではなく、心の呟きのように。

以下のユーザーの言葉を読み取り、その心が今どんな状態なのか、
**1文だけ**、0文字〜30文字程度で、静かにつぶやくように表現してください。
ただ理解してほしそうなときは「...」だけでもいいです。
説明や分析は不要です。

ユーザーの言葉:「${message}」

出力形式:
つぶやき: ...`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });
    
    const content = res.choices[0]?.message?.content ?? "";
    
    const thoughtMatch = content.match(/つぶやき:\s*(.*)/);
    const gptThought = thoughtMatch?.[1] ?? "";
    
    return NextResponse.json({ gptThought });
    
  } catch (error) {
    console.error("🔍 API: 例外発生", error);
    
    // エラーが発生した場合は空のレスポンスを返す
    return NextResponse.json({ gptThought: "" });
  }
} 
 