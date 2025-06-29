"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Thought {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ThoughtManagerProps {
  currentThoughtId: string | null;
  onThoughtSelect: (thoughtId: string | null) => void;
  onNewThought: () => void;
}

export default function ThoughtManager({
  currentThoughtId,
  onThoughtSelect,
  onNewThought,
}: ThoughtManagerProps) {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (user) {
      loadThoughts();
    } else {
      setThoughts([]);
      setLoading(false);
    }
  }, [user]);

  const loadThoughts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("thoughts")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    
    if (error) {
      console.error("Error loading thoughts:", error);
    } else {
      setThoughts(data || []);
    }
    setLoading(false);
  };

  const handleNewThought = async () => {
    // 新規セッション開始のフラグを立てるだけ（実際の作成はメインページで行う）
    onNewThought();
  };

  if (!user) {
    return (
      <div className="text-center text-gray-500 text-sm">
        ログインすると思考履歴を管理できます
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-700">思考セッション</h3>
        <button
          onClick={handleNewThought}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
        >
          新規セッション
        </button>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {thoughts.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            思考セッションがありません
          </div>
        ) : (
          thoughts.map((thought) => (
            <button
              key={thought.id}
              onClick={() => onThoughtSelect(thought.id)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                currentThoughtId === thought.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 hover:border-blue-200 hover:bg-blue-25"
              }`}
            >
              <div className="font-medium text-gray-900 truncate">
                {thought.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(thought.updated_at).toLocaleString("ja-JP")}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
} 
