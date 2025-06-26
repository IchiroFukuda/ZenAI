import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  // サーバーサイドで全ログを取得
  const { data: logs, error } = await supabase.from("logs").select("id, message, gpt_thought, summary, tags, created_at").order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 font-sans">
      <h1 className="text-2xl font-bold mb-8 text-blue-700">思考ログ一覧</h1>
      <div className="w-full max-w-2xl space-y-6">
        {logs && logs.length > 0 ? (
          logs.map(log => (
            <div key={log.id} className="flex flex-col sm:flex-row gap-4 bg-white border border-blue-100 rounded-xl shadow p-6">
              <div className="flex-1">
                <div className="text-xs text-blue-400 mb-1">あなたの思考</div>
                <div className="text-base text-gray-800 whitespace-pre-line break-words mb-2">{log.message}</div>
                {log.summary && (
                  <div className="text-xs text-blue-500 mb-2">要約: <span className="text-gray-700">{log.summary}</span></div>
                )}
                {log.tags && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {log.tags.split(",").map((tag: string, i: number) => (
                      <span key={i} className="inline-block bg-blue-50 text-blue-500 text-xs px-2 py-1 rounded-full border border-blue-100">{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 border-t sm:border-t-0 sm:border-l border-blue-50 pl-0 sm:pl-6 pt-4 sm:pt-0">
                <div className="text-xs text-blue-400 mb-1">AIの裏思考</div>
                <div className="text-base text-blue-700 whitespace-pre-line break-words">{log.gpt_thought || <span className="text-gray-300">（生成中…）</span>}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center">まだ思考ログはありません。</div>
        )}
      </div>
    </div>
  );
} 
