import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const prompt = `ユーザーの思考:「${message}」\n1. ユーザーの思考:「${message}」\nあなたは、仏像のように静かに話を聞くAIです。  
返答はせず、ただ心の中で静かに“思うだけ”です。

以下の内容を聞いたとき、  
もしあなたが裏で考えていたことがあるなら、  
その「思ったこと・感じたこと」を文章にしてください。

・ユーザーに見せることは想定しない
・優しさや思いやりのある目線で　\n2. この思考を1文で要約してください。\n3. この思考に関連する日本語のタグを3つ、カンマ区切りで出力してください。\n出力形式:\n裏思考: ...\n要約: ...\nタグ: ...`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
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
