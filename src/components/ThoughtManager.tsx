"use client";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
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
  onNewThought: () => Promise<void>;
  showNewButton?: boolean;
}

const ThoughtManager = forwardRef(function ThoughtManager({
  currentThoughtId,
  onThoughtSelect,
  onNewThought,
  showNewButton = true,
}: ThoughtManagerProps, ref) {
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

  useImperativeHandle(ref, () => ({
    loadThoughts,
  }));

  const handleNewThought = async () => {
    await onNewThought();
    await loadThoughts();
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
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-700">記録</h3>
        {showNewButton && (
          <button
            onClick={handleNewThought}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
          >
            新規記録
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {thoughts.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            記録がありません
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
});

export default ThoughtManager; 
 