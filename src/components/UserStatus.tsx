"use client";
import { useAutoAuth } from "@/hooks/useAutoAuth";

interface UserStatusProps {
  className?: string;
}

export default function UserStatus({ className = "" }: UserStatusProps) {
  const { user } = useAutoAuth();

  // 匿名ユーザーまたは未ログインの場合は何も表示しない
  if (!user) {
    return null;
  }

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        {user.email}
      </span>
    </div>
  );
} 
