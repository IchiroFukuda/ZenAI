import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAIクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Edge Runtimeを使用
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // AIに相槌を生成させる
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // 高速なモデルを使用
      messages: [
        {
          role: 'system',
          content: 'あなたは思慮深い仏像ロボットです。ユーザーの思考に対し、15文字以内の短い相槌（あいづち）を返してください。解説や句読点は不要です。相槌の言葉だけを返してください。例：「ふむ…」「なるほど」「興味深いですね」',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    const aizuchi = completion.choices[0]?.message?.content?.trim() || 'ふむ…';

    return NextResponse.json({ aizuchi });

  } catch (error) {
    console.error('Error generating aizuchi:', error);
    // エラー時もデフォルトの相槌を返すことでUIの安定性を保つ
    return NextResponse.json({ aizuchi: '……' }, { status: 500 });
  }
} 
