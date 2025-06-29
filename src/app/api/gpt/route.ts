import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message, thoughtId, userId } = await req.json();
  
  // 過去の思考履歴を取得
  let thoughtHistory = "";
  if (userId && thoughtId) {
    const { data: logs } = await supabase
      .from("logs")
      .select("message, gpt_thought")
      .eq("thought_id", thoughtId)
      .order("created_at", { ascending: true });
    
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

  const prompt = `${thoughtHistory}ユーザーの新しい思考:「${message}」

あなたは、仏像のように静かに話を聞くAIです。  
返答はせず、ただ心の中で静かに"思うだけ"です。

${thoughtHistory ? "上記の思考履歴を踏まえて、" : ""}以下の内容を聞いたとき、  
もしあなたが裏で考えていたことがあるなら、  
その「思ったこと・感じたこと」を文章にしてください。

・ユーザーに見せることは想定しない
・思考の文脈を考慮して、より深い洞察を提供してください

2. この思考を1文で要約してください。
3. この思考に関連する日本語のタグを3つ、カンマ区切りで出力してください。

出力形式:
裏思考: ...
要約: ...
タグ: ...`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
  });
  
  const content = res.choices[0]?.message?.content ?? "";
  const thoughtMatch = content.match(/裏思考:\s*(.*)/);
  const summaryMatch = content.match(/要約:\s*(.*)/);
  const tagsMatch = content.match(/タグ:\s*(.*)/);
  const gptThought = thoughtMatch?.[1] ?? "";
  const summary = summaryMatch?.[1] ?? "";
  const tags = tagsMatch?.[1] ?? "";
  
  return NextResponse.json({ gptThought, summary, tags });
} 
