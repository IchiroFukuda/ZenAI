"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Lottie from "lottie-react";
import aura from "@/assets/aura01.json";
import ClientLayout from "@/components/ClientLayout";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import AIOutputBox from "@/components/AIOutputBox";

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
  const [logs, setLogs] = useState<Log[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const thoughtManagerRef = useRef<any>(null);
  const [aiOutputs, setAIOutputs] = useState<any[]>([]);
  const [aiLoading, setAILoading] = useState(false);

  const { user, loading: authLoading } = useAutoAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // ログイン状態の取得中は何もしない
      if (authLoading) {
        setLoading(false);
        return;
      }
      
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
        
        // デバッグ用：ログの内容を確認
        console.log("Fetched logs:", logsResult.data);
        console.log("Selected thought ID:", selectedThoughtId);
        
        if (thoughtsResult.data && thoughtsResult.data.length > 0 && !selectedThoughtId) {
          setSelectedThoughtId(thoughtsResult.data[0].id);
        }
      } else {
        const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
        // ローカルストレージのログにidフィールドがない場合に追加
        const processedLocalLogs = localLogs.map((log: any, index: number) => ({
          ...log,
          id: log.id || `local-log-${index}`,
          thought_id: null
        }));
        setLogs(processedLocalLogs);
        setThoughts([]);
        setInsights([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, authLoading]);

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
    
    // デバッグ用：更新されたログの内容を確認
    console.log("Updated logs:", logsResult.data);
  }, [user]);

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
    
    const sortedItems = chatItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // デバッグ用：マージされたデータの内容を確認
    console.log("Filtered logs:", filteredLogs);
    console.log("Merged chat data:", sortedItems);
    
    return sortedItems;
  }, [filteredLogs, filteredInsights]);

  const getThoughtTitle = (thoughtId: string) => {
    const thought = thoughts.find(t => t.id === thoughtId);
    return thought?.title || "不明な記録";
  };

  const handleAskSummary = async () => {
    if (!user && logs.length === 0) return;
    
    setSummaryLoading(true);
    
    try {
      let requestBody;
      
      if (user && selectedThoughtId) {
        // ログイン済みの場合
        requestBody = { 
          thoughtId: selectedThoughtId, 
          userId: user.id
        };
      } else {
        // 未ログインの場合、ローカルストレージのログを使用
        const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
        requestBody = { 
          localLogs: localLogs,
          userId: null
        };
      }
      
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      if (data.insight) {
        // 新しい気づきが生成されたら、データを再取得してマージされたチャットに反映
        if (user) {
          fetchLatestData();
        } else {
          // 未ログインの場合はローカルストレージに気づきを保存
          const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
          const newInsight = {
            id: `local-insight-${Date.now()}`,
            insight: data.insight,
            created_at: new Date().toISOString(),
            thought_id: null
          };
          setInsights(prev => [...prev, newInsight]);
        }
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

  // ローカルストレージの変更を監視（未ログイン時のみ）
  useEffect(() => {
    if (user) return; // ログイン済みの場合は不要
    
    const handleStorageChange = () => {
      const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
      const processedLocalLogs = localLogs.map((log: any, index: number) => ({
        ...log,
        id: log.id || `local-log-${index}`,
        thought_id: null
      }));
      setLogs(processedLocalLogs);
    };

    // 初期読み込み
    handleStorageChange();

    // ストレージ変更イベントを監視
    window.addEventListener('storage', handleStorageChange);
    
    // カスタムイベントでローカルストレージの変更を監視
    const handleCustomStorageChange = () => {
      handleStorageChange();
    };
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [user]);

  // 選択中のthought_idのAIアウトプットをDBから取得
  const fetchAIOutputs = async () => {
    if (!user || !selectedThoughtId) return;
    setAILoading(true);
    
    try {
      // 特定のthought_idのAIアウトプットを取得
      const { data: aiOutputsData, error } = await supabase
        .from("ai_outputs")
        .select("type, content, user_id, thought_id")
        .eq("thought_id", selectedThoughtId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("AIアウトプット取得エラー:", error);
        setAIOutputs([]);
      } else {
        setAIOutputs(aiOutputsData || []);
      }
    } catch (error) {
      console.error("AIアウトプット取得エラー:", error);
      setAIOutputs([]);
    } finally {
      setAILoading(false);
    }
  };

  // thoughtId変更時にAIアウトプットを取得
  useEffect(() => {
    if (user && selectedThoughtId) {
      fetchAIOutputs();
    } else {
      setAIOutputs([]);
    }
  }, [user, selectedThoughtId]);



  return (
    <ClientLayout
      user={user}
      currentThoughtId={selectedThoughtId}
      onThoughtSelect={setSelectedThoughtId}
      onNewThought={async () => {}}
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
            {authLoading || loading ? (
              <div className="text-gray-400 text-center">読み込み中...</div>
            ) : (
              <>
                <AIOutputBox aiOutputs={aiOutputs} />
                {aiLoading && (
                  <div className="text-center text-blue-500">AI考察を読み込み中...</div>
                )}
                {(!aiOutputs || aiOutputs.length === 0) && !aiLoading && (
                  <div className="text-gray-400 text-center">AI考察はまだありません。</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
} 
 