"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 公式ドキュメントに従った実装
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('認証状態変更:', event, session?.user?.email);
      
      if (event === "PASSWORD_RECOVERY") {
        console.log('パスワードリカバリーイベント検出');
        if (session?.user) {
          setUser(session.user);
        }
      } else if (event === "SIGNED_IN") {
        if (session?.user) {
          setUser(session.user);
        }
      } else if (event === "SIGNED_OUT") {
        router.push('/login');
      }
    });
  }, [router]);

  const handlePasswordReset = async (e: any) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage("パスワードが一致しません。");
      return;
    }

    if (password.length < 6) {
      setMessage("パスワードは6文字以上で入力してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setMessage("エラー: " + error.message);
      } else {
        setMessage("パスワードが正常に更新されました。");
        setTimeout(() => {
          supabase.auth.signOut();
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      setMessage("エラーが発生しました。");
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">認証状態を確認中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans px-4">
      <div className="w-full max-w-sm bg-white border border-blue-100 rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">パスワードを更新</h1>
        
        <div className="mb-4 text-center">
          <div className="text-gray-700 mb-2">
            アカウント: <span className="font-semibold">{user.email}</span>
          </div>
          <div className="text-sm text-gray-500">新しいパスワードを設定してください</div>
        </div>

        <form onSubmit={handlePasswordReset} className="w-full flex flex-col gap-4 mb-6">
          <input
            type="password"
            className="w-full px-4 py-3 rounded-lg border border-blue-100 text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="新しいパスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            type="password"
            className="w-full px-4 py-3 rounded-lg border border-blue-100 text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="新しいパスワード（確認）"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            className="w-full py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? "更新中..." : "パスワードを更新"}
          </button>
        </form>

        <button
          onClick={() => router.push('/login')}
          className="text-sm text-blue-500 hover:text-blue-700 transition"
        >
          ログイン画面に戻る
        </button>

        {message && (
          <div className={`mt-4 text-sm text-center ${
            message.includes("エラー") ? "text-red-500" : "text-blue-500"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 
