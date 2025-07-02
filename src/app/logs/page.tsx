"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Log {
  id: string;
  message: string;
  gpt_thought: string;
  summary: string;
  tags: string;
  created_at: string;
  thought_id?: string;
}

interface Thought {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function LogsPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (user) {
        // ログイン時はDBから取得
        const [logsResult, thoughtsResult] = await Promise.all([
          supabase.from("logs")
            .select("id, message, gpt_thought, summary, tags, created_at, thought_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("thoughts")
            .select("id, title, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
        ]);
        
        setLogs(logsResult.data || []);
        setThoughts(thoughtsResult.data || []);
        
        // 最新の記録を自動選択
        if (thoughtsResult.data && thoughtsResult.data.length > 0 && !selectedThoughtId) {
          setSelectedThoughtId(thoughtsResult.data[0].id);
        }
      } else {
        // 未ログイン時はlocalStorageから取得
        const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
        setLogs(localLogs);
        setThoughts([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, selectedThoughtId]);

  const fetchLatestData = useCallback(async () => {
    if (!user) return;

    const [logsResult, thoughtsResult] = await Promise.all([
      supabase.from("logs")
        .select("id, message, gpt_thought, summary, tags, created_at, thought_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("thoughts")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
    ]);
    
    setLogs(logsResult.data || []);
    setThoughts(thoughtsResult.data || []);
  }, [user]);

  // 自動更新のためのポーリング（生成中のログがある場合のみ）
  useEffect(() => {
    if (!user) return;

    // 現在表示されているログの中で生成中のものがあるかチェック
    const currentLogs = selectedThoughtId 
      ? logs.filter(log => log.thought_id === selectedThoughtId)
      : logs;
    
    // 最新のログのみをチェック（最新の1件）
    const latestLog = currentLogs[0];
    const isGenerating = latestLog && (!latestLog.gpt_thought || latestLog.gpt_thought.trim() === '');
    
    if (!isGenerating) {
      return;
    }

    // ポーリング方式（3秒ごとに更新）
    const pollingInterval = setInterval(() => {
      fetchLatestData();
    }, 3000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [user, fetchLatestData, logs, selectedThoughtId]);

  const filteredLogs = selectedThoughtId 
    ? logs.filter(log => log.thought_id === selectedThoughtId)
    : logs;

  const getThoughtTitle = (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    return thought?.title || "不明な記録";
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* サイドバー */}
      <div className="w-80 border-r border-blue-100 p-6 bg-blue-25">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">記録一覧</h2>
        <div className="space-y-2">
          {thoughts.map((thought) => {
            const thoughtLogs = logs.filter(log => log.thought_id === thought.id);
            return (
              <button
                key={thought.id}
                onClick={() => setSelectedThoughtId(thought.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedThoughtId === thought.id
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200 hover:bg-blue-25"
                }`}
              >
                <div className="font-medium text-gray-900 truncate">
                  {thought.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {thoughtLogs.length}件の思考
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center py-16">
        <div className="w-full max-w-4xl px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-blue-700">
              {selectedThoughtId 
                ? `記録: ${getThoughtTitle(selectedThoughtId)}`
                : "思考ログ一覧"
              }
            </h1>
          </div>
          
          <div className="space-y-6">
            {loading ? (
              <div className="text-gray-400 text-center">読み込み中...</div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => (
                <div key={log.id || idx} className="flex flex-col sm:flex-row gap-4 bg-white border border-blue-100 rounded-xl shadow p-6">
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
                    <div className="text-base text-blue-700 whitespace-pre-line break-words">
                      {log.gpt_thought ? (
                        log.gpt_thought
                      ) : (
                        // 最新のログかどうかを判定（作成日時が最新のもの）
                        (() => {
                          const isLatestLog = filteredLogs.length > 0 && log.id === filteredLogs[0].id;
                          if (isLatestLog) {
                            return (
                              <div className="flex items-center text-gray-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                生成中...
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-red-400 text-sm">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  生成に失敗しました
                                </div>
                              </div>
                            );
                          }
                        })()
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center">
                {selectedThoughtId ? "この記録にはまだ思考ログがありません。" : "まだ思考ログはありません。"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
 