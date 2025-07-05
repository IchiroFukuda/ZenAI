"use client";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatInterface from "@/components/ChatInterface";
import BackgroundImage from "@/components/BackgroundImage";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import ClientLayout from "@/components/ClientLayout";
import { useChat } from "@/hooks/useChat";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useRef as useComponentRef } from "react";

export default function MainPage() {
  const [user, setUser] = useState<any>(null);
  const [currentThoughtId, setCurrentThoughtId] = useState<string | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);
  const thoughtManagerRef = useComponentRef<any>(null);

  const { logs, loading, isAuraVisible, handleSend: sendMessage, createNewThought: createThought } = useChat(user, currentThoughtId);
  const { showOnboarding, handleCloseOnboarding } = useOnboarding();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // ユーザーが変わった時に最新の記録を自動選択
  useEffect(() => {
    if (user && !currentThoughtId) {
      loadLatestThought();
    }
  }, [user, currentThoughtId]);

  const loadLatestThought = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("thoughts")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    if (data && !error) {
      setCurrentThoughtId(data.id);
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
