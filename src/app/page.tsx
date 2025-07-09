"use client";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatInterface from "@/components/ChatInterface";
import BackgroundImage from "@/components/BackgroundImage";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import ClientLayout from "@/components/ClientLayout";
import { useChat } from "@/hooks/useChat";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { useRef as useComponentRef } from "react";
import { useEffect as useFadeEffect, useState as useFadeState } from "react";
import { useRef as useFadeRef } from "react";

export default function MainPage() {
  const [currentThoughtId, setCurrentThoughtId] = useState<string | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);
  const thoughtManagerRef = useComponentRef<any>(null);

  // オンボーディングメッセージ表示用
  const [showOnboardingMessage, setShowOnboardingMessage] = useFadeState(false);
  const [isVisible, setIsVisible] = useFadeState(false);
  const prevLogsLength = useFadeRef(0);

  const { user } = useAutoAuth();
  const { logs, loading, isAuraVisible, handleSend: sendMessage, createNewThought: createThought } = useChat(user, currentThoughtId);
  const { showOnboarding, handleCloseOnboarding } = useOnboarding();

  // ユーザーが変わった時に最新の記録を自動選択
  useEffect(() => {
    if (user && !currentThoughtId) {
      loadLatestThought();
    }
  }, [user, currentThoughtId]);

  // チャット履歴が空のときだけオンボーディングメッセージを表示
  useFadeEffect(() => {
    if (prevLogsLength.current === 0 && logs.length === 1) {
      setIsVisible(true);
      // 100ms遅延でopacity-100に（マウント直後のopacity-0を確実に反映させるため）
      setTimeout(() => setShowOnboardingMessage(true), 100);
      const timer = setTimeout(() => setShowOnboardingMessage(false), 8000);
      prevLogsLength.current = logs.length;
      return () => clearTimeout(timer);
    }
    prevLogsLength.current = logs.length;
  }, [logs.length]);

  // フェードアウト後にDOMを消す
  const handleTransitionEnd = () => {
    if (!showOnboardingMessage) {
      setIsVisible(false);
    }
  };

  const loadLatestThought = async () => {
    if (!user) return;
    // 直前に再チェック
    const { data, error } = await supabase
      .from("thoughts")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      setCurrentThoughtId(data.id);
    } else {
      // 作成直前に再度確認
      const { data: checkData } = await supabase
        .from("thoughts")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (checkData) {
        setCurrentThoughtId(checkData.id);
        return;
      }
      // それでもなければ新規作成
      const now = new Date();
      const title = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日の記録`;
      const { data: newThought, error: insertError } = await supabase
        .from("thoughts")
        .insert([{ title, user_id: user.id }])
        .select("id")
        .single();
      if (newThought && !insertError) {
        setCurrentThoughtId(newThought.id);
      }
    }
  };

  const handleSend = (message: string) => {
    sendMessage(message, isNewSession, setCurrentThoughtId);
    setIsNewSession(false);
  };

  const handleThoughtSelect = (thoughtId: string | null) => {
    setCurrentThoughtId(thoughtId);
    setIsNewSession(false);
  };

  const handleNewThought = async () => {
    if (!user) return;
    const newThoughtId = await createThought();
    if (newThoughtId) {
      setCurrentThoughtId(newThoughtId);
      setIsNewSession(false);
      // サイドバーのリストを即時更新
      if (thoughtManagerRef.current && thoughtManagerRef.current.loadThoughts) {
        await thoughtManagerRef.current.loadThoughts();
      }
    }
  };

  return (
    <ClientLayout
      user={user}
      currentThoughtId={currentThoughtId}
      onThoughtSelect={handleThoughtSelect}
      onNewThought={handleNewThought}
      thoughtManagerRef={thoughtManagerRef}
    >
      {isVisible && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${showOnboardingMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={() => setShowOnboardingMessage(false)}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className="bg-black/40 absolute inset-0" />
          <div className="relative bg-white/70 text-gray-700 rounded-xl px-8 py-6 shadow-lg text-center text-lg font-medium z-10">
            zenAIはあなたの言葉に返事をしませんが、<br />ただ耳を傾けあなたのことを理解しようと努めています。<br />
            zenAIの気づきを聞きたい場合は<br />ログ一覧画面へ移動してください
          </div>
        </div>
      )}
      <BackgroundImage isAuraVisible={isAuraVisible} />
      <ChatInterface
        logs={logs}
        loading={loading}
        onSend={handleSend}
      />
      <OnboardingOverlay
        showOnboarding={showOnboarding}
        onClose={handleCloseOnboarding}
      />
    </ClientLayout>
  );
} 
