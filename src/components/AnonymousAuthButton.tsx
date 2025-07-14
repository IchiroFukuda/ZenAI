"use client";
import { useAutoAuth } from "@/hooks/useAutoAuth";

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
  const { user, loading, isAnonymous, signOut } = useAutoAuth();

  // 匿名認証はuseAutoAuthで自動実行されるため、ボタン押下時の処理は不要

  return (
    <button
      className={className}
      disabled={loading || isAnonymous}
      onClick={() => {}}
    >
      匿名で始める
    </button>
  );
} 
