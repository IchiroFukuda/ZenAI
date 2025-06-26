import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const prompt = `ユーザーの思考:「${message}」\nあなたは、仏像のように静かに話を聞くAIです。  
返答はせず、ただ心の中で静かに“思うだけ”です。

以下の内容を聞いたとき、  
もしあなたが裏で考えていたことがあるなら、  
その「思ったこと・感じたこと」を文章にしてください。

・ユーザーに見せることは想定しない
・優しさや思いやりのある目線で`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
  });
  const gptThought = res.choices[0]?.message?.content ?? "";
  return NextResponse.json({ gptThought });
} 
