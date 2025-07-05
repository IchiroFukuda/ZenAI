"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Lottie from "lottie-react";
import aura from "@/assets/aura01.json";
import ClientLayout from "@/components/ClientLayout";

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

interface LogsPageProps {
  sidebarOpen?: boolean;
}

export default function LogsPage({ sidebarOpen = false }: LogsPageProps) {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const thoughtManagerRef = useRef<any>(null);

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
        const [logsResult, thoughtsResult, insightsResult] = await Promise.all([
          supabase.from("logs")
            .select("id, message, gpt_thought, summary, tags, created_at, thought_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
          supabase.from("thoughts")
            .select("id, title, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),
          supabase.from("insights")
            .select("id, insight, created_at, thought_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
        ]);
        
        setLogs(logsResult.data || []);
        setThoughts(thoughtsResult.data || []);
        setInsights(insightsResult.data || []);
        
        if (thoughtsResult.data && thoughtsResult.data.length > 0 && !selectedThoughtId) {
          setSelectedThoughtId(thoughtsResult.data[0].id);
        }
      } else {
        const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
        setLogs(localLogs);
        setThoughts([]);
        setInsights([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const fetchLatestData = useCallback(async () => {
    if (!user) return;

    const [logsResult, thoughtsResult, insightsResult] = await Promise.all([
      supabase.from("logs")
        .select("id, message, gpt_thought, summary, tags, created_at, thought_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase.from("thoughts")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase.from("insights")
        .select("id, insight, created_at, thought_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
    ]);
    
    setLogs(logsResult.data || []);
    setThoughts(thoughtsResult.data || []);
    setInsights(insightsResult.data || []);
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
  }, [user, logs, selectedThoughtId]);

  const filteredLogs = selectedThoughtId 
    ? logs.filter(log => log.thought_id === selectedThoughtId)
    : logs;
    
  const filteredInsights = selectedThoughtId
    ? insights.filter(insight => insight.thought_id === selectedThoughtId)
    : insights;

  const mergedChatData = useMemo(() => {
    const chatItems: Array<{
      type: 'chat' | 'insight';
      id: string;
      timestamp: Date;
      data: any;
    }> = [];
    
    filteredLogs.forEach(log => {
      chatItems.push({
        type: 'chat',
        id: log.id,
        timestamp: new Date(log.created_at),
        data: log
      });
    });
    
    filteredInsights.forEach(insight => {
      chatItems.push({
        type: 'insight',
        id: insight.id,
        timestamp: new Date(insight.created_at),
        data: insight
      });
    });
    
    return chatItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [filteredLogs, filteredInsights]);

  const getThoughtTitle = (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    return thought?.title || "不明な記録";
  };

  const handleAskSummary = async () => {
    if (!selectedThoughtId || !user) return;
    
    setSummaryLoading(true);
    
    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          thoughtId: selectedThoughtId, 
          userId: user.id
        }),
      });
      
      const data = await res.json();
      if (data.insight) {
        // 新しい気づきが生成されたら、データを再取得してマージされたチャットに反映
        fetchLatestData();
      } else {
        console.error("Insight generation error:", data.error);
      }
    } catch (error) {
      console.error("Insight generation error:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleThoughtSelect = (thoughtId: string | null) => {
    setSelectedThoughtId(thoughtId);
  };

  const handleNewThought = async () => {
    // ログ一覧ページでは新規作成は不要なので空の実装
  };

  return (
    <ClientLayout
      user={user}
      currentThoughtId={selectedThoughtId}
      onThoughtSelect={handleThoughtSelect}
      onNewThought={handleNewThought}
      thoughtManagerRef={thoughtManagerRef}
      showNewButton={false}
    >
      <div className="bg-white flex flex-col font-sans relative" style={{ fontFamily: 'Inter, Noto Sans JP, sans-serif' }}>
        {/* 仏像背景（中央寄せ） */}
        <div className="fixed inset-0 z-0 pointer-events-none select-none flex items-center justify-center">
          <div className="relative w-full md:w-auto" style={{ width: "100vw", height: "90vh" }}>
            <div
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: "100vw",
                height: "90vh",
                transform: "translate(-50%, -50%)",
                zIndex: 0,
              }}
            >
              <Lottie
                animationData={aura}
                loop
                autoplay
                style={{ width: "100%", height: "100%", opacity: 0.3 }}
              />
            </div>
            <Image
              src="/robot_transparent.png"
              alt="仏像ロボット"
              width={600}
              height={900}
              className="absolute object-contain opacity-40 w-full h-full"
              priority
              style={{
                left: '50%',
                top: '50%',
                transform: "translate(-50%, -50%)",
                zIndex: 1,
              }}
            />
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="w-full px-4 md:px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
              <div className="text-gray-400 text-center">読み込み中...</div>
            ) : mergedChatData && mergedChatData.length > 0 ? (
              <>
                {mergedChatData.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-3">
                    {item.type === 'chat' ? (
                      <>
                        {/* ユーザーの思考 */}
                        <div className="flex justify-end">
                          <div className="max-w-3xl bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 shadow-sm">
                            <div className="text-xs text-blue-500 mb-1">あなたの思考</div>
                            <div className="text-base text-gray-800 whitespace-pre-line break-words">{item.data.message}</div>
                            {item.data.summary && (
                              <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-100">
                                要約: <span className="text-gray-700">{item.data.summary}</span>
                              </div>
                            )}
                            {item.data.tags && (
                              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-blue-100">
                                {item.data.tags.split(",").map((tag: string, i: number) => (
                                  <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{tag.trim()}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* AIの裏思考 */}
                        <div className="flex justify-start">
                          <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">AIの裏思考</div>
                            <div className="text-base text-gray-700 whitespace-pre-line break-words">
                              {item.data.gpt_thought ? (
                                item.data.gpt_thought
                              ) : (
                                (() => {
                                  const isLatestLog = filteredLogs.length > 0 && item.data.id === filteredLogs[filteredLogs.length - 1].id;
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
                      </>
                    ) : (
                      /* insight表示 */
                      <div className="flex justify-center">
                        <div className="max-w-2xl bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1 font-medium">AIからの気づき</div>
                          <div className="text-base text-gray-700 font-medium">{item.data.insight}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {selectedThoughtId && (
                  <div className="flex justify-center my-6">
                    <button
                      onClick={handleAskSummary}
                      disabled={summaryLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-md"
                    >
                      {summaryLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          気づきを生成中...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          気づきを求める
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400 text-center">
                {selectedThoughtId ? "この記録にはまだ思考ログがありません。" : "まだ思考ログはありません。"}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
} 
 