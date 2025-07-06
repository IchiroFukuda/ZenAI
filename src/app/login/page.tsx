"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // ログイン成功時にリダイレクト
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleEmailLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    if (isResetPassword) {
      // パスワードリセット
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setMessage("エラー: " + error.message);
      } else {
        setMessage("パスワードリセット用のリンクを送信しました。メールをご確認ください。");
      }
    } else if (isSignUp) {
      // サインアップ
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        setMessage("エラー: " + error.message);
      } else {
        setMessage("アカウントを作成しました。メールをご確認ください。");
      }
    } else {
      // ログイン
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("エラー: " + error.message);
      }
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const resetForm = () => {
    setIsSignUp(false);
    setIsResetPassword(false);
    setEmail("");
    setPassword("");
    setMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans px-4">
      <div className="w-full max-w-sm bg-white border border-blue-100 rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">
          {isResetPassword ? "パスワードリセット" : "ログイン"}
        </h1>
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
                placeholder="メールアドレス"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {!isResetPassword && (
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-blue-100 text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="パスワード"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              )}
              <button
                type="submit"
                className="w-full py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
                disabled={loading}
              >
                {loading ? "処理中..." : (
                  isResetPassword ? "リセットリンクを送信" : 
                  isSignUp ? "アカウント作成" : "ログイン"
                )}
              </button>
            </form>
            
            {!isResetPassword && (
              <div className="w-full flex flex-col items-center gap-2 mb-4">
                <div className="text-xs text-gray-400 mb-2">または</div>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                >
                  Googleでログイン
                </button>
              </div>
            )}
            
            <div className="w-full text-center space-y-2">
              {isResetPassword ? (
                <button
                  onClick={resetForm}
                  className="text-sm text-blue-500 hover:text-blue-700 transition block"
                >
                  ログイン画面に戻る
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setIsResetPassword(false);
                      setMessage("");
                    }}
                    className="text-sm text-blue-500 hover:text-blue-700 transition block"
                  >
                    {isSignUp ? "既存のアカウントでログイン" : "新規アカウント作成"}
                  </button>
                  <button
                    onClick={() => {
                      setIsResetPassword(true);
                      setIsSignUp(false);
                      setMessage("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition block"
                  >
                    パスワードを忘れた場合
                  </button>
                </>
              )}
            </div>
            
            {message && <div className="mt-4 text-sm text-center text-blue-500">{message}</div>}
          </>
        )}
      </div>
    </div>
  );
} 
