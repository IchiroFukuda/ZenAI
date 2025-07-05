"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const handleEmailLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage("エラー: " + error.message);
    } else {
      setMessage("リンクを送信しました。メールをご確認ください。");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans px-4">
      <div className="w-full max-w-sm bg-white border border-blue-100 rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">ログイン</h1>
        {user ? (
          <>
            <div className="mb-4 text-center">
              <div className="text-gray-700">ログイン中: <span className="font-semibold">{user.email}</span></div>
            </div>
            <button onClick={handleLogout} className="w-full py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition">ログアウト</button>
          </>
        ) : (
          <>
            <form onSubmit={handleEmailLogin} className="w-full flex flex-col gap-4 mb-6">
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-blue-100 text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="メールアドレスを入力"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
                disabled={loading}
              >
                {loading ? "送信中..." : "Magic Linkでログイン"}
              </button>
            </form>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="text-xs text-gray-400 mb-2">または</div>
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
              >
                Googleでログイン
              </button>
            </div>
            {message && <div className="mt-4 text-sm text-center text-blue-500">{message}</div>}
          </>
        )}
      </div>
    </div>
  );
} 
