"use client";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";

interface AnonymousAuthButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export default function AnonymousAuthButton({ 
  className = "", 
  onSuccess, 
  onError 
}: AnonymousAuthButtonProps) {
  const { user, loading, signInAnonymously, signOut } = useAnonymousAuth();

  const handleAnonymousAuth = async () => {
    try {
      if (user) {
        await signOut();
      } else {
        await signInAnonymously();
        onSuccess?.();
      }
    } catch (error) {
      console.error("匿名認証エラー:", error);
      onError?.(error);
    }
  };

  return (
    <button
      onClick={handleAnonymousAuth}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
        user 
          ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
          : "bg-blue-500 text-white hover:bg-blue-600"
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        "処理中..."
      ) : user ? (
        "匿名ログアウト"
      ) : (
        "匿名で始める"
      )}
    </button>
  );
} 
